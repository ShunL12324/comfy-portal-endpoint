# ComfyUI Portal Endpoint Extension

This is a ComfyUI extension that provides additional API endpoints functionality, primarily designed to support [Comfy Portal](https://github.com/ShunL12324/comfy-portal) - a modern iOS client application for ComfyUI. These endpoints enable seamless integration between the mobile app and ComfyUI server, providing features like workflow conversion, listing, and saving capabilities.

## 🆕 What's New in v1.0.2

**Enhanced Workflow Conversion** (2025-11-26)
- ✅ **Critical Bug Fix:** Array widget values now properly wrapped to prevent misinterpretation as node connections
- ✅ Updated conversion logic to match ComfyUI frontend v1.9.10+ implementation
- ✅ Improved support for group nodes with better inner node handling
- ✅ Enhanced input resolution with support for new `resolveInput()` method and fallback to legacy traversal
- ✅ Added widget name validation to prevent errors
- ✅ Better handling of virtual nodes and BYPASS mode
- ✅ Always cleans disconnected inputs for more reliable conversion
- ✅ Updated function signature from `graphToPrompt(graph, clean)` to `graphToPrompt(graph, options)`

These improvements ensure maximum compatibility with modern ComfyUI workflows while maintaining backward compatibility.

## ⚠️ Important Requirements

**Workflow conversion requires an active browser connection to ComfyUI.** The conversion runs in frontend JavaScript using LiteGraph, communicating with the backend via WebSocket.

✅ Works with: iOS app WebView, browser-based usage
❌ Not for: Headless/API-only deployments

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

**Note:** No additional dependencies required! Works out of the box.

## API Endpoints

### Get Workflow

- **Endpoint:** `/api/cpe/workflow/get`
- **Method:** GET
- **Description:** Retrieves a specific workflow by filename from the workflows directory
- **Query Parameters:**
  - `filename`: The workflow filename (required)

#### Example Call

```bash
curl "http://localhost:8188/api/cpe/workflow/get?filename=my_workflow.json"
```

### List Workflows

- **Endpoint:** `/api/cpe/workflow/list`
- **Method:** GET
- **Description:** Lists all available workflows in the user's workflows directory
- **Response:** List of workflow files with their metadata (filename, size, modified time)

#### Example Call

```bash
curl "http://localhost:8188/api/cpe/workflow/list"
```

### Save Workflow

- **Endpoint:** `/api/cpe/workflow/save`
- **Method:** POST
- **Description:** Saves a workflow JSON to the workflows directory
- **Request Body:**
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

### Workflow Conversion

- **Endpoint:** `/api/cpe/workflow/convert`
- **Method:** POST
- **Description:** Converts a ComfyUI workflow (UI format) to API-compatible format for execution
- **⚠️ Requires:** Active browser connection to ComfyUI
- **Request Body:**
  - `workflow`: Workflow JSON object (UI format)

#### Example Call

```bash
curl -X POST "http://localhost:8188/api/cpe/workflow/convert" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": <workflow_json_object>
  }'
```

### Get and Convert Workflow (Recommended)

- **Endpoint:** `/api/cpe/workflow/get-and-convert`
- **Method:** GET
- **Description:** Retrieves a workflow by filename and converts it to API format in one call
- **⚠️ Requires:** Active browser connection to ComfyUI
- **Query Parameters:**
  - `filename`: The workflow filename (required)
- **Response:** Converted workflow in API-compatible format ready for execution

#### Example Call

```bash
curl "http://localhost:8188/api/cpe/workflow/get-and-convert?filename=my_workflow.json"
```

**This is the recommended endpoint for most use cases** - it combines retrieval and conversion in a single request.

## Technical Details

### Workflow Format Conversion

ComfyUI has two workflow formats:

1. **UI Format** (saved in `.json` files):
   - Contains full graph structure, positions, groups, etc.
   - Human-readable, editable
   - Used by the web interface

2. **API Format** (for execution):
   - Simplified format with only execution data
   - Node IDs mapped to inputs and class types
   - Used by the `/prompt` endpoint

**This extension converts UI format → API format**, enabling programmatic workflow execution.

### How Conversion Works

1. API request received by backend
2. Backend sends WebSocket event to connected browser
3. Frontend JavaScript runs conversion using LiteGraph
4. Frontend sends result back to backend via callback
5. Backend returns converted workflow to client

**Timeout:** 10 seconds (if no browser connected, conversion will fail)

### Browser Connectivity Check

To verify if conversion will work, check if ComfyUI web interface is open in any browser. The conversion uses the same JavaScript engine that powers the ComfyUI interface, ensuring 100% accuracy.

## Updated Features (v1.0.2)

### Enhanced Workflow Conversion

- ✅ Updated to match ComfyUI frontend v1.9.10+ implementation
- ✅ **Critical fix:** Array widget values now properly wrapped to prevent confusion with node connections
- ✅ Better inner nodes handling for group nodes
- ✅ Widget name validation to prevent errors
- ✅ Enhanced input resolution with fallback support
- ✅ Improved serialization options
- ✅ Always cleans disconnected inputs

See `js/utils.js` for the updated `graphToPrompt` implementation.

## Use Cases

### Comfy Portal iOS App
Perfect integration - the app's WebView maintains an active browser connection, allowing seamless workflow conversion.

### Desktop Automation
Works great when ComfyUI web interface is open in a browser tab.

### CI/CD & Headless Servers
⚠️ Not recommended - requires browser connection. Consider using pre-converted API format workflows instead.

## Development Notes

- This extension focuses on providing API endpoints, no custom nodes included
- All API endpoints are prefixed with `/api/cpe/`
- Uses aiohttp framework for handling API requests
- Implements a task queue system for workflow processing
- Includes error handling and timeout mechanisms
- Frontend JavaScript handles actual conversion using LiteGraph

## Troubleshooting

### "Workflow conversion timeout" error

**Cause:** No browser connected to ComfyUI

**Solutions:**
1. Open ComfyUI in a web browser
2. Keep the browser tab open while making API calls
3. For iOS app: ensure WebView is active

### Conversion returns empty workflow

**Cause:** Invalid workflow format or frontend not loaded

**Solutions:**
1. Verify workflow JSON is valid
2. Ensure ComfyUI web interface fully loaded
3. Try refreshing the browser page

## License

MIT
