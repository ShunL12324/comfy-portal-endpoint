from aiohttp import web
from server import PromptServer
import time
from ..logger import get_logger
from ..browser import get_browser_manager
import os
import glob
import json

# Configure logging
logger = get_logger()
# Get the PromptServer instance
server = PromptServer.instance


@server.routes.post("/cpe/workflow/convert")
async def convert_json(request):
    """Convert a workflow from UI format to API-executable format using headless browser."""
    try:
        data = await request.json()
        if not data:
            raise ValueError("Request body is required")

        manager = get_browser_manager()
        result = await manager.convert_workflow(data)

        return web.json_response({
            "status": "success",
            "message": "Workflow converted successfully",
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

        # Convert using headless browser
        manager = get_browser_manager()
        result = await manager.convert_workflow(workflow_data)

        return web.json_response({
            "status": "success",
            "message": "Workflow converted successfully",
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
