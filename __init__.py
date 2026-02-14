import os
import sys
import re
import subprocess
from .logger import get_logger
from .api import workflow

logger = get_logger()


def _sanitize_log_line(line: str) -> str:
    """Remove progress bar characters and clean up a log line.

    Playwright's download progress uses Unicode block characters that
    display as garbled text in many terminals. Extract just the percentage
    and file size info instead.
    """
    line = line.rstrip()
    if not line:
        return ""

    # Match progress bar lines like "|████▌   | 50% of 108.8 MiB"
    match = re.search(r'(\d+%\s+of\s+[\d.]+\s+\w+)', line)
    if match:
        return f"Downloading Chromium: {match.group(1)}"

    # Strip any non-ASCII characters that might cause encoding issues
    cleaned = line.encode('ascii', errors='ignore').decode('ascii').strip()
    return cleaned if cleaned else ""


def _ensure_playwright_chromium() -> bool:
    """Ensure Playwright and its Chromium browser are installed.

    Runs at plugin load time. If Playwright pip package is available,
    attempts to install the Chromium browser binary.

    Returns:
        True if Playwright Chromium is ready, False otherwise.
    """
    # Use the absolute path of the current Python interpreter to ensure
    # we install into the correct environment (especially in venvs)
    python_exe = sys.executable

    try:
        import playwright
    except ImportError:
        logger.info(
            "Playwright not found. Installing automatically — this may take a while..."
        )
        logger.info("Using Python: %s", python_exe)
        try:
            # First, ensure pip is available in this environment
            subprocess.run(
                [python_exe, "-m", "ensurepip", "--default-pip"],
                capture_output=True,
                text=True,
                timeout=60,
            )
            # Install playwright, stream output so user can see progress
            process = subprocess.Popen(
                [python_exe, "-m", "pip", "install", "playwright"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            for line in process.stdout:
                cleaned = _sanitize_log_line(line)
                if cleaned:
                    logger.info("[pip] %s", cleaned)
            process.wait(timeout=120)
            if process.returncode != 0:
                logger.error(
                    "pip install playwright failed with return code %d. "
                    "Try manually: pip install playwright",
                    process.returncode,
                )
                return False
            logger.info("Playwright pip package installed successfully")
            import playwright
        except subprocess.TimeoutExpired:
            logger.error(
                "Playwright pip install timed out. "
                "Try manually: pip install playwright"
            )
            return False
        except ImportError:
            logger.error(
                "Playwright was installed but cannot be imported. "
                "Try restarting ComfyUI."
            )
            return False
        except Exception as e:
            logger.error(
                "Unexpected error installing Playwright: %s. "
                "Try manually: pip install playwright",
                str(e),
            )
            return False

    # On Linux, attempt to install system dependencies (e.g. libnspr4, libnss3)
    # before installing Chromium. Requires root/sudo — if it fails, we log a
    # warning and continue, since the user may already have them installed.
    if sys.platform.startswith("linux"):
        logger.info("Linux detected — attempting to install Playwright system dependencies...")
        try:
            deps_process = subprocess.Popen(
                [python_exe, "-m", "playwright", "install-deps"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            for line in deps_process.stdout:
                cleaned = _sanitize_log_line(line)
                if cleaned:
                    logger.info("[install-deps] %s", cleaned)
            deps_process.wait(timeout=120)
            if deps_process.returncode == 0:
                logger.info("System dependencies installed successfully")
            else:
                logger.warning(
                    "Could not auto-install system dependencies (return code %d). "
                    "If the browser fails to launch, run manually: "
                    "sudo python -m playwright install-deps",
                    deps_process.returncode,
                )
        except subprocess.TimeoutExpired:
            logger.warning(
                "System dependency installation timed out. "
                "If the browser fails to launch, run manually: "
                "sudo python -m playwright install-deps"
            )
        except Exception as e:
            logger.warning(
                "Could not auto-install system dependencies: %s. "
                "If the browser fails to launch, run manually: "
                "sudo python -m playwright install-deps",
                str(e),
            )

    try:
        logger.info(
            "Checking Playwright Chromium browser — "
            "first time download may take a few minutes..."
        )
        process = subprocess.Popen(
            [python_exe, "-m", "playwright", "install", "chromium"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        for line in process.stdout:
            cleaned = _sanitize_log_line(line)
            if cleaned:
                logger.info("[playwright] %s", cleaned)
        process.wait(timeout=300)
        if process.returncode == 0:
            logger.info("Playwright Chromium browser is ready")
            return True
        else:
            logger.error(
                "Failed to install Playwright Chromium browser (return code %d). "
                "Try manually: python -m playwright install chromium",
                process.returncode,
            )
            return False
    except subprocess.TimeoutExpired:
        logger.error(
            "Playwright Chromium installation timed out after 5 minutes. "
            "Try running manually: python -m playwright install chromium"
        )
        return False
    except Exception as e:
        logger.error(
            "Unexpected error during Playwright Chromium installation: %s. "
            "Try running manually: python -m playwright install chromium",
            str(e),
        )
        return False


# Run Playwright check at import time (plugin load)
_playwright_available = _ensure_playwright_chromium()

# Set web directory
WEB_DIRECTORY = "js"

# Since we don't have any nodes, these will be empty
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
