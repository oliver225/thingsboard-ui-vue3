<div align="center">
  <img src="./apps/web-ui/public/logo.svg" alt="ThingsBoard UI Vue3" width="88" />
  <h1>ThingsBoard UI Vue3</h1>
  <p>基于 Vue 3 的 ThingsBoard 管理前端，使用 Vben Admin v5 重构。</p>
</div>

[English](./README.md) | **简体中文**

[![前端版本](https://img.shields.io/badge/frontend-4.3.1-green)](./package.json)
[![ThingsBoard](https://img.shields.io/badge/ThingsBoard-4.3.1.5-blue)](https://thingsboard.io/)
[![Vben Admin](https://img.shields.io/badge/Vben_Admin-v5-blue)](https://github.com/vbenjs/vue-vben-admin)

## 项目介绍

ThingsBoard UI Vue3 为现有 [ThingsBoard](https://thingsboard.io/) 后端提供 Vue 管理界面。采用 Vben Admin v5、pnpm 工作区、共享组件和 antdv-next 重构。

本仓库包含前端代码。ThingsBoard 后端需要单独运行，登录时使用后端的用户账号。菜单与操作权限取决于用户的 ThingsBoard 角色及后端开放的接口。

## 演示站点

地址：[https://thingsboard.pincore.cn](https://thingsboard.pincore.cn)

使用 ThingsBoard 默认账号：

| 角色 | 用户名 | 密码 |
| --- | --- | --- |
| 租户管理员 | `tenant@thingsboard.org` | `tenant` |
| 客户用户 | `customer@thingsboard.org` | `customer` |
| 系统管理员 | `sysadmin@thingsboard.org` | `sysadmin` |

账号参考 [ThingsBoard 官方安装说明](https://thingsboard.io/docs/installation/ubuntu/#step-7-start-thingsboard)。自行部署时，租户和客户演示账号需要安装演示数据；未安装演示数据时，请使用自己后端创建的账号。

## 版本与迁移

| 项目 | 版本 / 范围 |
| --- | --- |
| ThingsBoard 后端版本 | `4.3.1.5` |
| 管理框架 | Vben Admin v5 |
| 主应用目录 | `apps/web-ui` |
| 框架迁移分支 | `vben` |

前端包采用三段版本号 `4.3.1`，目标后端版本为 `4.3.1.5`。本文档对应 Vben v5 版本，其他后端版本需要单独验证兼容性。

从旧前端迁移时，请使用本工作区的环境文件和命令。主应用已从仓库根目录迁入 `apps/web-ui`，第三方依赖版本通过 pnpm Catalog 集中管理。本地开发使用 `VITE_TB_TARGET` 配置代理目标，不再沿用旧版 `VITE_PROXY` 写法。

## 功能范围

- **角色首页**：系统管理员、租户管理员、客户用户导航，实体统计、设备地图和 API 用量视图。
- **实体与配置**：设备、资产、实体视图、设备/资产配置、客户分配、批量操作及设备导入。
- **实体详情**：属性、遥测、事件、凭据、计算字段和告警规则配置。
- **租户与客户**：租户、租户配置、管理员、客户及客户用户管理。
- **规则链**：基于 AntV X6 的图形编辑器、节点配置表单及脚本测试工具。
- **告警与通知**：告警处理、审计日志、通知接收人、模板、规则、发送记录及 WebSocket 实时更新。
- **资源管理**：仪表板记录与客户分配、部件包和部件类型、图片、SCADA 图标、JavaScript 资源及 OTA 升级包。
- **管理设置**：队列、OAuth 2.0 客户端与域名、安全与邮件设置、移动中心配置及边缘管理页面。
- **账号与界面**：账号激活、密码重置、个人资料、API 密钥、中英文切换及可配置的明暗主题。

当前仪表板功能涵盖记录与分配管理。完整可视化仪表板设计器、运行展示和视频监控流程暂未列入本版本已完成功能。

## 界面预览

### 系统管理员首页

![系统管理员首页：实体统计与系统资源监控](./images/system-admin-home.png)

### 设备详情

![设备详情：连接状态与实体管理页签](./images/device-details.png)

### 规则链编辑器

![可视化规则链编辑器：节点面板与消息路由](./images/rule-chain-editor.png)

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架与语言 | Vue 3.5、TypeScript 6、Vben Admin v5 |
| 工具链 | Vite 8、pnpm 11、Turborepo |
| UI 与样式 | antdv-next、Tailwind CSS 4 |
| 状态与路由 | Pinia 4、Vue Router 5 |
| 图编辑与图表 | AntV X6 3、ECharts 6 |
| 编辑器与数据 | Monaco Editor、Protobuf、SheetJS |
| 网络与国际化 | Axios、WebSocket、Vue I18n 11 |

依赖声明见 [pnpm-workspace.yaml](./pnpm-workspace.yaml)，实际锁定版本见 [pnpm-lock.yaml](./pnpm-lock.yaml)。第三方依赖使用 `catalog:`，项目内部包使用 `workspace:*`。

## 快速开始

### 1. 准备环境

- Node.js `^22.18.0 || ^24.12.0`，以 [package.json](./package.json) 为准。[.node-version](./.node-version) 指定 `24.16.0`。
- pnpm `11.16.0`，与仓库 `packageManager` 字段一致。
- 可访问的 ThingsBoard `4.3.1.5` 后端及有效用户账号。

### 2. 获取代码并安装依赖

```bash
git clone --branch vben https://github.com/oliver225/thingsboard-ui-vue3.git
cd thingsboard-ui-vue3
npm install --global pnpm@11.16.0
pnpm install --frozen-lockfile
```

请使用包含本 Vben v5 工作区的分支。以下命令均在仓库根目录执行。

### 3. 配置后端

新建 `apps/web-ui/.env.development.local`：

```dotenv
VITE_TB_TARGET=http://localhost:8080
```

填写后端服务地址，末尾不要附加 `/api`。[Vite 代理](./apps/web-ui/vite.config.ts) 会保留请求路径，将 `/api` 请求及 WebSocket 连接转发至后端。不设置时默认连接 `http://localhost:8080`。本地覆盖文件已加入 Git 忽略规则。

### 4. 启动前端

```bash
pnpm dev
```

浏览器访问 [http://localhost:3001](http://localhost:3001)，使用 ThingsBoard 账号登录。开发配置默认关闭 mock 后端。

## 构建与部署

```bash
pnpm check:thingsboard
pnpm build
```

静态产物位于 `apps/web-ui/dist`。生产环境默认使用根路径 `/`、`/api` 接口地址和 hash 路由。`VITE_TB_TARGET` 用于开发代理；生产环境需要单独配置反向代理。

将 `apps/web-ui/dist` 的**目录内容**复制到 Web 服务器的静态目录。以下示例通过独立域名的根路径提供服务，请按实际环境修改静态目录、域名及后端地址。两个配置块均放在 Nginx 的 `http` 上下文中：

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name thingsboard-ui.example.com;
    root /var/www/thingsboard-ui;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 3600s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

此配置保留 `/api` 前缀，并转发 [WebSocket 所需请求头](https://nginx.org/en/docs/http/websocket.html)。HTTPS 请结合部署环境配置证书。如需部署到 `/vue/` 等子路径，还需调整 `VITE_BASE`、静态目录映射及使用根路径的品牌资源，再重新构建。

`pnpm preview` 用于本地预览构建产物。[Dockerfile](./scripts/deploy/Dockerfile) 同样构建主应用，但仓库附带的 [Nginx 配置](./scripts/deploy/nginx.conf) 仅提供静态服务，部署时仍需补充后端代理。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动 ThingsBoard 前端开发服务 |
| `pnpm build` | 构建 ThingsBoard 前端 |
| `pnpm preview` | 本地预览生产产物 |
| `pnpm build:analyze` | 构建并分析产物体积 |
| `pnpm check:thingsboard` | 检查主应用类型 |
| `pnpm check:type` | 执行工作区类型检查 |
| `pnpm lint` | 执行仓库代码规范检查流程 |
| `pnpm format` | 格式化代码 |
| `pnpm dev:docs` / `pnpm build:docs` | 启动 / 构建保留的框架文档 |

## 目录结构

```text
apps/
  web-ui/                 ThingsBoard Web 主应用
    src/
      adapter/            表单、表格和 UI 适配
      api/                认证及 ThingsBoard 接口
      components/         共享业务组件
      locales/            应用多语言
      router/             路由与权限守卫
      store/              应用状态
      views/_core/        登录、个人中心及角色首页
      views/tb/           ThingsBoard 管理页面
  agent/                  预留应用骨架
  uni-app/                预留应用骨架
packages/                 Vben 及应用共享 UI 包
internal/                 构建、规范、TypeScript 和主题配置
scripts/                  工作区工具与部署文件
docs/                     保留的框架文档
pnpm-workspace.yaml       工作区范围与依赖版本目录
```

## 品牌与偏好设置

应用标题在 `apps/web-ui/.env` 中配置。品牌、版权/备案信息和默认偏好设置位于 [apps/web-ui/src/preferences.ts](./apps/web-ui/src/preferences.ts)，Logo 和登录页联系图片位于 `apps/web-ui/public`。

偏好设置会持久化到浏览器，缓存优先于默认值。修改已有用户的默认设置时，应使用定向迁移或重置偏好设置；仅修改默认配置不一定覆盖旧缓存。

## 联系与贡献

- 维护者：[oliver225](https://github.com/oliver225)
- 问题反馈：[thingsboard-ui-vue3/issues](https://github.com/oliver225/thingsboard-ui-vue3/issues)
- 邮箱：[1069035666@qq.com](mailto:1069035666@qq.com)
- 微信：`17621315188`

<img src="./apps/web-ui/public/login/weixin.png" alt="微信联系二维码" width="180" />

提交问题时请附上复现步骤、前端提交号、后端版本及用户角色。提交 Pull Request 前请运行相关类型检查和代码规范检查，提交信息采用 `fix(thingsboard-ui): ...` 等 Conventional Commits 格式。

## 致谢与许可

本项目基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)，对接 [ThingsBoard](https://thingsboard.io/)。框架使用方式可参考 [Vben 官方文档](https://doc.vben.pro/)。

根目录 [LICENSE](./LICENSE) 包含 MIT 许可及 Vben 版权声明。第三方代码和依赖仍遵循各自适用的许可，根目录许可证不替代这些条款。本版本的许可文件与旧仓库的 Apache-2.0 声明应分别核对。
