<div align="center">
  <h1>ThingsBoard UI</h1>
  <p>基于 Vue 3 + Vite 构建的全新 ThingsBoard 前端，脱胎于 <a href="https://github.com/vbenjs/vue-vben-admin">Vue Vben Admin</a> 的 <code>web-antdv-next</code> 应用。</p>

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

[English](./README.md) | **中文**

</div>

## 简介

`ThingsBoard UI` 是开源物联网平台 [ThingsBoard](https://thingsboard.io/) 的全新前端，是 [thingsboard-ui-vue3](https://github.com/oliver225/thingsboard-ui-vue3) 的继任版本。它以 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 的 **Ant Design Vue（next）** 版应用为基座，使用最新的 **Vue 3 + Vite + TypeScript** 技术栈重构。

仓库采用 pnpm + Turborepo 的 monorepo 结构：业务应用位于 `apps/web-ui`，可复用的框架代码（布局、状态、权限、请求、图标、国际化等）位于 `packages/`，共享工具链位于 `internal/`。

## 特性

- **最新技术栈** —— Vue 3、Vite、TypeScript、Pinia、Vue Router
- **Ant Design Vue（next）** —— 现代化、功能完备的组件库
- **Monorepo** —— pnpm workspace + Turborepo 编排
- **主题** —— 多主题色，支持暗黑模式
- **国际化** —— 内置 i18n（中文 / 英文）
- **权限控制** —— 基于路由的动态权限方案
- **对接 ThingsBoard** —— 已预置将 `/api` 代理到 ThingsBoard 后端

## 环境要求

- Node.js `^22.18.0 || ^24.0.0`
- pnpm `>=11`

## 快速开始

```bash
# 安装依赖（仅支持 pnpm）
pnpm install

# 启动开发服务（http://localhost:3000）
pnpm dev

# 生产构建
pnpm build
```

> 开发服务会把 `/api` 代理到 ThingsBoard 后端。请按实际环境修改 [apps/web-ui/vite.config.ts](apps/web-ui/vite.config.ts) 中的 `target`（默认 `http://localhost:8080`）。

## 对接 ThingsBoard 后端

已移除 Vben 自带的 Nitro Mock 服务，应用直接对接真实后端：

1. [apps/web-ui/.env.development](apps/web-ui/.env.development) 中 `VITE_NITRO_MOCK=false`。
2. 开发代理会把 `/api` 转发到你的 ThingsBoard 服务，请在 [apps/web-ui/vite.config.ts](apps/web-ui/vite.config.ts) 设置 `target`。
3. 生产环境请在 [apps/web-ui/.env.production](apps/web-ui/.env.production) 设置 `VITE_GLOB_API_URL`，或交由网关 / 反向代理处理 `/api`。

## 目录结构

```
.
├── apps
│   └── web-ui              # 主应用
├── docs                    # 框架文档（VitePress）
├── internal                # 共享构建 / lint / tsconfig 工具链
├── packages                # 可复用框架包（@core、effects ...）
└── scripts                 # 工作区脚本（turbo-run、vsh、deploy）
```

## Docker

```bash
pnpm build:docker
```

构建一个本地 Nginx 镜像，托管 `apps/web-ui/dist`。Dockerfile 与 Nginx 配置见 [scripts/deploy/](scripts/deploy/)。

## 开源协议

[Apache-2.0](LICENSE) © oliver225。版权归属详见 [NOTICE](NOTICE)。

本项目衍生自 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)（MIT）。 `packages/` 与 `internal/` 下的可复用框架包仍保留其原有的 MIT 协议与版权署名，MIT 协议原文见 [LICENSE-MIT](LICENSE-MIT)。在此特别感谢 Vben 团队的开源贡献。
