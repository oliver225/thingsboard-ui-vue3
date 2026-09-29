---
outline: deep
---

# Vben TableAction 表格操作

`TableAction` 用于在表格操作列中渲染一组操作按钮，参考 vben2 的 TableAction 设计。基于 shadcn-ui 构建，支持权限控制、气泡确认、提示、下拉「更多」、分割线等能力，可在表格内外任意场景复用。

> 如果文档内没有覆盖到你需要的细节，可以结合在线示例一起查看。

::: info 写在前面

组件本身不依赖任何业务逻辑（不直接读取权限 store），权限通过注入 `hasPermission` 实现，从而保持核心层零耦合、可跨框架复用。在 vxe-table 中推荐通过列插槽（`slots: { default: 'action' }`）在页面里渲染，不改变表格原有的渲染机制。:::

## 基础用法

通过 `actions` 传入操作项数组，每项包含 `text`、`onClick` 等；`danger` 标记危险操作，`divider` 显示按钮间分割线。

<DemoPreview dir="demos/vben-table-action/basic" />

## 提示

通过 `tooltip` 为操作项添加提示，支持字符串或 `{ content, side }` 配置。

<DemoPreview dir="demos/vben-table-action/tooltip" />

## 气泡确认

通过 `popConfirm` 开启点击前的气泡确认，常用于删除等危险操作。

<DemoPreview dir="demos/vben-table-action/popconfirm" />

## 更多下拉

通过 `dropdownActions` 将次要操作收纳到「更多」下拉中，`moreText` 可自定义按钮文案。

<DemoPreview dir="demos/vben-table-action/dropdown" />

## 权限控制

为操作项设置 `auth` 权限码，并注入 `hasPermission` 判断函数，无权限的操作会被隐藏。

<DemoPreview dir="demos/vben-table-action/permission" />

## 在 BasicTable / useTable 中使用

`@vben/table` 使用 `actionColumn` 配置操作列，外层包含 `align`、`width` 和必填的 `actionProps`。内部 `actionProps` 接收 `VbenTableAction` 原生参数，也支持 `(record, index) => TableActionProps`，用于按行生成按钮。

```ts
import type { ActionColumn } from '#/adapter/table';

import { useTable } from '#/adapter/table';

// 紧跟 tableColumns 定义，放在 useTable 之前。
const actionColumn: ActionColumn<DeviceInfo> = {
  align: 'center',
  width: 180,
  actionProps: (record, index) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        text: $t('tb.device.actions.edit'),
        icon: 'lucide:square-pen',
        auth: Authority.TENANT_ADMIN,
        disabled: !record.id?.id,
        variant: 'ghost',
        size: 'icon',
        onClick: () => onEdit(record),
      },
    ],
  }),
};

const [registerTable, tableApi] = useTable<DeviceInfo>({
  columns: tableColumns,
  actionColumn,
});

// 配置整体替换，单独调整宽度时保留其余参数。
tableApi.setProps({ actionColumn: { ...actionColumn, width: 200 } });

// 显式清除配置，移除自动生成的操作列。
tableApi.setProps({ actionColumn: null });
```

- 提供 `actionColumn` 对象时，表格自动追加最后一列，标题为多语言“操作”，始终固定在右侧，不提供 `fixed`、`title`、`slot` 配置。
- `width` 沿用 `BasicColumn['width']` 类型，默认 `240px`，不会按每行按钮数量自动变化。`align` 支持 `left / center / right`，默认 `center`。
- 外层 `align` 控制表头和单元格，并分别映射为按钮容器的 `start / center / end`。内层显式指定 `actionProps.align` 时，优先控制按钮对齐，不影响表头。
- 不传、传 `null` 或通过 `setProps({ actionColumn: undefined })` 清除时，不显示操作列。响应式配置和 `setProps` 都支持更新，反复隐藏、恢复不会重复追加列。
- `actionColumn` 整体替换，不做深度合并。新配置必须包含 `actionProps`，旧列宽、对齐、按钮及权限参数不会残留。
- 内层 `actions`、`dropdownActions`、`class`、`align`、`divider`、`moreText` 等参数直接传给 `VbenTableAction`。
- 默认 `hasPermission` 使用表格现有的权限码/角色判断；显式传入函数时使用该函数。`ifShow` 决定单个按钮是否显示。按钮数组为空、某行按钮全部隐藏或无权限时，仍保留操作列；整列是否存在由外层 `actionColumn` 决定。
- 操作列的点击和双击不会触发行事件。列设置中的 `ignoreAction` 仍能识别该自动生成的操作列。
- 原生 `popConfirm` 会在确认时关闭气泡，不等待请求完成。需要错误提示、提交锁定和失败重试时，在 `onClick` 中调用项目的 `confirm()` 弹窗方法。

应用列表统一使用上述 `actionColumn` 结构，`#/adapter/table` 直接导出 `useTable` 和 `ActionColumn` 类型。顶层 `actionProps` 和历史 `actionColumn.actions` 写法均不再支持。每个按钮独立配置 `key`、`text`、`tooltip`、权限和显示条件。编辑按钮使用 `text-primary hover:text-primary`，删除按钮使用 `danger: true`，图标按钮使用 `variant: 'ghost'` 和 `size: 'icon'`。确认操作在对应的 `onDelete`、`onSetDefault` 等业务方法中直接 `await confirm({...})`，确认后再执行请求。

## 在 vxe-table 中使用

不改变 vxe-table 原有渲染方式，推荐在列配置中声明插槽，在页面通过插槽渲染。

::: tip 推荐：使用适配器封装的版本项目的 `#/adapter/vxe-table` 已对 `VbenTableAction` 做了二次封装，内部统一注入了 `hasPermission`（基于 `useAccess().hasAccessByCodes`）。因此从适配器引入时**无需再传入 `:has-permission`**，只需通过操作项的 `auth` 字段声明权限码即可。:::

```ts
// data.ts —— 列配置声明插槽
{
  align: 'center',
  field: 'operation',
  fixed: 'right',
  slots: { default: 'action' },
  title: $t('system.user.operation'),
  width: 180,
}
```

```vue
<!-- list.vue —— 从适配器引入，权限自动注入，无需传入 has-permission -->
<script setup lang="ts">
import { VbenTableAction } from '#/adapter/vxe-table';
</script>

<template>
  <Grid>
    <template #action="{ row }">
      <template #action="{ row }">
        <VbenTableAction
          :actions="[
            {
              text: $t('common.detail'),
              icon: 'lucide:eye',
              onClick: () => onDetail(row),
            },
            {
              text: $t('common.edit'),
              icon: 'lucide:edit',
              onClick: () => onEdit(row),
            },
          ]"
          :dropdown-actions="[
            {
              text: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              onClick: () => onDelete(row),
              auth: ['AC_100100'],
            },
          ]"
          align="center"
        />
      </template>
    </template>
  </Grid>
</template>
```

若直接从 `@vben/common-ui` 引入核心组件（不经过适配器），组件不依赖任何业务逻辑，需自行注入 `hasPermission`：

```vue
<script setup lang="ts">
import { useAccess } from '@vben/access';
import { VbenTableAction } from '@vben/common-ui';

const { hasAccessByCodes } = useAccess();
function hasPermission(auth?: string | string[]) {
  if (!auth) return true;
  return hasAccessByCodes(Array.isArray(auth) ? auth : [auth]);
}
</script>

<template>
  <VbenTableAction
    v-bind="useActions(row, onActionClick)"
    :has-permission="hasPermission"
    align="center"
  />
</template>
```

## API

### TableAction Props

| 属性名 | 描述 | 类型 | 默认值 |
| --- | --- | --- | --- |
| actions | 主操作按钮 | `ActionItem[]` | `[]` |
| dropdownActions | 「更多」下拉中的操作 | `ActionItem[]` | `[]` |
| align | 对齐方式 | `'start' \| 'center' \| 'end'` | `'end'` |
| divider | 按钮之间是否显示分割线 | `boolean` | `false` |
| moreText | 「更多」按钮文案（提供时显示在图标右侧） | `string` | - |
| hasPermission | 权限判断函数，返回 `false` 则隐藏对应 `auth` 的操作（从 `#/adapter/vxe-table` 引入时已自动注入，无需手动传入） | `(auth?: string \| string[]) => boolean` | - |
| class | 根节点自定义类名 | `string` | - |

### ActionItem

| 属性名 | 描述 | 类型 | 默认值 |
| --- | --- | --- | --- |
| text | 按钮文本 | `string` | - |
| icon | 图标组件 | `string`\| `VbenIcon` | - |
| onClick | 点击回调 | `() => void` | - |
| auth | 权限码，配合 `hasPermission` 过滤 | `string \| string[]` | - |
| ifShow | 是否显示 | `boolean \| (() => boolean)` | `true` |
| disabled | 是否禁用 | `boolean` | `false` |
| loading | 加载状态 | `boolean` | `false` |
| danger | 危险操作（红色文字） | `boolean` | `false` |
| tooltip | 提示 | `string \| { content: string; side?: 'top' \| 'bottom' \| 'left' \| 'right' }` | - |
| popConfirm | 气泡确认 | `TableActionPopConfirm` | - |
| variant | 按钮样式变体 | `ButtonVariants['variant']` | `'link'` |
| size | 按钮尺寸 | `ButtonVariants['size']` | `'sm'` |
| key | 唯一标识 | `string \| number` | - |

### TableActionPopConfirm

| 属性名 | 描述 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 提示标题 | `string` | `'Are you sure?'` |
| okText | 确认按钮文案 | `string` | `'OK'` |
| cancelText | 取消按钮文案 | `string` | `'Cancel'` |
| confirm | 确认回调；未提供时回退到 `action.onClick` | `() => void` | - |
