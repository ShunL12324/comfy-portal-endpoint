# ComfyUI Portal Endpoint

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/ShunL12324/comfy-portal-endpoint/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green.svg)](https://github.com/comfyanonymous/ComfyUI)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

A ComfyUI extension that provides API endpoints for workflow management, designed to power [Comfy Portal](https://github.com/ShunL12324/comfy-portal) - a modern iOS client for ComfyUI.

## Features

- **Workflow Management** - List, retrieve, and save workflows via REST API
- **Format Conversion** - Convert UI workflows to API-executable format
- **Headless Browser** - Uses Playwright Chromium for conversion — no real browser needed
- **Works Everywhere** - Runs on headless Linux servers, Docker containers, and any environment

## Requirements

- Python 3.8+
- ComfyUI
- [Playwright](https://playwright.dev/python/) (installed automatically via `requirements.txt`)

| Use Case | Supported |
|----------|-----------|
| iOS App (WebView) | Yes |
| Browser-based | Yes |
| Headless/API-only | Yes |

## Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/ShunL12324/comfy-portal-endpoint
pip install -r comfy-portal-endpoint/requirements.txt
```

Restart ComfyUI to activate the extension. On first startup, the plugin will automatically install the Chromium browser binary for Playwright (this may take a minute).

You should see in the console:
```
[comfy-portal-endpoint] [INFO] Checking Playwright Chromium browser installation...
[comfy-portal-endpoint] [INFO] Playwright Chromium browser is ready
```

## How It Works

Workflow conversion uses a **headless Chromium browser** managed by Playwright:

1. On the first conversion request, a headless browser is launched and navigates to the ComfyUI page
2. The browser loads LiteGraph and the plugin's JavaScript
3. Conversion runs via `page.evaluate()` calling `graphToPrompt()` in the browser context
4. The browser stays running for subsequent requests (sub-second response times)

```
HTTP Request → HeadlessBrowserManager.convert_workflow() → page.evaluate(JS) → Response
```

## API Reference

All endpoints are prefixed with `/api/cpe/`.

### Health Check

```http
GET /api/cpe/health
```

Returns the headless browser status.

**Response:**
```json
{
  "status": "success",
  "browser": {
    "status": "ready"
  }
}
```

Possible browser statuses: `not_installed`, `not_initialized`, `initializing`, `ready`, `error`.

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

Converts UI format to API-executable format using the headless browser. The first request may take 5–10 seconds (browser startup); subsequent requests are sub-second.

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

### v1.1.0

- **Breaking:** Replaced WebSocket/callback conversion with Playwright headless browser
- Workflow conversion now works without any real browser connection
- Added `/cpe/health` endpoint for browser status monitoring
- Added automatic Playwright Chromium installation on plugin load
- Added automatic browser recovery on conversion failure
- Removed `/cpe/workflow/convert/callback` endpoint (no longer needed)
- Supports headless Linux servers and Docker containers

### v1.0.2 (2025-11-26)

- Fixed array widget values being misinterpreted as node connections
- Updated conversion logic to match ComfyUI frontend v1.9.10+
- Improved group node handling and input resolution
- Added widget name validation
- Enhanced virtual node and BYPASS mode support

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 503 on convert | Playwright not installed or browser failed to start | Check logs; run `pip install playwright && python -m playwright install chromium` |
| First convert is slow | Browser starting up for the first time | Normal — subsequent requests will be fast |
| `not_installed` status | Playwright pip package missing | Run `pip install -r requirements.txt` |
| Browser crash / error | Chromium process died | The plugin auto-recovers on next request; check `/cpe/health` for status |
| Linux missing deps | Chromium needs system libraries | Run `python -m playwright install-deps chromium` |

## License

[MIT](LICENSE) © 2025 Shun.L
