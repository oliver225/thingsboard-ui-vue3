# 开发与编写规范

返回[整体需求](README.md)。本文件把反复确认的要求整理为可执行约定；来源编号见[对话索引](conversation-index.md)。标为“当前代码”的事项表示实现现状，不冒充用户原话。

## 1. 参考优先级与改动范围

1. 当前任务中用户明确的新要求。
2. 历史同一事项最后一次明确修正。
3. 业务语义：ThingsBoard 当前对应版本的 ui-ngx、Java Controller、模型与服务实现。
4. 普通 CRUD 代码组织：当前 `tenant/form.vue`、`tenant/list.vue`；详情结构：设备详情与公共 detail-page。
5. 当前 adapter、公共组件、locale 和样式入口。
6. 旧 `vben`、`master` 分支只提供业务或专项参考，不能整页照搬旧组件 API。

总体保持上游可升级；应用业务和 ThingsBoard 适配放 `apps/web-ui`。通用 Table 是明确的 packages/effects 扩展。修改框架组件时先核对任务范围及已有撤回记录，尤其不要因某个表单效果修改公共 Select、Modal、DialogContent。（S19、S20、S33、S65）

当前 Vue/Vben/antdv-next 已有的能力先检查再实现。不要假定 `@vben/common-ui` 导出了所有 VbenInput 等表单组件，使用实际 adapter 注册入口。

## 2. 文件组织与抽象尺度

- 简单页面保持一个 `list.vue` 或 `form.vue`；只有配置/转换确实复杂时才拆 `form-schema.ts`、`form-data.ts`。
- 表单辅助文件优先叫 `form-data`、`form-schema`；不要无理由新增 `model.ts`、`helpers.ts`、`options.ts` 或重复的 types 文件。这是表单组织偏好，不意味着所有领域模型文件禁用。
- 计算字段：外层通用配置和入口；`configurations` 各类型管理自己的配置、数据和必要子组件；统一交主表单提交。
- 真正跨场景复用的控件可以抽出，例如 FormSection、FieldArguments、SecondsInput、DetailPage、TimeFilter、CodeEditor。
- 不为一行表达式建立包装函数；不要 `getLabel(key)`、`getOptions(values)`、`createInputField` 等让表单难读的工厂。
- 不新增 `useTbTable` 再包一层 `useTable`；通用批量能力直接维护 useTable，页面搜索和工具栏直接写在列表内。
- 不再创建 `EditorDialog`、`editor-modal`、只包一层 FieldArguments 的 ArgumentsEditor，以及专门转发参数的组件。
- 独立业务动作可以在各页面直接写，不为两个相似用户详情强行抽组件；通用布局也须符合用户明确的复用边界。
- 引用应用公共路径优先 `#/...`；同目录表单可以使用 `./form.vue`，不把一条动态组件绝对别名要求扩大为禁止所有相对引用。

来源：S02、S32、S33、S43、S47、S58、S63、S65、S69、S70、S75。

## 3. 命名、数据与事件

| 内容 | 约定 |
| --- | --- |
| 页面事件处理 | `handleCreate`、`handleEdit`、`handleDelete`、`handleSearch`；同类职责保持一致 |
| 组件事件/回调 | `onXxx`、`success` 等公共 API 按既有契约；不要为同义事件不断变换叫法 |
| 默认值 | `createDefaultXxx` |
| 实体转表单 | `toXxxFormValues` |
| 页面选项加载 | `loadXxxOptions` |
| API 查询 | `getXxx`；领域接口按后端语义命名 |
| 请求载荷转换 | 复杂或复用转换使用 `toXxxPayload` |
| 布尔验证 | `isXxxValid` |
| 返回错误的验证 | `validateXxx`，返回结构固定 |
| 原始记录/入口 | `record`；真正需要第二份原始快照才用 `originalRecord` |
| 编辑值 | `formValues`；双向绑定可用 `model`，未确认副本用 `draft` |
| 表格数据源 | `datasource`；保持所在现有 API 的 `dataSource` 属性不变，不破坏公共接口 |
| 查询状态 | `const searchInfo = reactive({ searchText: '' })`，其他筛选也放这里 |
| DOM/组件引用 | `xxxRef` |
| 参数值 | `argumentValues`，避免 `arguments_` |

用户最终要求统一 `handleXxx` 处理函数；当前 tenant 保存回调为 `handleSaved`，不能把“回调命名”误解为强制重命名 Vben 的 `onConfirm`、`onOpenChange`。（S64/23，当前 tenant）

状态管理：

- 原记录保存在 `record`，实时编辑值从 useVbenForm 获取，不再同步一份 formData。
- 是否编辑直接看 `record` 的实体 ID，避免额外 `isCreate/isEdit`。
- 普通弹窗使用 `modalApi.lock()/unlock()` 和 `modalState.submitting`，不要重复 `isReady/isSubmitting/savingDebug`。
- 必须单独表达的异步状态才创建业务变量；布尔变量命名 `isLoading/isSaving/isReady`，公共 API 自有名字不改。
- 个人中心采用 2026-09-19 当前会话的后续要求：每个设置页统一用一个 `loading`，不再额外维护 `saving`、`ready`、`policyReady` 或 `loadFailed`；根据实际返回的数据判断可编辑、可提交及重试状态。
- 不为简单页面叠加 pending、loadFailed、loadVersion、contextValid、快照等重复状态；确有并发或订阅清理问题时保留必要机制并解释。
- 子组件 props 接收数据，修改通过 emit 回传；未保存草稿与已确认值区分。
- 权限直接使用 `hasAccessByRoles([Authority.TENANT_ADMIN])` 等，避免仅包一层的 isTenantAdmin/canDeleteRow；Table Action 的 `auth` 使用现有注入机制。

## 4. 列表页面标准

### 页面结构

参考 tenant/list.vue：类型和依赖 → 权限/路由 → searchInfo → 表单弹窗 → tableColumns → actionColumn → useTable → watch → 查询/新增/编辑/删除/其他动作/保存回调 → template。

- 主页面使用 `Page auto-content-height`，BasicTable 占满可用高度。
- 标题图标来自路由 meta，图标与标题同色；标题区域、query/toolbar/tableSetting 的行关系统一。
- 搜索框直接绑定 `searchInfo.searchText`；查询参数集中管理，不另有 searchText ref/filterInfo。
- 普通文本搜索变化直接重载，不无故防抖；筛选后回到第一页。
- 内嵌实体列表不显示重复大标题。
- 列表新增按钮最终用 antdv-next `Button type="primary"`；图标操作优先 VbenIconButton/VbenTooltip。
- 较早固定 `w-72` 的搜索框规范已随当前 tenant 响应式布局变化，不照抄旧 VXE toolbar 模板。

### 列与操作

- 每个 `tableColumns` 条目都有稳定 `key`；支持排序的列明确配置，时间列复用日期格式化。
- 列定义通常 computed，语言切换时表头可更新。
- 是否、默认等布尔列统一用禁用的 TbCheckbox；在线离线等业务状态仍按专属状态标签展示。
- 条件显示用列 `ifShow/auth`，不要额外循环过滤列构造重复逻辑。
- `actionColumn` 含宽度、对齐和 `actionProps`；默认固定右侧，宽度按实际按钮数设置。
- 编辑图标 `lucide:square-pen`，主题色；删除危险色；tooltip/text 明确“编辑某实体”“删除某实体”。
- 默认 `variant: 'ghost'`、`size: 'icon'` 不在每个动作重复写。
- 不为了所有操作都补 `disabled: !record.id?.id`；但业务禁止条件如默认配置不能删除必须保留。
- 批量能力通过 useTable 的 `batch` 配置复用；支持失败提示和按现有契约重试。不要将不相关批量动作包装成新的页面体系。
- 列设置中的选择列显示与取消应可操作；历史要求默认隐藏选择列、按列设置开启，实际用法检查当前公共 Table。

### 数据契约

- 默认分页适配只在 adapter 配置，UI 页码转 ThingsBoard 0-based，映射 `data/totalElements`。
- 服务端列表的搜索、排序、过滤走接口，不在当前一页数据上过滤后冒充全量结果；不要每页重复写 slice 和 totalPages。
- 属性无分页、已完整加载的属性集本地过滤是明确例外。
- 请求失败、空结果、删除最后一条后的页码应有正确行为；不能残留旧数据造成误读。
- 表格必须处理空数据、宽列、列固定、横竖滚动；不让页面外层出现多余滚动条或表头错位。

来源：S20、S24、S39、S58、S65–S69。

## 5. 表单和弹窗标准

### 普通表单

- 优先 `useVbenForm`，竖向布局；简单表单直接展示，不为“设计感”加多余分区标题。
- 一般两列，长地址/描述等按业务占整行；窄屏一列。
- 按 tenant 使用 `commonConfig` 和 wrapperClass；已经全局配置的宽度不要再写内联 `width: 100%`。
- 表单弹窗打开：清理 record、reset、确定标题、读取记录、setValues；提交：validate、getValues、转换载荷、lock、保存、提示、关闭、emit success，finally unlock。
- 修改保留未编辑的 additionalInfo 与实体字段，不因重建载荷丢数据。
- `.trim()` 如果是最终保存要求，必须作用到提交值，不能假定验证后 getValues 已被转换。
- 电话可空、null 兼容，规则与提示一致；按当前项目依赖使用有效的校验 API，不继续复制已废弃写法。
- 关联条件变化时清空失效字段：例如收件人筛选对象、OAuth2 客户端、不同实体的参数来源。
- 详情中新建关联对象时先带上当前实体，不能出现没有绑定实体而后续表单不可填写。

### 分步与分区

- 分步使用 antdv-next Steps；所有已确认分步表单按设备配置模式：步骤条固定、表单内容滚动、footer 保持系统默认。
- FormSection 默认不折叠；按需要开启。支持 title、description、help、size、actions 插槽及 actionsPosition；actions 与折叠按钮垂直居中。
- 不把基本信息机械地包 FormSection；队列基本信息、普通租户、应用包第一步等有明确例外。
- 复杂配置可以 FormSection 嵌套，但不无限套框，不补没有业务价值的图标和说明。
- 复用现有 Modal，不抽一个 EditorDialog 再包装。通用默认项在 bootstrap 的 setDefaultModalProps 管理。

### 已明确的弹窗尺寸矩阵

以下以 S64/5–8 最后集中指定为要求；`tenant/form.vue` 当前 3xl 的差异已在总文档记录。

| 规格 | 模块 |
| --- | --- |
| `w-[calc(100%_-_2rem)] max-w-4xl rounded-xl`，固定最大高度 | 租户配置、设备、资产、实体视图、设备配置、资产配置、计算字段、告警规则、OTA、发送通知、通知模板、通知规则、应用包、移动应用、OAuth2 客户端、队列 |
| `w-[calc(100%_-_2rem)] max-w-2xl rounded-xl`，自动高度 | 租户、客户、租户管理员、客户用户、OAuth2 域名、收件人、部件包、图片、SCADA、JavaScript 库、资源库、仪表板、规则链、Edge 实例、Edge 规则链、AI 模型 |

- 普通 Modal 内容 `content-class="px-6 pt-5 pb-1"`；分步内容需要自身 flex/滚动布局时参考现成分步表单，不能只替换 class 导致步骤条滚走。
- 居中、关闭全屏按钮、不点击遮罩关闭等放全局默认，不各表单重复配置。
- 标题用路由图标＋modalState.title；使用一致固定的动作标题，实体信息放正文。
- 现成 alert/confirm 的标题、关闭按钮、footer 保留系统样式，不手工重做默认按钮。

### 删除及危险操作

- 调用系统 `confirm`；用户点击确认后的删除逻辑写入 `beforeClose`。
- 成功提示、刷新并允许关闭；失败返回 false 保留弹窗。不要只是关闭后再发请求。
- 公共文案来自 `tb.common.messages.delete/batchDelete`，实体名直接取功能 `menu`。
- 单条确认统一为“确定要删除{entity}‘{name}’吗？此操作不可恢复。”，按实际 locale 标点呈现。
- 不再重复为每个模块造删除实体名称字典和不同版本的通用文案。

来源：S32–S35、S39、S43、S58、S63–S65、S68、S74。

## 6. 组件选型和样式

| 场景 | 优先方案 |
| --- | --- |
| 普通输入 | VbenInput/已注册 Vben 组件 |
| 简单单选 | VbenSelect；保证语义等价再替换 |
| 多选、复杂搜索、特定下拉能力 | antdv-next Select，样式由应用适配 |
| 远程选项 | ApiSelect，必要转换在页面内写清楚 |
| 数字/日期/时间范围 | antdv-next InputNumber、DatePicker/RangePicker，应用统一样式 |
| 文件上传 | antdv-next Upload/UploadDragger，adapter 注册；不重新写 file-input 壳 |
| 主页面功能切换 | VbenSegmented；在已经明确的特定表单里允许圆角 antdv-next Segmented |
| 带说明的开关/复选框 | TbSwitch/TbCheckbox，整个可交互区域响应点击；复选框位于前侧 |
| 图片选择/图片库 | adapter 中 ImageInput，图片库选择内聚于组件 |
| 时长输入 | SecondsInput：整数＋秒/分/时/天；输入输出都以秒为契约 |
| 参数表 | FieldArguments，通过 props/emit 复用 |
| 表单区块 | FormSection |
| 详情展示块 | components/card |
| 调试参数 | components/widget/debug-settings-button.vue |
| 脚本编辑/测试 | CodeEditor/ScriptEditor 和 adapter/script-test |
| 共用时间筛选 | components/widget/time-filter |

样式约定：

- 沿用系统 shadcn/ui 风格与主题变量；圆角、边框、字体、hover、focus、disabled、error 全部协调。
- 表单第三方控件外观向 VbenInput 靠齐，不要求所有控件替换成同一个组件。
- 应用全局样式入口 `apps/web-ui/src/styles/index.css`；每类控件独立维护适配，不写一条大范围选择器统改所有组件。
- 布局优先 Tailwind 类；不新建 settings.css 管一堆页面布局。
- 默认已有的视觉规则不要重复声明，缩减 CSS 时保持当前效果；保留明暗、禁用、校验和显式尺寸。
- 主题色/字号等通用配置优先 adapter/design-tokens 与框架偏好，不到处硬编码。
- 细滚动条与系统一致；组件内部滚动，页面和弹窗不要出现无意义双层滚动。
- 按用户针对页面的选择处理分段、Select、日期面板高亮，不能把某一控件的绿色选中态一刀切覆盖所有控件。
- 必要的 CSS 原因写中文注释，尤其选择器层级或特殊覆盖；不为显而易见的每行代码增加噪声。

## 7. 多语言规则

- `zh-CN` 和 `en-US` 文件名与键结构一致；一个功能一个文件。
- `tb.json` 只保留 app、authority、menu、actionType、entityType、common、table、components 等公共分组。
- 功能文件按实际需要组织 menu、sections、fields、actions、messages、validation、options、features。
- 公共控件在 `tb.components.<组件>`，避免共享组件名字带某个业务的 calculated-field/alarm-rule。
- `$t` 尽量直接写完整静态键；三目在 `$t` 外部。不要为 label/options 写动态拼接工具。
- 枚举选项直接列出，便于阅读和静态检查；不要通过 getOptions 临时生成翻译 key。
- 删除实体名称使用 `$t('device.menu')` 等，参数统一 entity/name/count/deleted/failed。
- 标题、提示、按钮和验证文案一起整理；修改字段时同时处理中文与英文，不能只改界面可见的一处。

```ts
// 推荐
const title = record.value?.id
  ? $t('device.actions.edit')
  : $t('device.actions.create');

// 避免
// $t(isEdit ? 'device.actions.edit' : 'device.actions.create');
// const getLabel = (key: string) => $t(`device.fields.${key}`);
```

当前部分旧代码仍存在动态 key，不代表用户已经撤销静态键要求。来源：S33、S34、S39、S43、S47、S58、S65、S68、S70。

## 8. API、Store 与 WS

- 业务 HTTP API 归档到 `api/tb`，方法与类型核对相应 Controller。
- Entity Query 统一在 `entity-query.ts`，优先用于实体选择/名称查询；页面专属选项转换直接在表单写，不做无用 API 包装。
- EventController 的相关请求统一 `event.ts`；TelemetryController 统一 `telemetry.ts`；不要各业务复制事件接口。
- system-info 参数统一 systemStore 会话级加载和缓存；通用组件需要的系统参数尽量内部获取，不每个调用方重复传。
- WS 类型 `types/ws.ts`、连接 `store/websocket.ts`、组件入口 `hooks/use-ws.ts`。
- `useWebSocket` 负责底层连接，store 负责命令/订阅；组件生命周期释放订阅，退出重置连接，令牌有效性复用现有认证机制。
- 不额外创造重复 token 状态、复制认证逻辑、复杂保护层；确需并发合并或清理时保留明确实现。

## 9. 仓库格式与验证

当前配置事实：

- Vue SFC + TypeScript，已有别名 `#/`。
- `.editorconfig`：UTF-8、LF、2 空格、单引号、文件末尾换行、去除普通文件尾随空格、参考行长 100。
- 包管理器 `pnpm@11.16.0`；根 engines 为 Node `^22.18.0 || ^24.12.0`、pnpm `>=11.0.0`。升级时以 package.json 为准。
- 格式/静态检查体系为 Oxfmt、Oxlint、ESLint、Stylelint，提交信息采用项目 commitlint。
- 当前 lefthook 配置 pre-commit 串行 lint/format/typecheck；不要为了提交方便绕过原有检查。（S20/17）

业务改动至少核对：新增/编辑回显、取消不保存、删除失败保留弹窗、查询排序分页、角色权限、中文英文、明暗主题、窄屏、空数据、组件内部滚动、实体上下文、路由直达。WS/编辑器另查销毁清理与切换后资源状态。这是对历史验收点的归纳，不要求每个纯文档变更跑全站。

可按改动范围使用当前脚本：

```powershell
pnpm check:thingsboard
pnpm build:thingsboard
pnpm exec eslint <本次修改的脚本和Vue文件>
pnpm exec stylelint <本次修改的Vue和样式文件>
```

只在需要格式化的范围执行格式工具，不为了局部改动格式化整个仓库。

用户反复要求完成后整理代码、格式、逻辑、翻译并在明确指示时提交。多次要求清理测试产物，但范围曾发生修正；不能从一句历史“删除全部”推断今后每次自动删除现有框架测试。验收过程与是否保留临时测试文件是两件事；旧测试入口存在与否先检查，报告实际执行的检查及未验证范围。

## 10. 一段可复用的任务约定

> 按当前项目 tenant/list.vue、tenant/form.vue 的代码组织、变量、函数和多语言结构实现；业务逻辑、字段、默认值及权限核对 ThingsBoard ui-ngx 和后端。优先复用 Vben、adapter 与现有公共组件，使用系统 shadcn/ui 风格。保持文件数量适当、状态单一、逻辑直接，避免无必要的包装组件、字段工厂、类型和重复校验。列表使用 BasicTable/useTable、searchInfo 和 actionColumn；表单使用 useVbenForm、record 与 modalApi；多语言使用完整静态键。执行该模块最后确认的弹窗、权限和交互要求，保留必要错误处理，按改动范围验证。需求与当前代码不一致时明确列出差异。
