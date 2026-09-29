# ThingsBoard · vben1

基于 [vue-vben-admin main](https://github.com/vbenjs/vue-vben-admin/tree/d4b2b02c54175746ab96eda7e0c83a9574b7fca6)（`d4b2b02`），从本仓库 `vben` 的 `93c93b5` 迁移第一阶段业务。应用以 `apps/web-antdv-next` 为起点；`packages`、`internal`、`scripts` 保持上游原样。

## 启动

使用满足根 `package.json` engines 的 Node（上游 `.node-version` 为 24.16.0）和 pnpm 11.16.0，在仓库根目录执行：

```sh
pnpm install --filter thingsboard-ui... --filter thingsboard-ui-vue3...
pnpm dev
```

开发端口为 3001；`/api` 默认代理到 `http://localhost:8080`，保留 `/api` 前缀。需要其他后端时，在本目录新建 `.env.development.local`：

```dotenv
VITE_TB_TARGET=http://your-thingsboard-host:8080
```

生产环境同样使用 `/api`，由部署服务器反向代理到 ThingsBoard，SPA 使用 hash 路由。

```sh
pnpm check:thingsboard
pnpm build:thingsboard
```

产物位于 `apps/web-ui/dist`。应用缓存命名空间为 `thingsboard-vben1`，独立于旧应用。

## 本阶段范围

- 邮箱/密码登录、JWT 和 refreshToken 保存、读取真实用户及 authority、退出登录、受保护路由跳转。
- ThingsBoard 裸 JSON 请求协议、`X-Authorization`、空查询参数清理、后端错误提示；仅 401/errorCode=11 刷新，同批并发请求共用刷新结果，最多重放一次，失败后结束等待并重新登录。
- 系统管理员 `/tenants`：服务端分页、搜索、排序、刷新，租户新增/编辑/删除，配置下拉和地区选择，保留编辑前的额外属性。
- 非系统管理员登录后显示尚未迁移页面，不能访问租户列表。租户管理员管理、其他业务模块、注册和找回密码不属于本阶段。

上游示例应用保留在各自目录中；默认 `pnpm dev` 只启动 ThingsBoard，不启用 mock 后端。业务请求与新增依赖仅在本应用适配。

锁文件将 `@iconify/json` 更新至现有 catalog 范围内的 2.2.525，以避开 2.2.520 下载反复失败；未改变上游 catalog 或框架源码。

## 验证记录（2026-09-05）

应用及 Vite 配置类型检查、ESLint、租户页 Stylelint、6 项请求回归、浏览器业务回归和生产构建通过。检查了桌面和 390px 窄屏页面。浏览器回归使用接口契约模拟；本机后端 `/api/auth/user` 可达并返回未认证响应，未使用真实凭据登录或修改后端数据。
