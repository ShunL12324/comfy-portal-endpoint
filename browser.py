import asyncio
import atexit
import enum
import os
import signal
from typing import Optional, Any, List

from .logger import get_logger

logger = get_logger()

# Default number of pages in the pool
DEFAULT_POOL_SIZE = 2


class BrowserStatus(enum.Enum):
    NOT_INSTALLED = "not_installed"
    NOT_INITIALIZED = "not_initialized"
    INITIALIZING = "initializing"
    READY = "ready"
    ERROR = "error"


class HeadlessBrowserManager:
    """Manages a headless Chromium browser with a page pool for workflow conversion.

    Uses Playwright to load the ComfyUI frontend in a headless browser,
    then calls the graphToPrompt JS function via page.evaluate().
    A pool of pages allows concurrent conversions without blocking.
    """

    def __init__(self, pool_size: int = DEFAULT_POOL_SIZE):
        self._status: BrowserStatus = BrowserStatus.NOT_INITIALIZED
        self._error_message: Optional[str] = None
        self._playwright = None
        self._browser = None
        self._driver_pid: Optional[int] = None
        self._contexts: List = []
        self._page_pool: asyncio.Queue = None
        self._pool_size = pool_size
        self._init_lock: Optional[asyncio.Lock] = None

        # Register synchronous cleanup at process exit
        atexit.register(self._sync_cleanup)

    def _get_init_lock(self) -> asyncio.Lock:
        """Lazily create the init lock (must be in an event loop context)."""
        if self._init_lock is None:
            self._init_lock = asyncio.Lock()
        return self._init_lock

    @property
    def status(self) -> BrowserStatus:
        return self._status

    @property
    def error_message(self) -> Optional[str]:
        return self._error_message

    def _get_comfyui_url(self) -> str:
        """Get the ComfyUI server URL from PromptServer instance."""
        from server import PromptServer

        server_instance = PromptServer.instance
        address = server_instance.address
        port = server_instance.port

        # Map 0.0.0.0 to 127.0.0.1 for local access
        if address == "0.0.0.0":
            address = "127.0.0.1"

        return f"http://{address}:{port}"

    async def _wait_for_comfyui_ready(self, page) -> None:
        """Wait for ComfyUI frontend to be fully loaded on a page."""
        # Wait for LiteGraph to be loaded (window.LGraph)
        await page.wait_for_function(
            "() => typeof window.LGraph !== 'undefined'",
            timeout=30000,
        )

        # Wait for our plugin JS to expose __cpe_graphToPrompt
        await page.wait_for_function(
            "() => typeof window.__cpe_graphToPrompt !== 'undefined'",
            timeout=30000,
        )

        # Wait for ComfyUI node types to be registered
        await page.wait_for_function(
            """() => {
                if (typeof LiteGraph === 'undefined') return false;
                const types = LiteGraph.registered_node_types;
                return types && Object.keys(types).length > 0;
            }""",
            timeout=60000,
        )

    async def _create_page(self, comfyui_url: str):
        """Create a new browser context + page and wait for ComfyUI to load."""
        context = await self._browser.new_context()
        page = await context.new_page()

        await page.goto(comfyui_url, timeout=60000, wait_until="domcontentloaded")
        await self._wait_for_comfyui_ready(page)

        self._contexts.append(context)
        return page

    async def initialize(self) -> None:
        """Initialize the headless browser and create a pool of pages.

        This is idempotent - if already READY, it returns immediately.
        Uses _init_lock to prevent concurrent initialization.
        """
        if self._status == BrowserStatus.READY and self._page_pool is not None:
            return

        init_lock = self._get_init_lock()
        async with init_lock:
            # Double-check after acquiring lock
            if self._status == BrowserStatus.READY and self._page_pool is not None:
                return

            self._status = BrowserStatus.INITIALIZING
            self._error_message = None

            try:
                from playwright.async_api import async_playwright
            except ImportError:
                self._status = BrowserStatus.NOT_INSTALLED
                self._error_message = "Playwright is not installed. Run: pip install playwright"
                logger.error(self._error_message)
                raise RuntimeError(self._error_message)

            try:
                comfyui_url = self._get_comfyui_url()
                logger.info("Initializing headless browser for ComfyUI at %s", comfyui_url)

                # Start Playwright
                self._playwright = await async_playwright().start()

                # Launch Chromium with memory-optimized flags
                self._browser = await self._playwright.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--disable-extensions",
                        "--disable-background-networking",
                        "--disable-default-apps",
                        "--disable-sync",
                        "--disable-translate",
                        "--no-first-run",
                        "--mute-audio",
                    ],
                )

                # Capture Playwright driver PID for reliable atexit cleanup.
                # The driver subprocess manages Chromium — killing it cascades
                # to the browser process as well.
                try:
                    transport = self._playwright._connection._transport
                    self._driver_pid = transport._proc.pid
                    logger.info("Playwright driver PID: %d", self._driver_pid)
                except Exception:
                    logger.warning("Could not capture Playwright driver PID")

                # Create page pool
                self._page_pool = asyncio.Queue()
                self._contexts = []

                logger.info("Creating %d browser pages...", self._pool_size)
                for i in range(self._pool_size):
                    logger.info("Loading ComfyUI page %d/%d...", i + 1, self._pool_size)
                    page = await self._create_page(comfyui_url)
                    await self._page_pool.put(page)

                node_count = await (await self._peek_page()).evaluate(
                    "() => Object.keys(LiteGraph.registered_node_types).length"
                )
                logger.info("ComfyUI node types registered: %d types loaded", node_count)

                self._status = BrowserStatus.READY
                logger.info(
                    "Headless browser initialized with %d pages, ready for workflow conversion",
                    self._pool_size,
                )

            except Exception as e:
                self._status = BrowserStatus.ERROR
                self._error_message = f"Failed to initialize headless browser: {str(e)}"
                logger.error(self._error_message)
                # Clean up partial initialization
                await self._cleanup()
                raise RuntimeError(self._error_message) from e

    async def _peek_page(self):
        """Get a page from the pool temporarily for inspection, then put it back."""
        page = await self._page_pool.get()
        await self._page_pool.put(page)
        return page

    async def _cleanup(self) -> None:
        """Clean up all browser resources."""
        try:
            # Drain and close all pages
            if self._page_pool is not None:
                while not self._page_pool.empty():
                    try:
                        page = self._page_pool.get_nowait()
                        await page.close()
                    except Exception:
                        pass
                self._page_pool = None

            # Close all contexts
            for ctx in self._contexts:
                try:
                    await ctx.close()
                except Exception:
                    pass
            self._contexts = []

            if self._browser is not None:
                try:
                    await self._browser.close()
                except Exception:
                    pass
                self._browser = None

            if self._playwright is not None:
                try:
                    await self._playwright.stop()
                except Exception:
                    pass
                self._playwright = None

            self._driver_pid = None
        except Exception as e:
            logger.error("Error during browser cleanup: %s", str(e))

    def _sync_cleanup(self) -> None:
        """Synchronous cleanup for atexit — kills Playwright driver process by PID.

        The Playwright driver (a Node.js subprocess) manages the Chromium browser.
        Killing the driver cascades to the browser process automatically.
        """
        if self._driver_pid is not None:
            try:
                os.kill(self._driver_pid, signal.SIGTERM)
                logger.info("Sent SIGTERM to Playwright driver (PID %d)", self._driver_pid)
            except ProcessLookupError:
                pass  # Already exited
            except Exception as e:
                logger.error("Error killing Playwright driver (PID %d): %s", self._driver_pid, str(e))

    async def shutdown(self) -> None:
        """Gracefully shut down the browser."""
        logger.info("Shutting down headless browser...")
        await self._cleanup()
        self._status = BrowserStatus.NOT_INITIALIZED
        self._error_message = None
        logger.info("Headless browser shut down")

    async def convert_workflow(self, workflow_data: dict) -> dict:
        """Convert a workflow from UI format to API format.

        Acquires a page from the pool, performs the conversion, and returns
        the page to the pool. Multiple conversions can run concurrently
        up to the pool size.

        Args:
            workflow_data: The workflow JSON data in UI format.

        Returns:
            The converted workflow in API format.

        Raises:
            RuntimeError: If browser is not available or conversion fails.
        """
        # Ensure browser is initialized
        if self._status != BrowserStatus.READY:
            await self.initialize()

        # Acquire a page from the pool (blocks if all pages are busy)
        page = await self._page_pool.get()
        try:
            result = await self._do_convert(page, workflow_data)
            return result
        except Exception as first_error:
            logger.warning(
                "Workflow conversion failed, attempting recovery: %s",
                str(first_error),
            )
            # Recovery: _do_convert already reloads the page, so just retry
            try:
                result = await self._do_convert(page, workflow_data)
                logger.info("Recovery successful, conversion completed on retry")
                return result
            except Exception as retry_error:
                self._status = BrowserStatus.ERROR
                self._error_message = f"Conversion failed after retry: {str(retry_error)}"
                logger.error(self._error_message)
                raise RuntimeError(self._error_message) from retry_error
        finally:
            # Always return the page to the pool
            await self._page_pool.put(page)

    async def _do_convert(self, page, workflow_data: dict) -> dict:
        """Execute the actual conversion in a browser page.

        Reloads the page before each conversion to ensure a clean frontend state,
        since ComfyUI extensions modify LiteGraph globals that persist across
        graph instances.
        """
        # Reload the page to reset frontend state before conversion
        await page.reload(wait_until="domcontentloaded", timeout=30000)
        await self._wait_for_comfyui_ready(page)

        result = await page.evaluate(
            """async (workflowData) => {
                try {
                    const graph = new window.LGraph();
                    graph.configure(workflowData, false);
                    const parsed = await window.__cpe_graphToPrompt(graph);
                    return { success: true, workflow: parsed.output };
                } catch (e) {
                    return { success: false, error: e.message || String(e) };
                }
            }""",
            workflow_data,
        )

        if not result.get("success"):
            raise RuntimeError(f"JS conversion error: {result.get('error', 'Unknown error')}")

        return result["workflow"]


# Singleton instance
_browser_manager: Optional[HeadlessBrowserManager] = None


def get_browser_manager() -> HeadlessBrowserManager:
    """Get the global HeadlessBrowserManager singleton."""
    global _browser_manager
    if _browser_manager is None:
        _browser_manager = HeadlessBrowserManager()
    return _browser_manager
