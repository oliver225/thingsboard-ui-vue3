# ThingsBoard UI Vue

A Vue 3 frontend for [ThingsBoard](https://thingsboard.io/) (v4.2.0), built with Vite, TypeScript, and Ant Design Vue. Based on [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin).

[中文文档](./README.zh-CN.md)

> ⭐ If this project helps you, please give it a star — watch / star / fork appreciated!

## Live Demo

- **URL:** http://thingsboard.yantsing.com/vue/
- **Username:** 1069035666@qq.com
- **Password:** 17621315188

> The demo is connected to a real ThingsBoard v4.2.0 instance.

## Features

- **Device Management** — list, create, edit, delete devices; import in bulk
- **Asset Management** — asset list, profiles, bulk import
- **Customer Management** — manage customers with their own devices, assets, and dashboards
- **Dashboard** — data visualization dashboards with widget support
- **Rule Engine** — visual rule chain editor powered by AntV X6
- **Entity Views** — custom views over device/asset telemetry
- **OTA Updates** — manage firmware/software packages for devices
- **Alarms** — alarm list, filtering, and acknowledgement
- **Audit Logs** — full audit trail of system operations
- **Notification Center** — notification rules, templates, recipients, and sent records
- **Resource Library** — widget bundles, image library, SCADA symbols, JavaScript library
- **Admin Settings** — system-level configuration (SYS_ADMIN)
- **Multi-language** — English and Chinese (Simplified), switchable at runtime
- **Dark Mode** — full dark theme support
- **Responsive Layout** — adapts to different screen sizes

## Tech Stack

| Category | Library / Version |
|---|---|
| Framework | Vue 3.5 + TypeScript 5 |
| Build Tool | Vite 6 |
| UI Library | Ant Design Vue 4 |
| State Management | Pinia 2 |
| Router | Vue Router 4 |
| Rule Engine Graph | AntV X6 2 |
| Charts | ECharts 5 |
| Code Editor | Monaco Editor |
| i18n | Vue I18n 11 |
| HTTP | Axios |
| CSS | UnoCSS + Less |

## ThingsBoard Compatibility

| UI Version | ThingsBoard Version |
|---|---|
| v4.x (this branch) | v4.2.0 |
| v3.x | v3.x (see other branches) |

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/oliver225/thingsboard-ui-vue.git
cd thingsboard-ui-vue
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment**

Edit `.env.development`:

```env
# Proxy: [path prefix, target, keep host header]
VITE_PROXY = [["/api","http://127.0.0.1:8080/api",false]]
VITE_GLOB_API_URL = /api
```

Replace `http://127.0.0.1:8080` with your ThingsBoard backend address.

**4. Start dev server**

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

**5. Build for production**

```bash
npm run build
```

Output is in the `dist/` directory. Deploy it behind Nginx or any static file server, proxying `/api` to your ThingsBoard backend.

## Nginx Example

```nginx
server {
    listen       80;
    server_name  localhost;

    access_log  /var/log/nginx/thingsboard.access.log  main;

    # Vue frontend (deployed under /vue path)
    location /vue {
        alias  /opt/thingsboard/vue;
        index  index.html;
        try_files $uri $uri/vue /vue/index.html;
    }

    # ThingsBoard backend
    location / {
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  Host  $http_host;
        proxy_pass  http://127.0.0.1:18080;
        proxy_max_temp_file_size 0;
    }

    # REST API
    location /api {
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  Host  $http_host;
        proxy_pass  http://127.0.0.1:18080/api;
        proxy_max_temp_file_size 0;
    }

    # WebSocket
    location /api/ws {
        proxy_pass http://127.0.0.1:18080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run type:check` | TypeScript type checking |
| `npm run lint:all` | ESLint + Prettier + Stylelint |

> All `npm run` commands above can also be run with `pnpm run`.

## Project Structure

```
src/
├── api/            # Axios API clients (mirrors ThingsBoard REST API)
├── assets/         # Static assets (icons, images, SVGs)
├── components/     # Shared reusable components
├── enums/          # TypeScript enums
├── hooks/          # Vue composables
├── layouts/        # App shell layouts
├── locales/        # i18n translation files
│   └── lang/
│       ├── en/     # English translations
│       └── zh-CN/  # Chinese translations
├── router/         # Route definitions
├── store/          # Pinia stores
├── utils/          # Utility functions
└── views/
    └── tb/         # ThingsBoard feature pages
        ├── alarm/
        ├── asset/
        ├── customer/
        ├── dashboard/
        ├── device/
        ├── notification/
        ├── ruleChain/
        └── ...
```

## Screenshots

![Rule Engine](images/rule_chain_20240305160850.png)
![Login](images/login_page.png)

## Contact

WeChat: **17621315188** — feel free to reach out for questions or collaboration.

Email: 1069035666@qq.com

<img title="WeChat QR" src="./images/weixin.jpg" width="200" />

## License

Apache License 2.0
