# ComfyUI Portal Endpoint

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/ShunL12324/comfy-portal-endpoint/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green.svg)](https://github.com/comfyanonymous/ComfyUI)

REST API extension for ComfyUI that handles workflow management and UI → API format conversion. Built for [Comfy Portal](https://github.com/ShunL12324/comfy-portal).

Conversion runs in a **headless Chromium browser** (via [Playwright](https://playwright.dev/python/)) that loads the real ComfyUI frontend — ensuring full compatibility with all node types including custom nodes.

## Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/ShunL12324/comfy-portal-endpoint
```

Or search **comfy-portal-endpoint** in ComfyUI Manager.

Restart ComfyUI — the extension auto-installs all dependencies (Playwright, Chromium, system libs on Linux) on first startup.

## API

All endpoints are under ComfyUI's HTTP server. Prefix with `/api` when using the default proxy.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cpe/health` | GET | Browser status |
| `/cpe/workflow/list` | GET | List workflow files |
| `/cpe/workflow/get?filename=` | GET | Read a workflow file |
| `/cpe/workflow/save` | POST | Save a workflow file |
| `/cpe/workflow/convert` | POST | Convert UI format → API format |
| `/cpe/workflow/get-and-convert?filename=` | GET | Read + convert in one call (recommended) |

<details>
<summary>Convert response example</summary>

```json
{
  "status": "success",
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
</details>

## How It Works

```
Client → HTTP → ComfyUI PromptServer
                    ↓
              comfy-portal-endpoint
                    ↓
              Headless Chromium (page pool)
              ┌──────────┐ ┌──────────┐
              │ Page 1   │ │ Page 2   │
              │ ComfyUI  │ │ ComfyUI  │
              │ Frontend │ │ Frontend │
              └──────────┘ └──────────┘
```

Each conversion request acquires a page from the pool, reloads it for clean state, runs `graphToPrompt()` via `page.evaluate()`, and returns the page to the pool. Default pool size is 2 for concurrent requests.

First request takes ~5–15s (browser cold start). Subsequent requests ~1–2s.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `503` on convert | `pip install playwright && python -m playwright install chromium` |
| Linux: missing `.so` libs | `sudo python -m playwright install-deps` |
| Docker: browser won't launch | Add `RUN playwright install-deps chromium` to Dockerfile |
| `error` in `/cpe/health` | Auto-recovers on next request. Check logs for details |

## Changelog

### v1.2.0
- Page pool for concurrent conversions (default 2 pages)
- Auto-install system deps on Linux (`playwright install-deps`)
- Auto-install pip via `get-pip.py` fallback
- Robust process cleanup via driver PID
- Auto-replace broken pages in pool
- Fixed duplicate log output

### v1.1.0
- Replaced WebSocket architecture with Playwright headless browser
- Works on headless servers, Docker, cloud VMs
- Auto-installs Playwright + Chromium on first startup
- Added `/cpe/health` endpoint and auto-recovery

### v1.0.2
- Fixed array widget values, updated for ComfyUI frontend v1.9.10+
- Improved group node handling and virtual node support

## License

[MIT](LICENSE) © 2025 Shun.L
