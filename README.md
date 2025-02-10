# ComfyUI Portal Endpoint Extension

This is a ComfyUI extension that provides additional API endpoints functionality.

## Installation

1. Place this folder in the `custom_nodes` directory of ComfyUI
2. Restart the ComfyUI server

## API Endpoints

### Workflow Conversion

- Endpoint: `/api/cpe/workflow/convert`
- Method: POST
- Description: Converts a ComfyUI workflow JSON format to API-compatible JSON format for programmatic API calls
- Headers Required:
  - `Client-Id`: A unique identifier for the client
- Request Body: ComfyUI workflow JSON data (the format you get when you save a workflow in the UI)

#### Example Call

```bash
curl -X POST "http://localhost:8188/api/cpe/workflow/convert" \
  -H "Content-Type: application/json" \
  -H "Client-Id: your-client-id" \
  -d '{
    "workflow": "<workflow_json_string>"
  }'
```

Note: This endpoint helps transform the UI-based workflow format into a format that can be used with ComfyUI's API system. It handles the conversion of node connections, parameters, and workflow structure to make it suitable for API execution.

## Development Notes

- This extension focuses on providing API endpoints, no custom nodes included
- All API endpoints are prefixed with `/api/cpe/`
- Uses aiohttp framework for handling API requests
- Implements a task queue system for workflow processing
- Includes error handling and timeout mechanisms

## License

MIT
