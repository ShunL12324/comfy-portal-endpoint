import os
import sys
import subprocess
from .logger import get_logger
from .api import workflow

logger = get_logger()


def _ensure_playwright_chromium() -> bool:
    """Ensure Playwright and its Chromium browser are installed.

    Runs at plugin load time. If Playwright pip package is available,
    attempts to install the Chromium browser binary.

    Returns:
        True if Playwright Chromium is ready, False otherwise.
    """
    try:
        import playwright
    except ImportError:
        logger.info("Playwright not found, installing automatically...")
        try:
            # Find pip executable next to the Python executable (works in venvs
            # where `python -m pip` may fail due to missing pip bootstrap module)
            pip_exe = os.path.join(os.path.dirname(sys.executable), "pip")
            # On Windows, try pip.exe
            if sys.platform == "win32":
                pip_exe += ".exe"

            if os.path.isfile(pip_exe):
                install_cmd = [pip_exe, "install", "playwright"]
            else:
                # Fallback: ensure pip is available, then use python -m pip
                subprocess.run(
                    [sys.executable, "-m", "ensurepip", "--default-pip"],
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
                install_cmd = [sys.executable, "-m", "pip", "install", "playwright"]

            subprocess.run(
                install_cmd,
                capture_output=True,
                text=True,
                timeout=120,
                check=True,
            )
            logger.info("Playwright pip package installed successfully")
            import playwright
        except subprocess.CalledProcessError as e:
            logger.error(
                "Failed to auto-install Playwright. "
                "Return code: %d. stderr: %s. "
                "Try manually: pip install playwright",
                e.returncode,
                e.stderr.strip() if e.stderr else "(empty)",
            )
            return False
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

    try:
        logger.info("Checking Playwright Chromium browser installation...")
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
        )
        if result.returncode == 0:
            logger.info("Playwright Chromium browser is ready")
            return True
        else:
            logger.error(
                "Failed to install Playwright Chromium browser. "
                "Return code: %d. stderr: %s",
                result.returncode,
                result.stderr.strip() if result.stderr else "(empty)",
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
