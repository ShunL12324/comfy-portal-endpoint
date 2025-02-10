# ComfyUI Portal Endpoint Extension

This is a ComfyUI extension that provides additional API endpoints functionality, primarily designed to support [Comfy Portal](https://github.com/ShunL12324/comfy-portal) - a modern iOS client application for ComfyUI. These endpoints enable seamless integration between the mobile app and ComfyUI server, providing features like workflow conversion, listing, and saving capabilities.

## Installation

1. Navigate to ComfyUI's custom_nodes directory:

```bash
cd custom_nodes
```

2. Clone this repository:

```bash
git clone https://github.com/ShunL12324/comfy-portal-endpoint
```

3. Restart the ComfyUI server

## API Endpoints

### Workflow Conversion

- Endpoint: `/api/cpe/workflow/convert`
- Method: POST
- Description: Converts a ComfyUI workflow JSON format to API-compatible JSON format for programmatic API calls
- Request Body: ComfyUI workflow JSON data (the format you get when you save a workflow in the UI)

#### Example Call

```bash
curl -X POST "http://localhost:8188/api/cpe/workflow/convert" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "<workflow_json_string>"
  }'
```

### List Workflows

- Endpoint: `/api/cpe/workflow/list`
- Method: GET
- Description: Lists all available workflows in the user's workflows directory
- Response: List of workflow files with their metadata (filename, size, modified time)

#### Example Call

```bash
curl "http://localhost:8188/api/cpe/workflow/list"
```

### Save Workflow

- Endpoint: `/api/cpe/workflow/save`
- Method: POST
- Description: Saves a workflow JSON to the workflows directory
- Request Body:
  - `workflow`: Workflow JSON string (required)
  - `name`: Filename to save as (optional, will generate timestamp-based name if not provided)
  - Note: `.json` extension will be automatically added if not present in the name

#### Example Call

```bash
curl -X POST "http://localhost:8188/api/cpe/workflow/save" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "<workflow_json_string>",
    "name": "my_workflow"
  }'
```

## Development Notes

- This extension focuses on providing API endpoints, no custom nodes included
- All API endpoints are prefixed with `/api/cpe/`
- Uses aiohttp framework for handling API requests
- Implements a task queue system for workflow processing
- Includes error handling and timeout mechanisms

## License

MIT
