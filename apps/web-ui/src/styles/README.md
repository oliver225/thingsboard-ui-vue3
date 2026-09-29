# 应用样式

`bootstrap.ts` 先加载 `@vben/styles` 和 `@vben/styles/antdv-next`，再加载本目录的 `index.css`。新增样式需要在入口显式导入。

## 文件职责

| 文件 | 负责内容 |
| --- | --- |
| `form-controls/textarea.css`、`input-number.css` | Ant Design 多行文本和数值输入 |
| `form-controls/select.css` | Select / ApiSelect 外框与下拉面板 |
| `form-controls/icon-picker.css` | adapter 注册的 IconPicker，使用 `data-icon-picker` 限定范围 |
| `form-controls/upload.css` | 拖拽上传 |
| `form-layout.css` | `form-message-flow` 错误信息排版与 `queue-strategy-options` 纵向选项布局 |

## 维护约定

- Vben 原生 Input / Textarea 的样式放在 `packages/@core/ui-kit/shadcn-ui/src/ui/` 对应组件内部。本目录保留 Ant Design 组件的适配样式，两者不能相互替代。
- 每种控件独立维护选择器和状态变量，保留显式尺寸、其他外观变体与禁用状态。
- 普通组件规则放在 `@layer components`。覆盖公共未分层的校验规则时，层外规则留在所属组件文件末尾，并注明原因。Select 的校验阴影因公共规则含 `!important`，保留对应覆盖。
- 状态颜色使用主题变量，兼容组件自身状态与表单校验状态。
- Select 和日期面板选中项使用中性色；Segmented 选中项与单选圆点使用主题色。
- 全局交互背景和 Segmented 选中颜色在 `../adapter/design-tokens.ts` 配置；组件可继承的 token 和默认样式不在 CSS 中重复声明。
- CSS 维护控件尺寸、圆角、校验描边以及下拉选项的右侧勾选和多选分隔。调整时保留明暗主题、禁用状态及显式尺寸。
