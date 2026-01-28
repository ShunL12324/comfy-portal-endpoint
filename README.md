# ComfyUI Portal Endpoint

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/ShunL12324/comfy-portal-endpoint/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green.svg)](https://github.com/comfyanonymous/ComfyUI)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

A ComfyUI extension that provides API endpoints for workflow management, designed to power [Comfy Portal](https://github.com/ShunL12324/comfy-portal) - a modern iOS client for ComfyUI.

## Features

- **Workflow Management** - List, retrieve, and save workflows via REST API
- **Format Conversion** - Convert UI workflows to API-executable format
- **Zero Dependencies** - Works out of the box with ComfyUI
- **Real-time Processing** - WebSocket-based conversion with frontend JavaScript

## Requirements

> **Note:** Workflow conversion requires an active browser connection to ComfyUI. The conversion runs in frontend JavaScript using LiteGraph.

| Use Case | Supported |
|----------|-----------|
| iOS App (WebView) | Yes |
| Browser-based | Yes |
| Headless/API-only | No |

## Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/ShunL12324/comfy-portal-endpoint
```

Restart ComfyUI to activate the extension.

## API Reference

All endpoints are prefixed with `/api/cpe/workflow/`.

### List Workflows

```http
GET /api/cpe/workflow/list
```

Returns all workflows with metadata (filename, size, modified time).

### Get Workflow

```http
GET /api/cpe/workflow/get?filename=<name>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | Yes | Workflow filename |

### Save Workflow

```http
POST /api/cpe/workflow/save
Content-Type: application/json

{
  "workflow": "<workflow_json_string>",
  "name": "my_workflow"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow` | string | Yes | Workflow JSON string |
| `name` | string | No | Filename (auto-generated if omitted) |

### Convert Workflow

```http
POST /api/cpe/workflow/convert
Content-Type: application/json

{
  "workflow": <workflow_json_object>
}
```

Converts UI format to API-executable format. Requires active browser connection.

### Get and Convert (Recommended)

```http
GET /api/cpe/workflow/get-and-convert?filename=<name>
```

Combines retrieval and conversion in a single request.

## Workflow Formats

| Format | Description | Usage |
|--------|-------------|-------|
| **UI Format** | Full graph with positions, groups, metadata | Web interface, `.json` files |
| **API Format** | Simplified execution data with node mappings | `/prompt` endpoint execution |

## Changelog

### v1.0.2 (2025-11-26)

- Fixed array widget values being misinterpreted as node connections
- Updated conversion logic to match ComfyUI frontend v1.9.10+
- Improved group node handling and input resolution
- Added widget name validation
- Enhanced virtual node and BYPASS mode support

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Conversion timeout | No browser connected | Open ComfyUI in a browser and keep the tab active |
| Empty conversion result | Invalid workflow or frontend not loaded | Verify JSON validity and refresh the browser |

## License

[MIT](LICENSE) © 2025 Shun.L
