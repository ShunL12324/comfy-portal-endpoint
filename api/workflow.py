from aiohttp import web
from server import PromptServer
import uuid
from dataclasses import dataclass
from typing import Dict, Optional, Literal
import time
from queue import Queue
import asyncio
from ..logger import get_logger

# Configure logging
logger = get_logger()
# Get the PromptServer instance
server = PromptServer.instance


# task queue
task_queue = Queue()

@dataclass
class Task:
    id: str
    client_id: str
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

@server.routes.post("/cpe/workflow/convert")
async def convert_json(request):
    """put task into queue, generate a task id, put task into queue"""
    try:
        # Get client ID from headers
        client_id = request.headers.get('Client-Id')
        if not client_id:
            raise ValueError("Client-Id header is required")

        data = await request.json()
        if not data:
            raise ValueError("Request body is required")

        # Create new task (internal use only)
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            client_id=client_id,
            status="pending",
            data=data
        )
        tasks[task_id] = task

        # Put task into queue and notify internal server
        task_queue.put(task)
        server.send_sync("workflow_convert_queue", {
            "data": data,
            "client_id": client_id,
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

        client_id = data.get("client_id")
        if not client_id:
            raise ValueError("Client ID is required")

        task = tasks[task_id]
        if task.client_id != client_id:
            raise ValueError("Client ID mismatch")

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
                "data": next_task.data,
                "client_id": next_task.client_id,
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

