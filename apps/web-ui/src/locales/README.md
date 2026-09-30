# 多语言文件约定

`langs/zh_CN` 和 `langs/en_US` 使用相同的文件名和键结构。文件名就是翻译键的命名空间，由 `index.ts` 自动加载。

## 公共文案

`tb.json` 只保留 `app`、`authority`、`menu`、`actionType`、`entityType`、`common`、`table` 和 `components`。

- `menu`：全局导航目录。
- `common`：跨功能通用文案，包括操作状态 `actionStatus`。
- `components`：adapter 公共组件文案，按 `codeEditor`、`scriptTest`、`fieldArguments`、`debugSettings` 等组件分组。

## 功能文案

一个功能对应一个文件，例如 `device.json`（设备）、`device-profile.json`（设备配置）、`event.json`（事件）、`tenant.json`（租户）。已有的告警规则、计算字段、OTA 等文案统一放在各自的功能文件中。

每个功能文件按以下层级组织，只保留实际需要的分组：

| 分组         | 用途                                                   |
| ------------ | ------------------------------------------------------ |
| `menu`       | 功能总标题，字符串                                     |
| `sections`   | 分区、页签和对话框标题                                 |
| `fields`     | 字段名称                                               |
| `actions`    | 按钮及操作名称                                         |
| `messages`   | 说明、占位提示、确认及操作结果                         |
| `validation` | 输入校验文案                                           |
| `options`    | 枚举、状态、单位等选项                                 |
| `features`   | 导入、凭证、连接检查等子功能，保留各自的字段和操作层级 |

公共组件在 `tb.components.<组件名>` 下也采用这些分组。`page.json`、`demos.json` 为框架页面与示例命名空间。

删除提示统一维护在 `tb.common.messages.delete` 和 `tb.common.messages.batchDelete`，功能文件只保留删除后的专属影响说明。实体名称直接复用对应功能的 `menu`；同一文件中的子功能复用已有的分区标题，不另建实体名称文案。统一参数为 `entity`（实体名称）、`name`（记录名称）、`count`（选中数量）、`deleted`（已删除数量）、`failed`（失败数量）；语言文本使用 `{entity}` 等 Vue I18n 占位符。

```ts
$t('device.menu');
$t('device.fields.name');
$t('device.actions.create');
$t('device.features.credentials.type.ACCESS_TOKEN');
$t('tb.components.codeEditor.actions.format');
$t('tb.common.messages.batchDelete.confirm', {
  entity: $t('device.menu'),
  count: selectedCount,
});
```

新增或移动文案时同步更新中英文、静态引用和动态拼接的翻译键。同名但含义不同的文案应使用不同键，避免覆盖。
