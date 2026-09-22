from aiohttp import web
from server import PromptServer
import os
import shutil

from ..logger import get_logger

# Configure logging
logger = get_logger()
# Get the PromptServer instance
server = PromptServer.instance


def _comfy_root():
    """Resolve the ComfyUI root directory.

    Prefers folder_paths.base_path, which ComfyUI derives from its own launch
    location and therefore stays correct under --base-directory and symlinked
    installs. Falls back to walking up from this file, matching the path
    arithmetic the workflow routes already use.
    """
    try:
        import folder_paths
        base_path = getattr(folder_paths, "base_path", None)
        if base_path:
            return base_path
    except Exception as e:
        logger.warning("Could not read folder_paths.base_path: %s", str(e))

    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


@server.routes.get("/cpe/system/storage")
async def system_storage(request):
    """Report disk capacity for the volume holding the ComfyUI installation.

    ComfyUI core reports GPU and RAM in /system_stats but never disk, so the
    portal has no way to show storage without this route.
    """
    try:
        path = _comfy_root()
        usage = shutil.disk_usage(path)

        # On POSIX the filesystem reserves blocks for root, so used + free is
        # smaller than total. Report all three as measured; deriving one from
        # the other two would silently hand the client the reserved blocks.
        return web.json_response({
            "status": "success",
            "storage": {
                "path": path,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
            }
        })

    except Exception as e:
        logger.error("Error reading storage usage: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)
