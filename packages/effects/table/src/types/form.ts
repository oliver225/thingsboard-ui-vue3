import type {
  ButtonProps as AntdButtonProps,
  ColProps as ColEx,
  FormItemProps as FormItem,
} from 'antdv-next';
import type { NamePath, RuleObject } from 'antdv-next/dist/form/types';
import type { RowProps } from 'antdv-next/dist/grid/row';

import type { CSSProperties, VNode } from 'vue';

import type { FormField } from './record';
import type { Recordable } from './shared';
import type { TableActionType } from './table';

type ComponentType = string;

export type FieldMapToTime = [string, [string, string], string?][];

export type Rule = RuleObject & {
  trigger?: 'blur' | 'change' | ['change', 'blur'];
};

export interface RenderCallbackParams<T> {
  schema: FormSchema<T>;
  values: Recordable;
  model: Recordable;
  field: FormField<T>;
}

export interface FormButtonProps extends AntdButtonProps {
  text?: string;
}

export interface FormActionType {
  setProps: (formProps: Partial<FormProps>) => Promise<void>;
  updateSchema: (
    data: Partial<FormSchema> | Partial<FormSchema>[],
  ) => Promise<void>;
  resetSchema: (
    data: Partial<FormSchema> | Partial<FormSchema>[],
  ) => Promise<void>;
  getFieldsValue: () => Recordable;
  setFieldsValue: (values: Recordable) => Promise<void>;
  appendSchemaByField: (
    schema: FormSchema,
    prefixField: string | undefined,
    first?: boolean | undefined,
  ) => Promise<void>;
  removeSchemaByFiled: (field: string | string[]) => Promise<void>;
  resetFields: () => Promise<void>;
  submit: () => Promise<void>;
  validate: (nameList?: NamePath[]) => Promise<any>;
  validateFields: (nameList?: NamePath[]) => Promise<any>;
  clearValidate: (name?: string | string[]) => Promise<void>;
  scrollToField: (name: NamePath, options?: ScrollOptions) => Promise<void>;
}

export interface FormProps<T = Recordable> {
  layout?: 'horizontal' | 'inline' | 'vertical';
  // Form value
  model?: T;
  // Request Body
  enctype?: 'form-data' | 'json';
  // The width of all items in the entire form
  labelWidth?: number | string;
  // alignment
  labelAlign?: 'left' | 'right';
  // Row configuration for the entire form
  rowProps?: RowProps;
  // Submit form on reset
  submitOnReset?: boolean;
  // Col configuration for the entire form
  labelCol?: Partial<ColEx>;
  // Col configuration for the entire form
  wrapperCol?: Partial<ColEx>;

  // General row style
  baseRowStyle?: CSSProperties;

  // General col configuration
  baseColProps?: Partial<ColEx>;

  // Form configuration rules
  schemas?: FormSchema<T>[];
  // Function values used to merge into dynamic control form items
  mergeDynamicData?: Recordable;
  // Compact mode for search forms
  compact?: boolean;
  // Blank line span
  emptySpan?: number | Partial<ColEx>;
  // Internal component size of the form
  size?: 'default' | 'large' | 'medium' | 'small';
  // Whether to disable
  disabled?: boolean;
  // Time interval fields are mapped into multiple
  fieldMapToTime?: FieldMapToTime;
  // Placeholder is set automatically
  autoSetPlaceHolder?: boolean;
  // Auto submit on press enter on input
  autoSubmitOnEnter?: boolean;
  // Check whether the information is added to the label
  rulesMessageJoinLabel?: boolean;
  // Whether to show collapse and expand buttons
  showAdvancedButton?: boolean;
  // Whether to focus on the first input box, only works when the first form item is input
  autoFocusFirstItem?: boolean;
  // Automatically collapse over the specified number of rows
  autoAdvancedLine?: number;
  // Always show lines
  alwaysShowLines?: number;
  // Whether to show the operation button
  showActionButtonGroup?: boolean;

  // Reset button configuration
  resetButtonOptions?: Partial<FormButtonProps>;

  // Confirm button configuration
  submitButtonOptions?: Partial<FormButtonProps>;

  // Operation column configuration
  actionColOptions?: Partial<ColEx>;

  // Show reset button
  showResetButton?: boolean;
  // Show confirmation button
  showSubmitButton?: boolean;

  resetFunc?: () => Promise<void>;
  submitFunc?: () => Promise<void>;
  transformDateFunc?: (date: any) => string;
  colon?: boolean;

  formKey?: string;
}

export interface FormSchema<T = Recordable> {
  // 字段名
  field: FormField<T>;
  // 字段标签名，如返回 Select、TreeSelect 的标签名
  fieldLabel?: FormField<T>;
  // 绑定组件的属性名（一般无需设置）默认：value，如：v-model:value
  valueField?: string;
  // 绑定组件的标签属性名（一般无需设置）默认：labelValue，如：v-model:labelValue
  labelField?: string;
  // 标签名
  label?: string;
  // 辅助标签名，使用浅色显示在标签右侧
  subLabel?: string;
  // 帮助信息，显示在标签右侧的问号里
  helpMessage?:
    | ((renderCallbackParams: RenderCallbackParams<T>) => string | string[])
    | string
    | string[];
  // BaseHelp component props
  helpComponentProps?: Partial<HelpComponentProps>;
  // Label width, if it is passed, the labelCol and WrapperCol configured by itemProps will be invalid
  labelWidth?: number | string;
  // Disable the adjustment of labelWidth with global settings of formModel, and manually set labelCol and wrapperCol by yourself
  disabledLabelWidth?: boolean;
  // render component
  component: ComponentType;
  // Component parameters
  componentProps?:
    | ((opt: {
        schema: FormSchema<T>;
        tableAction: TableActionType;
        formActionType: FormActionType;
        formModel: T;
      }) => Recordable)
    | object;
  // Required
  required?:
    | ((renderCallbackParams: RenderCallbackParams<T>) => boolean)
    | boolean;

  // 组件后缀
  suffix?:
    | ((values: RenderCallbackParams<T>) => number | string | VNode | VNode[])
    | number
    | string
    | VNode
    | VNode[];

  // Validation rules
  rules?: Rule[];
  // Check whether the information is added to the label
  rulesMessageJoinLabel?: boolean;

  // Reference formModelItem
  itemProps?: Partial<FormItem>;

  // col configuration outside formModelItem
  colProps?: Partial<ColEx>;

  // 默认值
  defaultValue?: any;
  defaultLabel?: any;
  isAdvanced?: boolean;

  // Matching details components
  span?: number;

  // 表单控件是否显示（为 false 时不渲染控件）
  ifShow?:
    | ((renderCallbackParams: RenderCallbackParams<T>) => boolean)
    | boolean;
  // 表单控件是否显示（正常渲染控件，只是控制显示隐藏）
  show?: ((renderCallbackParams: RenderCallbackParams<T>) => boolean) | boolean;

  // Render the content in the form-item tag
  render?: (
    renderCallbackParams: RenderCallbackParams<T>,
  ) => string | VNode | VNode[];

  // Rendering col content requires outer wrapper form-item
  renderColContent?: (
    renderCallbackParams: RenderCallbackParams<T>,
  ) => string | VNode | VNode[];

  renderComponentContent?:
    | ((renderCallbackParams: RenderCallbackParams<T>) => any)
    | string
    | VNode
    | VNode[];

  // Custom slot, in from-item
  slot?: string;

  // Custom slot, similar to renderColContent
  colSlot?: string;

  dynamicDisabled?:
    | ((renderCallbackParams: RenderCallbackParams<T>) => boolean)
    | boolean;

  dynamicRules?: (renderCallbackParams: RenderCallbackParams<T>) => Rule[];
}

export interface HelpComponentProps {
  maxWidth: string;
  // Whether to display the serial number
  showIndex: boolean;
  // Text list
  text: any;
  // colour
  color: string;
  // font size
  fontSize: string;
  icon: string;
  absolute: boolean;
  // Positioning
  position: any;
}
