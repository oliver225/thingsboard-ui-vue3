# 参考代码与使用方式

返回[整体需求](README.md)。以下仓库内路径以 `F:\workspace\thingsboard-ui-gitee` 为根；链接指向当前工作树。它们是可读的真实源码入口，不表示每个文件已经完全符合全部规范。

## 1. 不同来源分别参考什么

| 来源 | 用途 | 边界 |
| --- | --- | --- |
| 当前 `vben1` 的 tenant 页面 | 普通 CRUD 写法、表单、表格、数据流、动作、多语言 | 当前 tenant 弹窗为 3xl，与历史统一矩阵不同，不能不加判断照搬尺寸 |
| 当前 device 详情与 detail-page | 实体页头、状态/标签、操作、页签、布局 | 不把设备权限复制给系统管理员管理的实体 |
| 本仓库 `vben` 分支 | 较早业务、个人中心等功能参考 | 组件/接口可能不同，不能照搬旧 VXE 或 import |
| 本仓库 `master` 分支 | 规则链编辑器、导入、旧 WS 业务逻辑 | 规则链最后明确要求恢复其外观；其他页面不能回退旧设计 |
| `F:\workspace\thingsboard\ui-ngx` | 原版表单、权限、协议、参数、默认值、文案与交互 | 是 Angular 参考，不直接移植组件框架 |
| `F:\workspace\thingsboard` Java | Controller、请求实体、节点配置、协议处理 | 对照实际部署版本，不以旧前端模型替代后端契约 |
| 本地 `docs` | Vben 表单/组件用法 | 保留文档，先查现有 API 再封装 |

历史外部参考：Vben 上游 `vbenjs/vue-vben-admin`；JeeSite `thinkgem/jeesite-vue` 的 `packages/core/components/Table`。本次记录的是对话中的参考出处，没有在线核验上游最新状态，也没有进行依赖升级。用户曾明确说明已取得 JeeSite 使用授权，本次未审核授权文本。

## 2. 项目内直接入口

| 内容 | 代码 |
| --- | --- |
| 普通列表模板 | [tenant/list.vue](../../apps/web-ui/src/views/tb/tenant/list.vue) |
| 普通表单模板 | [tenant/form.vue](../../apps/web-ui/src/views/tb/tenant/form.vue) |
| 设备分步表单 | [device/form.vue](../../apps/web-ui/src/views/tb/device/form.vue) |
| 固定 Steps 的配置表单 | [device-profile/form.vue](../../apps/web-ui/src/views/tb/device-profile/form.vue) |
| 设备详情 | [device/detail.vue](../../apps/web-ui/src/views/tb/device/detail.vue) |
| 公共详情壳 | [detail-page/index.vue](../../apps/web-ui/src/components/detail-page/index.vue) |
| 详情类型/页签 | [types.ts](../../apps/web-ui/src/components/detail-page/types.ts)、[tabs.ts](../../apps/web-ui/src/components/detail-page/tabs.ts) |
| 详情卡片 | [card/index.vue](../../apps/web-ui/src/components/card/index.vue) |
| 计算字段入口 | [calculated-field/form.vue](../../apps/web-ui/src/views/tb/calculated-field/form.vue) |
| 告警规则入口 | [alarm-rule/form.vue](../../apps/web-ui/src/views/tb/alarm-rule/form.vue) |
| 属性与遥测 | [attributes.vue](../../apps/web-ui/src/views/tb/telemetry/attributes.vue)、[telemetry.vue](../../apps/web-ui/src/views/tb/telemetry/telemetry.vue) |
| 关系 | [relation/form.vue](../../apps/web-ui/src/views/tb/relation/form.vue)、[relation/list.vue](../../apps/web-ui/src/views/tb/relation/list.vue) |
| 内嵌事件 | [event/list.vue](../../apps/web-ui/src/views/tb/event/list.vue) |
| 设置页风格 | [settings/security/index.vue](../../apps/web-ui/src/views/tb/settings/security/index.vue)、[settings/security/jwt.vue](../../apps/web-ui/src/views/tb/settings/security/jwt.vue) |
| 个人中心 | [profile/index.vue](../../apps/web-ui/src/views/_core/profile/index.vue) |
| 个人中心路由 | [account.ts](../../apps/web-ui/src/router/routes/modules/account.ts) |
| 个人中心 API 密钥入口与标题 | [api-key-setting.vue](../../apps/web-ui/src/views/_core/profile/api-key-setting.vue) |
| 安全配置与修改密码 | [security-setting.vue](../../apps/web-ui/src/views/_core/profile/security-setting.vue)、[password-setting.vue](../../apps/web-ui/src/views/_core/profile/password-setting.vue) |
| API 密钥复用列表 | [api-key/list.vue](../../apps/web-ui/src/views/tb/api-key/list.vue) |
| API 密钥表单与一次性密钥展示 | [form.vue](../../apps/web-ui/src/views/tb/api-key/form.vue)、[token-content.vue](../../apps/web-ui/src/views/tb/api-key/token-content.vue) |

## 3. Adapter 与公共控件

| 能力 | 入口 |
| --- | --- |
| useTable 与 ThingsBoard 默认分页/查询/批量文案 | [adapter/table.ts](../../apps/web-ui/src/adapter/table.ts) |
| useVbenForm 默认配置与导出 | [adapter/form.ts](../../apps/web-ui/src/adapter/form.ts) |
| 表单组件注册、默认 props | [adapter/component/index.ts](../../apps/web-ui/src/adapter/component/index.ts) |
| 分区 | [form-section/index.vue](../../apps/web-ui/src/components/form-section/index.vue) |
| 带说明的开关与复选框 | [tb-switch.vue](../../apps/web-ui/src/adapter/component/tb-switch.vue)、[tb-checkbox.vue](../../apps/web-ui/src/adapter/component/tb-checkbox.vue) |
| 秒值时长输入 | [seconds-input.vue](../../apps/web-ui/src/adapter/component/seconds-input.vue) |
| 限流输入 | [rate-limit-input.vue](../../apps/web-ui/src/views/tb/tenant-profile/rate-limit-input.vue) |
| 图片选择 | [image-input/index.vue](../../apps/web-ui/src/adapter/component/image-input/index.vue) |
| 图片上传与缩略图 | [image-file-input.vue](../../apps/web-ui/src/adapter/component/image-file-input.vue)、[image-preview.vue](../../apps/web-ui/src/adapter/component/image-preview.vue) |
| 参数表与编辑 | [field-arguments/index.vue](../../apps/web-ui/src/adapter/component/field-arguments/index.vue)、[form.vue](../../apps/web-ui/src/adapter/component/field-arguments/form.vue) |
| 代码编辑器 | [code-editor/index.ts](../../apps/web-ui/src/adapter/component/code-editor/index.ts)、[code-editor.vue](../../apps/web-ui/src/adapter/component/code-editor/code-editor.vue) |
| 脚本编辑器 | [script-editor.vue](../../apps/web-ui/src/adapter/component/code-editor/script-editor.vue) |
| 通用脚本测试 | [script-test/index.vue](../../apps/web-ui/src/adapter/component/script-test/index.vue) |
| 调试配置 | [debug-settings-button.vue](../../apps/web-ui/src/components/widget/debug-settings-button.vue) |
| 时间筛选 | [time-filter/index.vue](../../apps/web-ui/src/components/widget/time-filter/index.vue)、[model.ts](../../apps/web-ui/src/components/widget/time-filter/model.ts) |
| Table 通用实现 | [packages/effects/table](../../packages/effects/table) |

目录职责：adapter/component 存放表单控件及其适配；components/detail-page/card/widget 存放已确认的页面或业务共用能力。并非所有“复用”都必须移动到 adapter，后续明确的移动要求优先。

## 4. 接口、实时、配置和翻译

| 内容 | 入口 |
| --- | --- |
| Entity Query | [entity-query.ts](../../apps/web-ui/src/api/tb/entity-query.ts) |
| 事件接口 | [event.ts](../../apps/web-ui/src/api/tb/event.ts) |
| 属性/遥测接口 | [telemetry.ts](../../apps/web-ui/src/api/tb/telemetry.ts) |
| 关系接口 | [relation.ts](../../apps/web-ui/src/api/tb/relation.ts) |
| 系统参数接口与缓存 | [system-info.ts](../../apps/web-ui/src/api/tb/system-info.ts)、[store/system.ts](../../apps/web-ui/src/store/system.ts) |
| 身份认证状态 | [store/auth.ts](../../apps/web-ui/src/store/auth.ts) |
| WS 协议类型 | [types/ws.ts](../../apps/web-ui/src/types/ws.ts) |
| WS 连接与订阅 | [store/websocket.ts](../../apps/web-ui/src/store/websocket.ts) |
| 组件订阅入口 | [hooks/use-ws.ts](../../apps/web-ui/src/hooks/use-ws.ts) |
| 通知订阅与增量合并 | [hooks/use-notifications.ts](../../apps/web-ui/src/hooks/use-notifications.ts)、[utils/notifications.ts](../../apps/web-ui/src/utils/notifications.ts) |
| 队列历史 WS 查询 | [api/tb/usage.ts](../../apps/web-ui/src/api/tb/usage.ts) |
| WS 整理记录与使用示例 | [websocket-refactor-plan.md](websocket-refactor-plan.md) |
| Modal 全局默认 | [bootstrap.ts](../../apps/web-ui/src/bootstrap.ts) |
| 应用偏好 | [preferences.ts](../../apps/web-ui/src/preferences.ts) |
| 第三方组件主题桥接 | [design-tokens.ts](../../apps/web-ui/src/adapter/design-tokens.ts) |
| 应用样式入口与说明 | [styles/index.css](../../apps/web-ui/src/styles/index.css)、[styles/README.md](../../apps/web-ui/src/styles/README.md) |
| 多语言约定 | [locales/README.md](../../apps/web-ui/src/locales/README.md) |
| 中文公共文案 | [zh-CN/tb.json](../../apps/web-ui/src/locales/langs/zh-CN/tb.json) |
| 英文公共文案 | [en-US/tb.json](../../apps/web-ui/src/locales/langs/en-US/tb.json) |
| 提交检查 | [lefthook.yml](../../lefthook.yml)、[.commitlintrc.js](../../.commitlintrc.js) |
| 格式与脚本 | [.editorconfig](../../.editorconfig)、[package.json](../../package.json)、[apps/web-ui/package.json](../../apps/web-ui/package.json) |

## 5. 可复用写法示意

以下为根据当前源码整理的最小模式，不是新公共 API，也不是可直接运行的完整页面。具体类型、字段、API 和角色按模块补齐。

### 列表查询

```ts
const searchInfo = reactive({ searchText: '' });

const [registerTable, { reload }] = useTable<TenantInfo>({
  api: getTenantInfos,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id.id,
  batch: {
    entityName: () => $t('tenant.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteTenants,
  },
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}
```

不用再在 tenant 页面手写 `pageNo - 1`、`data/totalElements` 映射；这些已集中到 adapter。

### 操作列

```ts
const actionColumn: ActionColumn<TenantInfo> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    actions: [
      {
        key: 'edit',
        icon: 'lucide:square-pen',
        class: 'text-primary hover:text-primary',
        text: $t('tenant.actions.edit'),
        tooltip: $t('tenant.actions.edit'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleEdit(record),
      },
    ],
  }),
};
```

宽度按当前按钮数量确定，不复制示例数字作为全站固定值。

### 删除确认

```ts
await confirm({
  title: $t('tenant.actions.delete'),
  content: $t('tb.common.messages.delete.title', {
    entity: $t('tenant.menu'),
    name: record.title,
  }),
  icon: 'error',
  confirmButtonProps: { variant: 'destructive' },
  confirmText: $t('tb.common.delete'),
  async beforeClose({ isConfirm }) {
    if (!isConfirm) return true;
    try {
      await deleteTenant(record.id.id);
      message.success($t('tb.common.messages.delete.success'));
      await reload();
      return true;
    } catch {
      return false;
    }
  },
});
```

### 表单提交

```ts
async function save() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const formValues = await formApi.getValues();

  modalApi.lock();
  try {
    await saveTenant({
      ...record.value,
      title: formValues.title.trim(),
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: formValues.description,
      },
      // 实际页面补齐本模块全部可编辑字段。
    });
    modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
```

实际 tenant 使用 `useVbenModal` 的 `onConfirm` 内直接编写此流程；这里单独命名仅为展示，不能据此新增无用包装。

### 实体选项查询

```ts
const result = await findEntityDataByQuery({
  entityFilter: { type: 'entityType', entityType },
  pageLink,
  entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
});

return result.data.map((entity) => ({
  value: entity.entityId.id,
  label: entity.latest.ENTITY_FIELD?.name?.value || entity.entityId.id,
}));
```

此转换可直接在需要它的表单选项加载方法中，用户明确否定过只为包这段代码而设置 `getRelationEntityOptions` 中转函数。（S69）

## 6. 读取旧分支与后端的建议方式

不切换或覆盖当前工作树即可查旧分支：

```powershell
git ls-tree -r --name-only vben
git show vben:apps/web-ui/src/views/_core/profile/index.vue
git ls-tree -r --name-only master
```

先从树中确认实际路径，再查看规则链/WS/导入源码，不猜旧分支的目录位置。

后端参考可按功能定位：

```powershell
rg --files F:/workspace/thingsboard/ui-ngx/src/app | rg 'calculated-field|alarm-rule|rule-chain'
rg --files F:/workspace/thingsboard | rg 'EntityQueryController|TelemetryController|EventController'
```

这些命令只是参考检索方式。本次未更新、构建或运行后端，未从外网获取新版本。
