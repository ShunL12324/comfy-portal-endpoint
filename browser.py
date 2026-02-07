import asyncio
import atexit
import enum
from typing import Optional, Any

from .logger import get_logger

logger = get_logger()


class BrowserStatus(enum.Enum):
    NOT_INSTALLED = "not_installed"
    NOT_INITIALIZED = "not_initialized"
    INITIALIZING = "initializing"
    READY = "ready"
    ERROR = "error"


class HeadlessBrowserManager:
    """Manages a headless Chromium browser for workflow conversion.

    Uses Playwright to load the ComfyUI frontend in a headless browser,
    then calls the graphToPrompt JS function via page.evaluate().
    """

    def __init__(self):
        self._status: BrowserStatus = BrowserStatus.NOT_INITIALIZED
        self._error_message: Optional[str] = None
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None
        self._init_lock: Optional[asyncio.Lock] = None
        self._lock: Optional[asyncio.Lock] = None

        # Register synchronous cleanup at process exit
        atexit.register(self._sync_cleanup)

    def _get_init_lock(self) -> asyncio.Lock:
        """Lazily create the init lock (must be in an event loop context)."""
        if self._init_lock is None:
            self._init_lock = asyncio.Lock()
        return self._init_lock

    def _get_lock(self) -> asyncio.Lock:
        """Lazily create the conversion lock (must be in an event loop context)."""
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

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

    async def initialize(self) -> None:
        """Initialize the headless browser and load ComfyUI page.

        This is idempotent - if already READY, it returns immediately.
        Uses _init_lock to prevent concurrent initialization.
        """
        if self._status == BrowserStatus.READY and self._page is not None:
            return

        init_lock = self._get_init_lock()
        async with init_lock:
            # Double-check after acquiring lock
            if self._status == BrowserStatus.READY and self._page is not None:
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

                # Create browser context and page
                self._context = await self._browser.new_context()
                self._page = await self._context.new_page()

                # Navigate to ComfyUI page with 60s timeout
                logger.info("Loading ComfyUI page...")
                await self._page.goto(comfyui_url, timeout=60000, wait_until="domcontentloaded")

                # Wait for LiteGraph to be loaded (window.LGraph)
                logger.info("Waiting for LiteGraph (window.LGraph) to load...")
                await self._page.wait_for_function(
                    "() => typeof window.LGraph !== 'undefined'",
                    timeout=30000,
                )
                logger.info("LiteGraph loaded successfully")

                # Wait for our plugin JS to expose __cpe_graphToPrompt
                logger.info("Waiting for plugin JS (window.__cpe_graphToPrompt) to load...")
                await self._page.wait_for_function(
                    "() => typeof window.__cpe_graphToPrompt !== 'undefined'",
                    timeout=30000,
                )
                logger.info("Plugin JS loaded successfully")

                # Wait for ComfyUI app to fully initialize (node types registered)
                # The frontend fetches /object_info and registers all node types into
                # LiteGraph. Without this, graph.configure() can't resolve class_type.
                logger.info("Waiting for ComfyUI node types to be registered...")
                await self._page.wait_for_function(
                    """() => {
                        if (typeof LiteGraph === 'undefined') return false;
                        const types = LiteGraph.registered_node_types;
                        return types && Object.keys(types).length > 0;
                    }""",
                    timeout=60000,
                )
                node_count = await self._page.evaluate(
                    "() => Object.keys(LiteGraph.registered_node_types).length"
                )
                logger.info("ComfyUI node types registered: %d types loaded", node_count)

                self._status = BrowserStatus.READY
                logger.info("Headless browser initialized and ready for workflow conversion")

            except Exception as e:
                self._status = BrowserStatus.ERROR
                self._error_message = f"Failed to initialize headless browser: {str(e)}"
                logger.error(self._error_message)
                # Clean up partial initialization
                await self._cleanup()
                raise RuntimeError(self._error_message) from e

    async def _cleanup(self) -> None:
        """Clean up browser resources."""
        try:
            if self._page is not None:
                try:
                    await self._page.close()
                except Exception:
                    pass
                self._page = None

            if self._context is not None:
                try:
                    await self._context.close()
                except Exception:
                    pass
                self._context = None

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
        except Exception as e:
            logger.error("Error during browser cleanup: %s", str(e))

    def _sync_cleanup(self) -> None:
        """Synchronous cleanup for atexit - forcefully kills browser process."""
        if self._browser is not None:
            try:
                # Playwright browser has a process we can kill directly
                if hasattr(self._browser, '_impl_obj') and self._browser._impl_obj:
                    process = getattr(self._browser._impl_obj, '_process', None)
                    if process:
                        process.kill()
                        logger.info("Killed headless browser process on exit")
            except Exception as e:
                logger.error("Error killing browser process on exit: %s", str(e))

    async def shutdown(self) -> None:
        """Gracefully shut down the browser."""
        logger.info("Shutting down headless browser...")
        await self._cleanup()
        self._status = BrowserStatus.NOT_INITIALIZED
        self._error_message = None
        logger.info("Headless browser shut down")

    async def convert_workflow(self, workflow_data: dict) -> dict:
        """Convert a workflow from UI format to API format.

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

        lock = self._get_lock()
        async with lock:
            try:
                result = await self._do_convert(workflow_data)
                return result
            except Exception as first_error:
                logger.warning(
                    "Workflow conversion failed, attempting recovery: %s",
                    str(first_error),
                )
                # Recovery: cleanup, re-init, retry once
                try:
                    await self._cleanup()
                    self._status = BrowserStatus.NOT_INITIALIZED
                    await self.initialize()
                    result = await self._do_convert(workflow_data)
                    logger.info("Recovery successful, conversion completed on retry")
                    return result
                except Exception as retry_error:
                    self._status = BrowserStatus.ERROR
                    self._error_message = f"Conversion failed after retry: {str(retry_error)}"
                    logger.error(self._error_message)
                    raise RuntimeError(self._error_message) from retry_error

    async def _do_convert(self, workflow_data: dict) -> dict:
        """Execute the actual conversion in the browser page."""
        if self._page is None:
            raise RuntimeError("Browser page is not available")

        result = await self._page.evaluate(
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
