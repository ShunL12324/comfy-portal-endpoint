# ComfyUI Portal Endpoint Extension

这是一个 ComfyUI 的扩展，主要提供额外的 API 端点功能。

## 安装

1. 将此文件夹放置在 ComfyUI 的 `custom_nodes` 目录下
2. 重启 ComfyUI 服务器

## API 端点

### 状态检查

- 端点: `/portal/status`
- 方法: GET
- 描述: 返回 API 的运行状态
- 响应示例:

```json
{
  "status": "ok",
  "message": "Portal API is running"
}
```

## 开发说明

- 本扩展专注于提供 API 端点，不包含自定义节点
- 所有 API 端点都以 `/portal/` 为前缀
- 使用 aiohttp 框架处理 API 请求

## 许可证

MIT
