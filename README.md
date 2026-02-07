# ComfyUI Portal Endpoint

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/ShunL12324/comfy-portal-endpoint/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green.svg)](https://github.com/comfyanonymous/ComfyUI)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

A ComfyUI custom node extension that exposes REST API endpoints for workflow management and format conversion. Built to power [Comfy Portal](https://github.com/ShunL12324/comfy-portal) — a native iOS client for ComfyUI.

---

## Overview

ComfyUI stores workflows in a **UI format** (full graph with node positions, groups, and metadata), but its execution engine requires an **API format** (flat node-to-node mapping). This extension bridges the gap by providing HTTP endpoints that manage workflow files and perform the UI → API conversion server-side.

Conversion is powered by a **headless Chromium browser** (via [Playwright](https://playwright.dev/python/)) that loads the actual ComfyUI frontend, ensuring 100% compatibility with all node types — including custom nodes.

### Key Features

- **Workflow CRUD** — List, read, and save workflow files through a clean REST interface
- **Server-side Conversion** — Convert UI workflows to API-executable format without a browser tab
- **Zero Configuration** — Playwright and Chromium are auto-installed on first startup
- **Environment Agnostic** — Works on headless Linux servers, Docker containers, cloud VMs, and local machines
- **Self-healing** — Automatic browser recovery on crash; lazy initialization on first request

---

## Compatibility

| Environment | Supported |
|-------------|-----------|
| Windows / macOS / Linux | ✅ |
| Headless server (no display) | ✅ |
| Docker container | ✅ |
| Cloud VM (SSH-only) | ✅ |
| ComfyUI ≥ 0.12.x | ✅ |

---

## Installation

### Via Git (recommended)

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/ShunL12324/comfy-portal-endpoint
```

### Via ComfyUI Manager

Search for **comfy-portal-endpoint** in the ComfyUI Manager and install.

### Post-install

Restart ComfyUI. On first startup the extension will:

1. **Auto-install** the `playwright` Python package (if not present)
2. **Auto-download** the Chromium browser binary (~170 MB, one-time)

Console output during setup:

```
[comfy-portal-endpoint] [INFO] Playwright not found. Installing automatically — this may take a while...
[comfy-portal-endpoint] [INFO] [pip] Successfully installed playwright-1.58.0
[comfy-portal-endpoint] [INFO] Checking Playwright Chromium browser — first time download may take a few minutes...
[comfy-portal-endpoint] [INFO] [playwright] Downloading Chromium: 100% of 172.8 MiB
[comfy-portal-endpoint] [INFO] Playwright Chromium browser is ready
```

> **Note:** The first startup takes ~60–90 seconds for the download. Subsequent restarts add zero overhead.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Client (iOS App / curl / any HTTP client)              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────┐
│  ComfyUI PromptServer (aiohttp)                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  comfy-portal-endpoint                             │ │
│  │                                                    │ │
│  │  /cpe/workflow/list    → File system scan          │ │
│  │  /cpe/workflow/get     → File read                 │ │
│  │  /cpe/workflow/save    → File write                │ │
│  │  /cpe/workflow/convert → HeadlessBrowserManager    │ │
│  │  /cpe/health           → Browser status            │ │
│  └──────────────────────────┬─────────────────────────┘ │
│                             │ page.evaluate(JS)         │
│  ┌──────────────────────────▼─────────────────────────┐ │
│  │  Headless Chromium (Playwright)                    │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  ComfyUI Frontend                            │  │ │
│  │  │  LiteGraph + registered node types           │  │ │
│  │  │  window.__cpe_graphToPrompt()                │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Conversion flow:**

1. HTTP request arrives at `/cpe/workflow/convert`
2. `HeadlessBrowserManager` ensures the browser is initialized (lazy, one-time)
3. Page is reloaded to guarantee a clean state
4. `page.evaluate()` runs `graphToPrompt()` inside the real ComfyUI frontend context
5. Result is returned as JSON — all node types, widget values, and connections are fully resolved

---

## API Reference

All endpoints are served under ComfyUI's HTTP server. When accessed through the default proxy, prefix with `/api`.

### `GET /cpe/health`

Returns the current status of the headless browser.

**Response:**

```json
{
  "status": "success",
  "browser": {
    "status": "ready"
  }
}
```

| Browser Status | Description |
|----------------|-------------|
| `not_installed` | Playwright package is missing |
| `not_initialized` | Browser has not been started yet (starts on first convert) |
| `initializing` | Browser is currently starting up |
| `ready` | Browser is running and ready for conversion |
| `error` | Browser encountered an error (see `error` field) |

---

### `GET /cpe/workflow/list`

List all workflow files in the user's workflow directory.

**Response:**

```json
{
  "status": "success",
  "workflows": [
    {
      "filename": "my_workflow.json",
      "size": 4096,
      "modified": 1706000000.0
    }
  ]
}
```

---

### `GET /cpe/workflow/get`

Retrieve the raw content of a workflow file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | `string` | Yes | Path relative to the workflows directory |

**Response:**

```json
{
  "status": "success",
  "filename": "my_workflow.json",
  "workflow": "<raw JSON string>"
}
```

---

### `POST /cpe/workflow/save`

Save a workflow file to disk.

**Request body:**

```json
{
  "workflow": "<workflow JSON string>",
  "name": "my_workflow.json"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow` | `string` | Yes | Workflow JSON as a string |
| `name` | `string` | No | Filename (auto-generated as `workflow_<timestamp>.json` if omitted) |

---

### `POST /cpe/workflow/convert`

Convert a workflow from UI format to API-executable format.

**Request body:**

```json
{
  <workflow JSON object>
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Workflow converted successfully",
  "data": {
    "workflow": {
      "1": {
        "inputs": { "ckpt_name": "model.safetensors" },
        "class_type": "CheckpointLoaderSimple",
        "_meta": { "title": "Load Checkpoint" }
      }
    }
  }
}
```

| Status Code | Meaning |
|-------------|---------|
| `200` | Conversion successful |
| `400` | Invalid request body |
| `503` | Browser unavailable — Playwright not installed or Chromium failed to start |

> **Performance:** First request takes 5–15 seconds (browser startup + page load). Subsequent requests complete in ~1–2 seconds.

---

### `GET /cpe/workflow/get-and-convert`

Retrieve a workflow file and convert it in a single request. This is the **recommended** endpoint for clients.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | `string` | Yes | Path relative to the workflows directory |

**Response:** Same as `/cpe/workflow/convert`, with an additional `filename` field.

---

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| `503` on convert | Playwright or Chromium not available | Check logs; run `pip install playwright && python -m playwright install chromium` in your ComfyUI Python environment |
| First convert takes 10+ seconds | Normal cold start | The headless browser needs to launch and load the ComfyUI frontend. Subsequent requests are fast |
| `class_type: null` in output | Node types not registered | The browser page didn't fully initialize. Check that ComfyUI is healthy and retry |
| `not_installed` in `/cpe/health` | `playwright` pip package missing | Restart ComfyUI to trigger auto-install, or run `pip install playwright` manually |
| Browser crash / `error` status | Chromium process died | Auto-recovers on next convert request. Check `/cpe/health` to verify |
| Linux: missing shared libraries | Chromium requires system dependencies | Run `python -m playwright install-deps chromium` (requires root) |
| Docker: browser fails to launch | Missing `--no-sandbox` or system deps | Ensure your Dockerfile installs Playwright deps: `RUN playwright install-deps chromium` |

---

## Changelog

### v1.1.0

- Replaced WebSocket/callback architecture with Playwright headless browser
- Conversion now works on headless servers, Docker, and cloud VMs — no browser tab required
- Auto-installs `playwright` pip package and Chromium binary on first startup
- Added `/cpe/health` endpoint for monitoring browser status
- Added automatic browser recovery on failure with single-retry logic
- Page is reloaded before each conversion to ensure clean frontend state
- Waits for full node type registration before marking browser as ready
- Streamed install progress with sanitized log output
- Removed `/cpe/workflow/convert/callback` endpoint
- Removed WebSocket event system and task queue

### v1.0.2

- Fixed array widget values being misinterpreted as node connections
- Updated conversion logic to match ComfyUI frontend v1.9.10+
- Improved group node handling and input resolution
- Added widget name validation
- Enhanced virtual node and BYPASS mode support

---

## License

[MIT](LICENSE) © 2025 Shun.L
