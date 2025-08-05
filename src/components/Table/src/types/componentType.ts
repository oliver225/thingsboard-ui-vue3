import { CheckboxGroup, RadioButtonGroup, RadioGroup } from '/@/components/Form';
import { componentMap } from '/@/components/Table/src/componentMap';

export type ComponentType =
  | 'Input'
  | 'InputTextArea'
  | 'InputNumber'
  | 'Select'
  | 'AutoComplete'
  | 'TreeSelect'
  | 'RadioButtonGroup'
  | 'RadioGroup'
  | 'CheckboxGroup'
  | 'Checkbox'
  | 'Switch'
  | 'DatePicker'
  | 'TimePicker';
