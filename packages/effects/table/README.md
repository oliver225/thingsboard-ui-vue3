# @vben/table

位于 `packages/effects/table` 的共享表格包。提供 `BasicTable`、`useTable`、`TableAction` 的表格 API、列设置、密度、选择、编辑和分页行为。

表头分为标题区和查询操作区：`title` / `#tableTitle` 位于上方，标题字号跟随全局字号的 1.375 倍（全局 16px 时为 22px），背景浅色随全局主题色变化；`#query` 位于下方左侧，可以放搜索框、日期或类型选择等任意组件，`#toolbar` 和表格设置位于下方右侧。默认插图尺寸为 112×56px，窄屏下缩小显示。

标题右侧通过 `titleIllustration` 绑定插图地址，`titleIllustrationAlt` 默认留空表示装饰图片。`#titleIllustration` 插槽可以替换图片区域，接收 `{ src, alt }`。这些属性也支持在 `useTable` 和全局 adapter 中配置。未提供标题或插图时，不占用标题行。

```vue
<BasicTable
  title="租户管理"
  :title-illustration="illustrationUrl"
  @register="registerTable"
>
  <template #query>
    <Input v-model:value="searchText" allow-clear />
  </template>
  <template #toolbar>
    <Button type="primary">新建租户</Button>
  </template>
</BasicTable>
```

```ts
import { BasicTable, TableAction, useTable } from '@vben/table';

const [registerTable, { reload }] = useTable({
  api: listData,
  beforeFetch: (params) => params,
  columns: tableColumns,
  actionColumn: {
    title: '操作',
    key: 'actions',
    fixed: 'right',
    actions: (record) => [
      {
        icon: 'i-ant-design:edit-outlined',
        title: '编辑',
        onClick: () => edit(record),
      },
    ],
    dropDownActions: (record) => [
      {
        label: '删除',
        popConfirm: { title: '确认删除？', confirm: () => remove(record) },
      },
    ],
  },
  showTableSetting: true,
  canResize: true,
});
```

模板使用 `<BasicTable @register="registerTable">`，业务单元格插槽接收 `{ record, text, index, column }`。避免将业务单元格命名为 Ant 保留的 `title` 插槽。

`actionColumn.actions(record)` 与 `actionColumn.dropDownActions(record)` 会自动渲染操作按钮和更多菜单，不需要指定 `slot`。自定义操作插槽时，也可以直接使用 `<TableAction :actions="actions(record)" :drop-down-actions="dropDownActions(record)" />`。操作项支持 `title`、`label`、`icon`、`color`、`disabled`、`ifShow`、`auth`、`onClick` 和 `popConfirm`。

列、操作列和操作项的 `auth` 都支持权限码或角色：`auth: Authority.SYS_ADMIN`，或 `auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]`（任意匹配）。应用已将登录用户的 `authority` 映射到 Vben 的用户角色。`PRE_VERIFICATION_TOKEN`、`REFRESH_TOKEN` 是令牌用途，不是页面业务角色。

操作项配置 `popConfirm` 后，会调用 Vben Alert 的 `confirm`，使用默认底部确认、取消按钮，普通操作和 `dropDownActions` 行为一致。`title` 为确认内容，可用 `description` 补充说明，`okText`、`cancelText` 设置按钮文字。点击确认才执行 `confirm`；省略 `confirm` 时执行操作项的 `onClick`。通过 `beforeClose` 等待异步提交并阻止重复执行，失败时保留弹窗，在 `footer` 显示错误以便重试。`placement` 保留类型兼容，弹窗始终居中。

操作项的 `color` 与 Vben Alert 状态一致：`error`、`info`、`question`、`success`、`warning`，同时控制操作按钮颜色、确认弹窗的内置图标及确认按钮颜色。删除使用 `color: 'error'`；`question` 和未指定状态使用主题色。旧的 `danger`（对应 `error`）、`primary`（对应 `question`）及 `danger: true` 仍兼容。`popConfirm.icon` 可覆盖内置图标。确认正文使用全局字体，默认 16px。

操作按钮图标默认 20px（随全局字号变化，可用 `iconSize` 覆盖）。悬停和键盘聚焦提示依次使用 `tooltip`、`title`、`label`。

填满 Vben `Page` 内容区时，使用 `<Page auto-content-height>`、`<BasicTable class="h-full" ...>`。应用已全局启用 `canResize: true`，`isCanResizeParent` 内置和全局默认均为 `true`，页面无需重复配置。表格会测量卡片内的可用高度，表头和分页保留，数据区域内部滚动。

列设置默认允许自由开关「复选框」，通过 `defaultRowSelection: { type: 'checkbox' }` 提供默认选择配置；初始仍隐藏选择列。配置 `rowSelection` 可默认显示，配置 `defaultRowSelection: null` 且不配置 `rowSelection` 可禁用此功能。关闭选择列会清空已选行。`useTable` 返回的 `selection` 是包含 `{ keys, rows, count }` 的计算属性，无需再通过 `selection-change` 维护一份页面状态；原事件仍保留。刷新后即使没有数据也会通知选择清空。

## 批量操作

直接在 `useTable` 配置 `batch`，表格会在页面工具栏前显示已选数量、清空、扩展操作和批量删除按钮。无需在每个页面编写这些按钮及删除确认逻辑。

```ts
const [registerTable, { reload, selection }] = useTable<DeviceInfo>({
  api: fetchList,
  columns: tableColumns,
  rowKey: (record) => record.id.id,
  rowSelection: null,
  batch: {
    entityName: () => $t('device.menu'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteDevices,
    actions: [
      {
        key: 'assign',
        label: () => $t('device.actions.batchAssign'),
        icon: 'lucide:user-plus',
        onClick: ({ keys }) => openAssignModal(keys),
      },
    ],
  },
});
```

`deleteApi` 是确认后调用的删除接口，接收选中主键组成的字符串数组，返回 `{ failedIds: string[] }`。接口可以同时返回其他字段。删除完成会刷新列表，部分失败会保留失败项并在确认框显示错误，再次确认只提交失败项；取消不会调用接口。确认框打开期间锁定选择和批量操作，异步扩展操作也会等待返回的 Promise，防止重复点击。

`enabled` 控制整组批量操作的权限，`canSelect` 保留默认配置、根规则链等业务禁选条件，并与原 `rowSelection.getCheckboxProps` 的禁用条件共同生效。未配置 `deleteApi` 时不显示删除按钮。`actions` 接收本次选择的快照，页面保留分配等业务弹窗逻辑。选择列仍由原有 `rowSelection` 和列设置控制。

通过 `setupVbenTable({ batchMessages })` 统一设置应用文案，ThingsBoard 已映射到 `tb.common.messages.batchDelete`。公共选择栏样式位于 `TableSelectionBar.vue`，删除流程位于 `hooks/useTableBatch.ts`，由现有 `useTable` 内部调用。

## 全局配置与页面覆盖

应用在 `apps/web-ui/src/adapter/table.ts` 调用 `setupVbenTable`，并在启动时加载该适配器。页面从 `#/adapter/table` 导入表格 API。全局 `beforeFetch` 默认将页码、排序和搜索参数转换为 ThingsBoard 接口格式；页面可自行指定 `beforeFetch` 覆盖它。

```ts
// apps/web-ui/src/adapter/table.ts
import { setupVbenTable } from '@vben/table';

setupVbenTable({
  size: 'middle',
  align: 'center',
  fetchSetting: {
    pageField: 'pageNo',
    sizeField: 'pageSize',
    listField: 'data',
    totalField: 'totalElements',
  },
  pagination: { pageSize: 20, pageSizeOptions: ['10', '20', '50', '100'] },
});

// 页面只需指定差异
const [registerTable, { reload }] = useTable({
  api: listData,
  columns: tableColumns,
  fetchSetting: { listField: 'rows' },
  pagination: { pageSize: 50 },
});
```

优先级为：组件内置默认值 < 应用全局配置 < `BasicTable` 属性 < `useTable` / `setProps` 配置。对象逐层合并，数组整体替换，`undefined` 继承，`false` 或 `null` 显式覆盖。例如 `pagination: false` 可关闭分页，局部 `pageSize` 不会丢失全局 `pageSizeOptions`。

原常量对应配置：`ROW_KEY` → `autoRowKey`（自动生成的键字段，业务行键仍使用 `rowKey`）；`PAGE_SIZE` / `PAGE_SIZE_OPTIONS` → `pagination.pageSize` / `pagination.pageSizeOptions`；`FETCH_SETTING` → `fetchSetting`；`DEFAULT_SIZE` / `DEFAULT_ALIGN` → `size` / `align`；索引、拖拽、操作列标记 → `columnFlags.index` / `drag` / `action`；默认排序、筛选转换函数 → `sortFn` / `filterFn`。列自身的 `align` 优先于默认对齐。按需求始终不渲染搜索表单。

## 依赖复用

| 能力 | 实现 |
| --- | --- |
| 图标 | `@vben/icons`，包内仅转换图标的 `i-` 前缀和尺寸参数 |
| 提示、滚动容器 | Vben 的 `VbenHelpTooltip`、`VbenScrollbar` |
| 列拖拽 | `@vben/hooks` 的 `useSortable` |
| 权限 | `@vben/access` 的权限码和角色检查 |
| 国际化 | `@vben/locales`，仅新增 `table.json` 表格文案 |
| 克隆、取值、比较、日期、树遍历 | `@vben/utils` |
| 监听、延时、尺寸与滚动 | `@vueuse/core` |
| 操作确认弹窗、确认和取消按钮 | Vben Alert 的 `confirm` 与默认 Footer |
| 表格、操作按钮、菜单、单元格编辑控件 | 项目已有的 `antdv-next` |

没有引入独立的 Form、Basic、Button、Popover、Page、Modal、Store、Locales 或通用工具目录。表格操作按钮和操作菜单是包内实现，用于保留操作项配置及样式。没有新增 `lodash-es` 或 `vue-types` 依赖，也不依赖业务应用中的代码。

## 全局外观

系统默认字号为 16px，表格内容默认使用全局字号减 2px（即 14px），并跟随全局字号变化。在 `apps/web-ui/src/adapter/table.ts` 的 `setupVbenTable({ fontSize: 15 })` 中可以固定表格字号；页面的 `useTable({ fontSize: 14 })` 优先级更高。省略 `fontSize` 时保持自动跟随。卡片标题和工具栏沿用全局字号。

组件使用 Vben 的 `--font-family`、`--font-size-base`、`--radius` 和主题颜色变量；Ant 控件使用应用的全局 ConfigProvider。ThingsBoard 的全局字体与 Ant 令牌适配位于 `apps/web-ui/src/adapter/design-tokens.ts`。密度支持“中等 / 紧凑”。

## 范围与扩展

按需求不渲染搜索表单。`formConfig` 和 `getForm()` 保留字段、模型与 schema 状态兼容，未包含表单渲染、校验或字段滚动。字典通过 `configureTableDictionaries` 提供业务数据；业务选择器、上传器可通过 `addTableEditor` 注册。默认编辑器直接使用 Ant 控件。
