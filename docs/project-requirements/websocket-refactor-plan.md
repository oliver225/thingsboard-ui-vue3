# WebSocket 查看与订阅逻辑整理方案

日期：2026-09-23。状态：已实施；实施结果与验证见第 7 节。

本方案根据当前工作树、本地 `F:/workspace/thingsboard/ui-ngx` 和相关 Java 源码核对后实施。验证使用模拟协议响应，不代表已完成实际部署后端联调。保留了工作树已有改动。

## 1. 目标与边界

- 全项目 `/api/ws` 连接统一由现有 `store/websocket.ts` 管理，继续使用 VueUse `useWebSocket`。
- 组件通过现有 `hooks/use-ws.ts` 订阅；非组件的一次查询通过 store 的 `request`；无回执的写命令通过 `send`。
- 普通对象描述命令，保留后端字段名；编号、鉴权、取消、重连留在内部。
- 精简未使用类、重复类型、重复状态、长位置参数及重复连接实现。保留必要的取消、竞态隔离、错误处理与增量合并。
- 归档维护代码索引与协议规则，历史实现交给 Git，不新增备份源码、兼容包装层或通用订阅框架。
- `ui-ngx` 用于核对业务和协议；本轮不修改 Angular 仓库，不移植 RxJS/Subscriber 类体系。

## 2. 整理前代码清单

以下路径均相对 `apps/web-ui/src/`。

| 文件 | 当前职责及问题 | 计划 |
| --- | --- | --- |
| `types/ws.ts` | 865 行；Angular 命令类、响应类、翻译映射与 Vue 联合类型混合；部分类型只在文件内部互相引用 | 改为纯协议类型；删除无外部引用的运行时代码与多余别名 |
| `store/websocket.ts` | 508 行；共享连接、鉴权、编号、请求、订阅、取消、空闲关闭；大量逐行解释注释 | 保留入口，简化内部结构与注释；收拢连接与会话处理 |
| `hooks/use-ws.ts` | 参数监听、订阅状态、刷新、KeepAlive；`loading` 多处赋值；直接监听原始 token | 保留生命周期，状态单一来源，消除同身份刷新引起的重订阅 |
| `hooks/use-notifications.ts` | 收起订阅数量、展开订阅最近六条、标记已读；token 变化清空通知 | 保留业务封装，清理重复状态与不必要的 token 监听 |
| `utils/notifications.ts` | 通知快照与增量合并、顺序控制，同时包含文本和链接处理 | 保留必要合并；文本和链接功能不随 WS 清理删除 |
| `api/tb/device-connectivity.ts` | HTTP 命令获取之外，还自行创建 WebSocket、鉴权、编号和超时 | HTTP 保留，移除独立连接实现；订阅交给现有 hook |
| `views/tb/device/check-connectivity.vue` | 设备状态和新增遥测；依赖 `subscriptionId === 1` 判断遥测来源 | 分开消费遥测与 active 属性订阅，不再读取协议编号 |
| `api/tb/usage.ts` | 普通用量 HTTP、队列列表、队列历史独立 WS | 队列历史复用 store.request；普通遥测 HTTP 复用已有 telemetry API |
| `views/tb/usage/queue-statistics.vue` | 多组历史查询、时间过滤、取消、定时刷新 | 缩减参数传递，保留时间过滤、过期响应隔离及现有刷新行为 |
| `views/tb/usage/usage-chart.vue`、`metrics.ts`、用量页面 | HTTP 历史数据与图表转换 | 核对共用类型和查询入口，不强制改成 WS |
| `views/tb/telemetry/telemetry.vue` | `TIMESERIES` 订阅，页面内合并更新及删除标记 | 保留直接用法，将确有复用的按键合并放入现有 telemetry/utils.ts |
| `views/tb/telemetry/attributes.vue` | 当前所有 scope 均 HTTP 查询；切换后异步返回缺少上下文隔离 | CLIENT_SCOPE 对齐原版订阅；SERVER_SCOPE、SHARED_SCOPE 保留 HTTP；防止旧请求覆盖新 scope |
| `views/tb/telemetry/utils.ts` | 值展示和类型识别 | 容纳遥测、客户端属性共用的小型合并函数，不建立 reducer 框架 |
| `views/tb/telemetry/value-form.vue`、`telemetry-delete.vue` | HTTP 新增、修改、删除，成功后刷新 | 保留写入方式，联动核对订阅刷新和删除回显 |
| `api/tb/telemetry.ts` | 已有属性、遥测值、历史、聚合和写入 API/类型 | 作为业务数据类型与 HTTP 遥测查询的已有来源 |
| `api/tb/entity-query.ts` | 实体查询、分页、EntityData 等类型 | WS 引用现有类型，不再次复制业务模型 |
| `layouts/notification/index.vue`、`item.vue` | 通知角标、弹层、操作 | 适配精简后的通知 hook；尊重 item.vue 已有未提交改动 |
| `views/tb/notification/inbox/list.vue` | HTTP 分页列表，通过通知 WS 触发 reload | 保留 HTTP 分页及筛选，核对已读、删除和跨页面更新 |
| `api/tb/notification.ts` | 通知 HTTP 查询与删除及模型 | 保留职责，不与 WS 原始响应类型混放 |
| `store/auth.ts`、`api/client.ts`、`api/request.ts` | 登录/切换/退出 reset；HTTP 刷新合并与会话失效处理 | WS 接入同一会话能力，不另造 token 刷新机制 |
| `store/system.ts`、`api/tb/system-info.ts` | 系统参数缓存，含 persistDeviceStateToTelemetry | 设备连通性直接复用，不向各层新增配置参数 |

实体详情页面通过公共页签使用属性与遥测组件：设备、资产、实体视图、租户、客户、用户、租户配置、Edge 等。回归应覆盖这些入口的实体切换和页签销毁，避免在每个详情页面复制 WS 逻辑。

现有辅助验证脚本：`.codex/notification-qa.mjs`、`.codex/device-form-qa/connectivity.mjs`。其中模拟连接/命令编号可能依赖旧实现，实施时先核对再复用；它们不作为生产架构来源。

## 3. ui-ngx 与后端核对结果

参考根目录：`F:/workspace/thingsboard/`。

| 参考文件 | 确认的行为 |
| --- | --- |
| `ui-ngx/src/app/core/ws/websocket.service.ts` | 连接、JWT 有效性与刷新、重连、空闲关闭；重连恢复订阅 |
| `ui-ngx/src/app/core/ws/telemetry-websocket.service.ts` | 同一 api/ws 承载遥测、实体、告警和通知；统一编号与消息分发；各命令取消方式不同 |
| `ui-ngx/src/app/core/ws/notification-websocket.service.ts` | 订阅实际委托 TelemetryWebsocketService，无需在 Vue 另设通知连接 |
| `ui-ngx/src/app/shared/models/websocket/websocket.models.ts` | Angular WsService/WsSubscriber 抽象；Vue 不需要复制这套继承 |
| `ui-ngx/src/app/shared/models/telemetry/telemetry.models.ts` | 命令、响应、属性增量、通知序号与共享订阅；只吸收必要协议和数据语义 |
| `ui-ngx/src/app/modules/home/models/datasource/attribute-datasource.ts` | 最新遥测及客户端属性走订阅；服务端/共享属性走 HTTP；lastUpdateTs=0 的条目不展示 |
| `ui-ngx/src/app/modules/home/pages/device/device-check-connectivity-dialog.component.ts` | 订阅最新遥测；仅 persistDeviceStateToTelemetry 为 false 时额外订阅服务端 active；只展示弹窗打开后的遥测 |
| `ui-ngx/src/app/modules/home/components/notification/notification-bell.component.ts` | 收起监听数量，展开切换通知展示，关闭恢复数量 |
| `application/src/main/java/org/thingsboard/server/controller/plugin/TbWebSocketHandler.java` | authCmd 完成服务端鉴权，无需等待单独成功回执；鉴权失败可能以 BAD_DATA（1007）关闭 |
| `application/src/main/java/org/thingsboard/server/service/security/AccessValidator.java` | 实体校验分支未包含 QUEUE_STATS；队列历史应保留当前 ENTITY_DATA/historyCmd 路径，不能简单替换成普通遥测 HTTP |

这里不要求复制原版的重连时间、空闲时间和所有通用功能；先保持本项目已用行为，再单独验证确需修正的差异。

## 4. 具体精简设计

### 4.1 类型只描述数据

保留普通对象形式的 WsCommand，以及使用中的响应、订阅状态、回调与请求选项。实体、分页、通知、属性和聚合类型从现有模块直接引用。

删除无外部调用的 CmdWrapper、TelemetryPluginCmdsWrapper、各 Cmd/Update 类、isEmpty/prepareData 方法、旧翻译 Map、无调用类型守卫和纯转发别名。协议需要支持的命令分支可继续用 interface/联合类型表示，不能因当前页面未用就误删取消协议。

TimeInput/Omit/模板字面量组合若只是为省略几个默认字段，改为直接可读的字段定义。复用基础类型，但不为少写几行增加多层类型转换。保留所需来源版权说明，修正过时的 composables/use-ws.ts 注释路径。

### 4.2 Store 只管理传输与记录

对外职责固定为：

```ts
subscribe(command, handlers) // 返回取消函数
request(command, options)   // 返回 Promise，支持 signal 和总超时
send(command)               // 仅发送；不代表服务端执行成功
close()                    // reset/退出/销毁时清理
```

- 优先把 entries Set + routes Map 收敛成一个以 cmdId 索引的记录表：注册时编号、重连时更新编号，取消函数引用记录。新连接使用新编号，旧连接回调必须被忽略。实施时以清晰和正确为准，不为一个集合省略必要的生命周期隔离。
- 当前 store 接受“命令对象或工厂”，而业务调用没有使用 store 命令工厂。移除这层双形态；动态参数统一由 hook 的响应式 getter 处理。
- WsHandlers 只保留传输层确需的回调，取消无调用方意义的泛型包装；重连重置语义必须明确，不能靠旧快照继续累加。
- 去掉未被消费的全局 live/loading 数据状态，避免与每条订阅状态混淆；连接开闭使用 VueUse 状态。
- loading 从单条订阅 status 派生，不再在多个回调重复维护。
- send 当前返回的 `{ cmdId, sent: true }` 无调用方消费，改为 void，发送失败抛错。
- request 当前虽无生产调用，但队列历史正需要它。接入队列后精简 Promise 清理，不把它作为死代码直接删掉。
- 统一清理路径，保留一次结算、超时、AbortSignal、断线、取消及同步回调保护。只删除确认重复的分支。
- 删除“结束函数”“保存变量”等逐行复述注释，只说明协议区别、时序原因和不可省略的行为。

### 4.3 Hook 只管理组件订阅

建议将公开调用收敛为一个命令参数，getter 返回 undefined 表示暂不订阅；现有第二个 enabled 参数没有调用方使用，可删除。

```ts
const { data, loading, error, refresh } = useWs(() => ({
  type: 'TIMESERIES',
  entityType: props.entityId.entityType,
  entityId: props.entityId.id,
  scope: 'LATEST_TELEMETRY',
}));

const activeStream = useWs(() =>
  deviceId.value && !system.systemParams?.persistDeviceStateToTelemetry
    ? {
        type: 'ATTRIBUTES',
        entityType: EntityType.DEVICE,
        entityId: deviceId.value,
        scope: 'SERVER_SCOPE',
        keys: 'active',
      }
    : undefined,
);
```

以上为接口示意，实施时需等待系统参数初始化并明确弹窗开关条件。内部保留 watch 清理、KeepAlive 暂停/恢复、refresh 重订阅，页面不传 cmdId、token、重连参数或内部取消标志。

响应类型要能在消费边界区分遥测、实体和通知，不继续把所有字段作为 unknown 再到处强转，也不建立复杂的条件类型推导体系。

### 4.4 队列历史参数从七个位置参数收敛为三组

```ts
getQueueUsageTelemetry(
  entityId,
  { keys, startTs, endTs, limit, agg, interval },
  signal,
);
```

函数内部只构造 ENTITY_DATA/historyCmd、调用共享 request、提取 timeseries。调用方不传 select/cmdId/onData。连接、鉴权、计时器、监听器、JSON 分发不再在 usage.ts 重写。

普通用量 HTTP 对照 telemetry.ts 的 getTimeseries/getTimeseriesHistory 复用：保留现有 ASC、25000、严格类型等业务默认值，不因去包装而静默改变查询结果。只有确有业务意义的队列专用查询函数保留在 usage.ts。

### 4.5 设备连通性按数据来源处理

遥测流与 active 属性流分别订阅，分别接收结果；页面不判断 subscriptionId=1/2。根据已有 systemStore 参数决定是否需要第二条订阅。保留弹窗打开时间筛选、状态更新时间判断、关闭释放与重试反馈。

不再从 api/tb/device-connectivity.ts 返回一套手写连接取消函数；该文件保留后端发布命令 HTTP API。

### 4.6 数据合并放在真正使用的位置

- 遥测及客户端属性共用一个小函数，按 key 合并；处理时间戳 0 的删除、空值、布尔值、JSON 值；首次/刷新/重连重置快照。
- 设备连通性保留弹窗特有筛选，不强行与属性表合并成带多个 mode/flag 的通用处理器。
- 通知保留快照/增量、序号控制、已读移除、数量与条数限制；只精简重复排序和重复处理，不能退化为“收到一条就覆盖全部”。
- 通知标记已读没有成功回执，展示结果继续以服务端推送为准。收件箱仍走 HTTP 分页。

### 4.7 认证和连接错误统一处理

当前存在三点差异：

1. Store 自行解码 JWT 比较身份，而 authStore 的登录/切换/退出已经调用 resetAllStores。
2. Hook 监听整个 accessToken，正常 token 刷新也会取消重订阅；通知 hook 同时清空数据。
3. Store 只读取当前 token，不复用 HTTP 内部的刷新 Promise；后端鉴权失败可返回 1007，而现有不可重试判断只列 1008/4401/4403，存在无效凭证反复重连的风险。

方案：统一认证层提供取得有效 token/刷新合并的最小能力，HTTP 与 WS 共用已有 refresh/session-change/expire 逻辑。登录或身份切换清理全部，正常刷新不重置页面数据；WS 建连/重连使用有效凭证。不能为了复用而构造无关 HTTP 请求。

精简 JWT 身份解析前先验证所有会话切换入口。1007 表示 BAD_DATA，不全部当作 token 过期；协议错误与可恢复网络错误应区分，不按未知 close reason 盲目重复刷新。

本步骤只调整认证复用边界，不扩展到整个登录模块重构。

## 5. 不新增的复杂机制

不新增 Subscriber/Manager/Adapter 继承链、按命令注册的插件系统、通用事件总线、全局业务缓存、命令工厂、每类命令独立 service、通用 reducer、仅转发参数的 hook/API。共享物理连接即可，暂不增加“相同订阅自动去重”的缓存和引用计数机制。

类型校验、首包/请求超时、注销取消、旧响应隔离、异常回调隔离等需要针对真实时序决定精简，不能按行数一刀切。

## 6. 实施顺序与验收

1. 核对引用清理类型和无用类，保留现有入口；同步修正注释。
2. 简化 store/hook，接通最小认证复用边界；先验证连接、取消、重连和请求结算。
3. 将队列历史、设备连通性迁入共享连接，缩减业务参数；验证一个页面多个请求/订阅不会互相关闭连接。
4. 对齐客户端属性订阅，整理遥测/通知合并和页面状态；验证切换 scope/实体、读写刷新。
5. 更新代码索引和使用示例，删除失效包装，不留下并行新旧实现。

验收至少包括：

- 遥测页面、通知、设备检查、队列历史同时使用时，共用一条连接；单个取消不影响其他使用者。
- 持续订阅断网后恢复，重建全量快照；已取消命令不重发；一次查询断线后及时失败，不悬挂。
- 请求成功、超时、主动 abort、鉴权失败均清理记录和远端订阅；空数组、0、false、null 不被当作未返回。
- 组件卸载、KeepAlive 切出、弹窗关闭、实体/作用域切换后不再收到旧上下文更新。
- CLIENT_SCOPE 与最新遥测可实时更新；SERVER_SCOPE/SHARED_SCOPE 的 HTTP 查看及编辑保持可用。
- persistDeviceStateToTelemetry 两种配置下，设备状态和新遥测显示正确，页面不依赖固定编号。
- 通知空列表、全量与增量、乱序、标记已读、关闭再展开、收件箱刷新正确。
- token 正常刷新不清空订阅数据；退出和换用户彻底清理；过期 token 重连能共用刷新并避免重连循环。
- 队列历史切换和取消不互相覆盖，排序、聚合、时间范围、点数保持一致。

实施后执行 `pnpm check:thingsboard`、修改文件的 lint 及 `pnpm build:thingsboard`。对重连、取消、认证和增量合并做有行为意义的模拟验证，并通过浏览器确认连接数与实际帧；已有脚本可复用，不能把旧脚本的固定编号/固定帧假设当作协议要求。

开始实施时工作树已有规则链、通知组件、CopyText 和其他页面改动，仅处理本方案相关差异；未提交或覆盖这些改动。

## 7. 实施结果

- `types/ws.ts` 从 865 行整理为 180 行，保留协议联合类型与真正需要的数据接口，删除 Angular 类体系、未使用的翻译映射及重复别名。响应按 subscriptionId/cmdUpdateType 收窄，消费处不再强转 unknown 数据。
- `store/websocket.ts` 从 508 行整理为 325 行，用一个 Map 管理请求与订阅；删除命令工厂、全局数据状态和无调用方使用的 send 返回值。保留请求结算、取消、错误隔离、首包超时、空闲关闭和断线恢复。
- 应用源码只保留 store 内一个 `useWebSocket` 连接入口，移除设备检查与队列历史中的 `new WebSocket`。
- `useWs(command)` 只接收一个命令/getter，返回 undefined 表示停用，loading 从 status 派生。保留参数变化、刷新、KeepAlive 和销毁清理。
- HTTP 与 WS 共用 `api/client.ts` 的 Token 刷新 Promise；WS 建连取得有效凭证。正常 Token 更新不触发重订阅或清空通知，旧账号刷新结果不能覆盖新账号，BAD_DATA 等拒绝连接不会盲目重连。
- 队列历史使用共享 request，传参为 entityId、historyCmd、signal；普通用量直接调用现有 getTimeseries，排序默认仍为原调用方的 DESC。时间过滤只生成通用时间字段，HTTP 排序由 HTTP 调用点补充。
- 设备检查使用遥测与 active 属性两条明确的数据流，按 systemStore 的 persistDeviceStateToTelemetry 控制额外属性订阅，取消固定编号判断。
- 客户端属性使用 WS；服务端/共享属性仍为 HTTP，并通过 watch 清理隔离过期请求。遥测和客户端属性共用小型 mergeTelemetry，保留 JSON、false、0、null 和删除语义。
- 通知仍使用原有快照/增量合并、数量订阅和已读推送逻辑，收件箱仍使用 HTTP 分页。
- 浏览器验证发现并修复了属性初始化时表格未注册就清空选中项的问题：只有存在选中项才调用表格清理。

### 验证记录

- `pnpm check:thingsboard`：通过。
- 本次涉及源码和测试文件的 ESLint：通过。
- `pnpm exec vitest run --config scripts/tests/vitest.config.mjs`：18 项行为测试通过，包括原有通知测试。
- `pnpm build:thingsboard`：通过；仍有打包体积提示，不属于 WS 编译失败。
- Edge 无头浏览器加载真实 Vue 页面组件、使用模拟 HTTP/WS 响应：验证共享连接、Token 更新、设备状态两种配置、并行队列历史、弹窗释放、卸载重挂、属性增量/删除、HTTP/WS scope 切换、断线重建快照，页面异常为 0。全过程先建立一条连接，模拟断线后再建立第二条，业务并未各自创建连接。
- 上述测试为当时的验证记录；`scripts/tests` 中的自动化测试及专用配置已在后续清理中删除。临时浏览器页面已移除；测试没有向真实后端发送业务写入。

实施后的使用规则继续遵循第 4 节。无需新增 Subscriber、Manager 或服务注册框架。
