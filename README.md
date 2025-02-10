# ComfyUI Portal Endpoint Extension

This is a ComfyUI extension that provides additional API endpoints functionality.

## Installation

1. Place this folder in the `custom_nodes` directory of ComfyUI
2. Restart the ComfyUI server

## API Endpoints

### Workflow Conversion

- Endpoint: `/cpe/workflow/convert`
- Method: POST
- Description: Converts a ComfyUI workflow JSON format to API-compatible JSON format for programmatic API calls
- Headers Required:
  - `Client-Id`: A unique identifier for the client
- Request Body: ComfyUI workflow JSON data (the format you get when you save a workflow in the UI)
- Response Example:

```json
{
  "status": "success",
  "message": "Workflow converted successfully",
  "data": {
    "workflow": {
      // API-compatible workflow format
      // This format can be used directly with ComfyUI's API endpoints
    }
  }
}
```

- Error Response Example:

```json
{
  "status": "error",
  "message": "Error message describing what went wrong"
}
```

Note: This endpoint helps transform the UI-based workflow format into a format that can be used with ComfyUI's API system. It handles the conversion of node connections, parameters, and workflow structure to make it suitable for API execution.

### Internal Callback Endpoint

- Endpoint: `/cpe/workflow/convert/callback`
- Method: POST
- Description: Internal endpoint for handling workflow conversion callbacks
- Note: This endpoint is for internal use only

## Development Notes

- This extension focuses on providing API endpoints, no custom nodes included
- All API endpoints are prefixed with `/cpe/`
- Uses aiohttp framework for handling API requests
- Implements a task queue system for workflow processing
- Includes error handling and timeout mechanisms

## License

MIT
