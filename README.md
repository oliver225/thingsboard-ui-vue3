<div align="center">
  <h1>ThingsBoard UI</h1>
  <p>A modern ThingsBoard front-end built on top of Vue 3 + Vite, rebuilt from the <a href="https://github.com/vbenjs/vue-vben-admin">Vue Vben Admin</a> <code>web-antdv-next</code> application.</p>

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**English** | [中文](./README.zh-CN.md)

</div>

## Introduction

`ThingsBoard UI` is a brand-new front-end for [ThingsBoard](https://thingsboard.io/), the open-source IoT platform. It is the successor of [thingsboard-ui-vue3](https://github.com/oliver225/thingsboard-ui-vue3), rebuilt on the latest **Vue 3 + Vite + TypeScript** stack using the **Ant Design Vue (next)** variant of [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) as the foundation.

The repository is a pnpm + Turborepo monorepo: the application itself lives in `apps/web-ui`, while reusable framework code (layouts, stores, access control, request, icons, locales, etc.) lives under `packages/` and shared tooling under `internal/`.

## Features

- **Latest stack** — Vue 3, Vite, TypeScript, Pinia, Vue Router
- **Ant Design Vue (next)** — modern, full-featured component library
- **Monorepo** — pnpm workspace orchestrated by Turborepo
- **Theming** — multiple theme colors with dark mode
- **Internationalization** — built-in i18n (Chinese / English)
- **Access control** — dynamic, route-based permission system
- **Ready for ThingsBoard** — wired to proxy `/api` to a ThingsBoard backend

## Requirements

- Node.js `^22.18.0 || ^24.0.0`
- pnpm `>=11`

## Getting Started

```bash
# install dependencies (pnpm only)
pnpm install

# start the dev server (http://localhost:3000)
pnpm dev

# build for production
pnpm build
```

> The dev server proxies `/api` to a ThingsBoard backend. Adjust the `target` in [apps/web-ui/vite.config.ts](apps/web-ui/vite.config.ts) (default `http://localhost:8080`) to point at your instance.

## Connecting to a ThingsBoard backend

The Vben Nitro mock server has been removed. The app talks to a real backend:

1. `VITE_NITRO_MOCK=false` in [apps/web-ui/.env.development](apps/web-ui/.env.development).
2. The dev proxy forwards requests from `/api` to your ThingsBoard server — set the `target` in [apps/web-ui/vite.config.ts](apps/web-ui/vite.config.ts).
3. For production, set `VITE_GLOB_API_URL` in [apps/web-ui/.env.production](apps/web-ui/.env.production) or handle the `/api` route at your gateway / reverse proxy.

## Project Structure

```
.
├── apps
│   └── web-ui              # the main application
├── docs                    # framework documentation (VitePress)
├── internal                # shared build / lint / tsconfig tooling
├── packages                # reusable framework packages (@core, effects, ...)
└── scripts                 # workspace scripts (turbo-run, vsh, deploy)
```

## Docker

```bash
pnpm build:docker
```

Builds a local Nginx image serving `apps/web-ui/dist`. See [scripts/deploy/](scripts/deploy/) for the Dockerfile and Nginx config.

## License

[Apache-2.0](LICENSE) © oliver225. See [NOTICE](NOTICE) for attribution details.

This project is derived from [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) (MIT). The reusable packages under `packages/` and `internal/` retain their original MIT license and copyright — see [LICENSE-MIT](LICENSE-MIT) for the original license text. Many thanks to the Vben team for their work.
