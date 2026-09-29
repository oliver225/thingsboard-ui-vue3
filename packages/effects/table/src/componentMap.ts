import type { Component } from 'vue';

import type { ComponentType } from './types/componentType';

import { defineComponent, h } from 'vue';

import {
  AutoComplete,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Input,
  InputNumber,
  RadioGroup,
  Select,
  Switch,
  TimePicker,
  TreeSelect,
  Upload,
} from 'antdv-next';

const RadioButtonGroup = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(RadioGroup, { ...attrs, optionType: 'button' }, slots);
  },
});
const componentMap = new Map<ComponentType, Component>([
  ['AutoComplete', AutoComplete],
  ['Checkbox', Checkbox],
  ['CheckboxGroup', CheckboxGroup],
  ['DatePicker', DatePicker],
  ['Input', Input],
  ['InputNumber', InputNumber],
  ['InputTextArea', Input.TextArea],
  ['ListSelect', Select],
  ['RadioButtonGroup', RadioButtonGroup],
  ['RadioGroup', RadioGroup],
  ['Select', Select],
  ['Switch', Switch],
  ['TimePicker', TimePicker],
  ['TreeSelect', TreeSelect],
  ['Upload', Upload],
]);
export function add(name: ComponentType, component: Component) {
  componentMap.set(name, component);
}
export function del(name: ComponentType) {
  componentMap.delete(name);
}
export { componentMap };
