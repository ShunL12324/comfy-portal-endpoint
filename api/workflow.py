from aiohttp import web
from server import PromptServer
import time
from ..logger import get_logger
from ..browser import get_browser_manager
from ..python_converter import (
    convert as _python_convert,
    flatten_ui as _flatten_ui,
    UnsupportedFeature,
)
import nodes as _nodes  # ComfyUI core: gives us NODE_CLASS_MAPPINGS for /object_info
import os
import glob
import json

# Configure logging
logger = get_logger()
# Get the PromptServer instance
server = PromptServer.instance


async def _convert_workflow(workflow_data: dict) -> tuple[dict, str]:
    """Convert UI-format -> API-format.

    Tries the pure-Python converter first. Falls back to the Playwright
    headless-browser path only when the workflow uses features Python
    doesn't model (custom serializeValue, legacy group nodes, etc.).

    Returns (api_workflow_dict, converter_name).
    """
    try:
        object_info = _build_object_info()
        api_workflow = _python_convert(workflow_data, object_info)
        return api_workflow, "python"
    except UnsupportedFeature as e:
        logger.info(
            "Python converter declined (%s); falling back to headless browser",
            e,
        )

    manager = get_browser_manager()
    api_workflow = await manager.convert_workflow(workflow_data)
    return api_workflow, "playwright"


def _build_object_info() -> dict:
    """Build the /object_info dict the Python converter needs to discover
    widget order. Uses ComfyUI's own NODE_CLASS_MAPPINGS so the data matches
    exactly what the server publishes at /object_info."""
    out: dict = {}
    for class_name, cls in (_nodes.NODE_CLASS_MAPPINGS or {}).items():
        try:
            input_spec = cls.INPUT_TYPES() if hasattr(cls, "INPUT_TYPES") else {}
        except Exception:  # noqa: BLE001 -- some custom nodes raise during INPUT_TYPES()
            continue
        out[class_name] = {"input": input_spec}
    return out


@server.routes.post("/cpe/workflow/convert")
async def convert_json(request):
    """Convert a workflow from UI format to API-executable format.

    Uses the pure-Python converter for the common case; falls back to the
    headless-browser path only when the workflow needs frontend JS to
    serialize correctly.
    """
    try:
        data = await request.json()
        if not data:
            raise ValueError("Request body is required")

        result, converter = await _convert_workflow(data)

        return web.json_response({
            "status": "success",
            "message": "Workflow converted successfully",
            "converter": converter,
            "data": {"workflow": result}
        })

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except RuntimeError as e:
        logger.error("Browser conversion error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Workflow conversion failed",
            "details": str(e)
        }, status=503)
    except Exception as e:
        logger.error("Error processing request: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)


@server.routes.get("/cpe/workflow/list")
async def list_workflows(request):
    """List all available workflows from the userdata/workflows directory"""
    try:
        # Get user directory path - go up one more level to reach ComfyUI root
        user_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "user")
        workflow_dir = os.path.join(user_dir, "default", "workflows")

        # Create directory if not exists
        os.makedirs(workflow_dir, exist_ok=True)

        # Get all json files recursively
        pattern = os.path.join(glob.escape(workflow_dir), '**', '*.json')
        workflow_files = []

        for file_path in glob.glob(pattern, recursive=True):
            workflow_files.append({
                "filename": os.path.relpath(file_path, workflow_dir).replace(os.sep, '/'),
                "size": os.path.getsize(file_path),
                "modified": os.path.getmtime(file_path)
            })

        return web.json_response({
            "status": "success",
            "workflows": workflow_files
        })

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except Exception as e:
        logger.error("Error listing workflows: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)


@server.routes.post("/cpe/workflow/save")
async def save_workflow(request):
    """Save workflow to the userdata/workflows directory"""
    try:
        data = await request.json()
        if not data or "workflow" not in data:
            raise ValueError("workflow field is required")

        workflow_str = data["workflow"]
        # Validate JSON
        try:
            json.loads(workflow_str)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in workflow field")

        # Get workflow name from request or generate one
        workflow_name = data.get("name", f"workflow_{int(time.time())}.json")
        if not workflow_name.endswith('.json'):
            workflow_name += '.json'

        # Get user directory path
        user_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "user")
        workflow_dir = os.path.join(user_dir, "default", "workflows")

        # Create directory if not exists
        os.makedirs(workflow_dir, exist_ok=True)

        # Save workflow file
        file_path = os.path.join(workflow_dir, workflow_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(workflow_str)

        return web.json_response({
            "status": "success",
            "message": "Workflow saved successfully",
            "filename": workflow_name
        })

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except Exception as e:
        logger.error("Error saving workflow: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)


@server.routes.get("/cpe/workflow/get")
async def get_workflow(request):
    """Get a specific workflow by filename from the userdata/workflows directory"""
    try:
        # Get filename from query parameters
        filename = request.query.get("filename")
        if not filename:
            raise ValueError("filename query parameter is required")

        # Get user directory path
        user_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "user")
        workflow_dir = os.path.join(user_dir, "default", "workflows")

        # Ensure the path is secure and within the workflows directory
        file_path = os.path.join(workflow_dir, filename.replace('/', os.sep))
        if not os.path.normpath(file_path).startswith(os.path.normpath(workflow_dir)):
            raise ValueError("Invalid filename path")

        # Check if file exists
        if not os.path.isfile(file_path):
            return web.json_response({
                "status": "error",
                "message": f"Workflow file not found: {filename}"
            }, status=404)

        # Read workflow file
        with open(file_path, 'r', encoding='utf-8') as f:
            workflow_content = f.read()

        # ?raw=true returns the file as-is. Default behavior flattens any
        # subgraph instances inline so clients that don't render the
        # subgraph node type (e.g. Comfy Portal as of writing) see each
        # operational inner node as a normal widget card. Idempotent --
        # workflows without subgraphs pass through unchanged.
        raw = request.query.get("raw", "").lower() in ("1", "true", "yes")
        if not raw:
            try:
                parsed = json.loads(workflow_content)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, dict) and (parsed.get("definitions") or {}).get("subgraphs"):
                flattened = _flatten_ui(parsed)
                workflow_content = json.dumps(flattened)

        return web.json_response({
            "status": "success",
            "filename": filename,
            "workflow": workflow_content
        })

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except Exception as e:
        logger.error("Error getting workflow: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)


@server.routes.get("/cpe/workflow/get-and-convert")
async def get_and_convert_workflow(request):
    """Get a workflow by filename and convert it using the headless browser."""
    try:
        # Get filename from query parameters
        filename = request.query.get("filename")
        if not filename:
            raise ValueError("filename query parameter is required")

        # Get user directory path
        user_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "user")
        workflow_dir = os.path.join(user_dir, "default", "workflows")

        # Ensure the path is secure and within the workflows directory
        file_path = os.path.join(workflow_dir, filename.replace('/', os.sep))
        if not os.path.normpath(file_path).startswith(os.path.normpath(workflow_dir)):
            raise ValueError("Invalid filename path")

        # Check if file exists
        if not os.path.isfile(file_path):
            return web.json_response({
                "status": "error",
                "message": f"Workflow file not found: {filename}"
            }, status=404)

        # Read workflow file
        with open(file_path, 'r', encoding='utf-8') as f:
            workflow_content = f.read()

        # Parse workflow JSON
        try:
            workflow_data = json.loads(workflow_content)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in workflow file")

        if not workflow_data:
            raise ValueError("Workflow file contains no data or is an empty JSON object")

        result, converter = await _convert_workflow(workflow_data)

        return web.json_response({
            "status": "success",
            "message": "Workflow converted successfully",
            "converter": converter,
            "filename": filename,
            "data": {"workflow": result}
        })

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except RuntimeError as e:
        logger.error("Browser conversion error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Workflow conversion failed",
            "details": str(e)
        }, status=503)
    except Exception as e:
        logger.error("Error processing workflow: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)


@server.routes.get("/cpe/health")
async def health_check(request):
    """Health check endpoint returning headless browser status."""
    try:
        manager = get_browser_manager()
        status_info = {
            "status": manager.status.value,
        }
        if manager.error_message:
            status_info["error"] = manager.error_message

        return web.json_response({
            "status": "success",
            "browser": status_info
        })
    except Exception as e:
        logger.error("Error in health check: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)
