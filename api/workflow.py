from aiohttp import web
from server import PromptServer
import uuid
from dataclasses import dataclass
from typing import Dict, Optional, Literal
import time
from queue import Queue
import asyncio
from ..logger import get_logger
import aiohttp
import os
import glob
import json

# Configure logging
logger = get_logger()
# Get the PromptServer instance
server = PromptServer.instance

# task queue
task_queue = Queue()

@dataclass
class Task:
    id: str
    status: Literal["pending", "processing", "completed", "failed"]  # Better type hint
    data: dict
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: float = time.time()

    def update_status(self, status: Literal["pending", "processing", "completed", "failed"], error: Optional[str] = None, result: Optional[dict] = None):
        """Helper method to update task status"""
        self.status = status
        if error is not None:
            self.error = error
        if result is not None:
            self.result = result

# Store tasks in memory
tasks: Dict[str, Task] = {}

# Constants
TIMEOUT_SECONDS = 10
POLLING_INTERVALS = [0.5, 1.0, 1.5]  # in seconds

def get_server_address():
    """Get the actual server address that ComfyUI is listening on"""
    # Get server host and port from the server instance
    # Use the same host as the request to ensure it works with 0.0.0.0
    return "" # Return empty string to use relative URL

@server.routes.post("/cpe/workflow/convert")
async def convert_json(request):
    """put task into queue, generate a task id, put task into queue"""
    try:
        data = await request.json()
        if not data:
            raise ValueError("Request body is required")

        # Create new task (internal use only)
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            status="pending",
            data=data
        )
        tasks[task_id] = task

        # Put task into queue and notify internal server
        task_queue.put(task)
        server.send_sync("workflow_convert_queue", {
            "data": {"workflow": data},
            "task_id": task_id
        })

        # Poll for task completion
        start_time = time.time()
        current_interval = 0

        while True:
            # Check if task is completed or failed
            if tasks[task_id].status in ["completed", "failed"]:
                if tasks[task_id].status == "completed":
                    return web.json_response({
                        "status": "success",
                        "message": "Workflow converted successfully",
                        "data": tasks[task_id].result
                    })
                else:
                    return web.json_response({
                        "status": "error",
                        "message": tasks[task_id].error or "Conversion failed",
                    }, status=400)

            # Check for timeout
            if time.time() - start_time > TIMEOUT_SECONDS:
                tasks[task_id].update_status("failed", error="Task processing timeout")
                return web.json_response({
                    "status": "error",
                    "message": "Workflow conversion timeout"
                }, status=408)  # 408 Request Timeout

            # Wait for the current interval
            await asyncio.sleep(POLLING_INTERVALS[min(current_interval, len(POLLING_INTERVALS) - 1)])
            current_interval += 1

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except Exception as e:
        logger.error("Error processing request: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)

@server.routes.post("/cpe/workflow/convert/callback")
async def convert_callback(request):
    """Internal callback to update task status and result"""
    try:
        data = await request.json()
        if not data:
            raise ValueError("Request body is required")

        task_id = data.get("task_id")
        if not task_id or task_id not in tasks:
            raise ValueError("Invalid task_id")

        task = tasks[task_id]

        # Check if there's an error in the response
        if "error" in data:
            task.update_status("failed", error=data.get("error"))
        else:
            # Update task status and result
            task.update_status("completed", result={"workflow": data.get("workflow")})

        # Try to get next task from queue if available
        try:
            next_task = task_queue.get_nowait()
            next_task.update_status("processing")
            server.send_sync("workflow_convert_queue", {
                "data": {"workflow": next_task.data},
                "task_id": next_task.id
            })
        except:
            pass  # No more tasks in queue

        # Internal endpoint, just return simple success response
        return web.json_response({
            "status": "success"
        })

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except Exception as e:
        logger.error("Error processing callback: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error"
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
    """Get a workflow by filename and convert it using the conversion logic"""
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
        
        if not workflow_data:  # Check if the parsed workflow data is empty
            raise ValueError("Workflow file contains no data or is an empty JSON object")
        
        # Create a task for conversion
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            status="pending",
            data=workflow_data
        )
        tasks[task_id] = task

        # Put task into queue and notify internal server
        task_queue.put(task)
        server.send_sync("workflow_convert_queue", {
            "data": {"workflow": workflow_data},
            "task_id": task_id
        })

        # Poll for task completion
        start_time = time.time()
        current_interval = 0

        while True:
            # Check if task is completed or failed
            if tasks[task_id].status in ["completed", "failed"]:
                if tasks[task_id].status == "completed":
                    return web.json_response({
                        "status": "success",
                        "message": "Workflow converted successfully",
                        "filename": filename,
                        "data": tasks[task_id].result
                    })
                else:
                    return web.json_response({
                        "status": "error",
                        "message": tasks[task_id].error or "Conversion failed",
                    }, status=400)

            # Check for timeout
            if time.time() - start_time > TIMEOUT_SECONDS:
                tasks[task_id].update_status("failed", error="Task processing timeout")
                return web.json_response({
                    "status": "error",
                    "message": "Workflow conversion timeout"
                }, status=408)  # 408 Request Timeout

            # Wait for the current interval
            await asyncio.sleep(POLLING_INTERVALS[min(current_interval, len(POLLING_INTERVALS) - 1)])
            current_interval += 1

    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": str(e)
        }, status=400)
    except Exception as e:
        logger.error("Error processing workflow: %s", str(e))
        return web.json_response({
            "status": "error",
            "message": "Internal server error",
            "details": str(e)
        }, status=500)

