# ThingsBoard web application

This directory contains the Vben Admin v5 frontend for ThingsBoard.

- [English setup and deployment guide](../../README.md)
- [中文安装与部署说明](../../README.zh-CN.md)

Run the workspace commands from the repository root:

```bash
pnpm install
pnpm dev
pnpm check:thingsboard
pnpm build
```

Configure the development backend in `apps/web-ui/.env.development.local` with `VITE_TB_TARGET=http://localhost:8080`. The development server uses port `3001`; the production output is `apps/web-ui/dist`.

当前目录为 ThingsBoard 主应用。完整功能范围、版本说明、默认账号、环境配置和部署示例请以根目录中英文 README 为准。
