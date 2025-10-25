import type { Component } from 'vue';
import type { ComponentType } from './types/index';
import {
  Input,
  Checkbox,
  AutoComplete,
  Cascader,
  DatePicker,
  InputNumber,
  Switch,
  TimePicker,
  Slider,
  Rate,
  Divider,
} from 'ant-design-vue';

import TbV3Text from './components/TbV3Text.vue';
import TbV3Select from './components/TbV3Select.vue';
import TbV3TreeSelect from './components/TbV3TreeSelect.vue';
import TbV3RadioGroup from './components/TbV3RadioGroup.vue';
import TbV3CheckboxGroup from './components/TbV3CheckboxGroup.vue';
import TbV3RadioButtonGroup from './components/TbV3RadioButtonGroup.vue';
import FormGroup from './components/FormGroup.vue';

import { StrengthMeter } from '/@/components/StrengthMeter';
import { IconPicker } from '/@/components/Icon';
import { CountdownInput } from '/@/components/CountDown';

const componentMap = new Map<ComponentType, Component>();

componentMap.set('Input', Input);
componentMap.set('InputGroup', Input.Group);
componentMap.set('InputPassword', Input.Password);
componentMap.set('InputSearch', Input.Search);
componentMap.set('InputTextArea', Input.TextArea);
componentMap.set('InputNumber', InputNumber);
componentMap.set('AutoComplete', AutoComplete);

componentMap.set('Text', TbV3Text);
componentMap.set('Select', TbV3Select); //Select);
componentMap.set('TreeSelect', TbV3TreeSelect); //TreeSelect);
componentMap.set('Switch', Switch);
componentMap.set('RadioButtonGroup', TbV3RadioButtonGroup);
componentMap.set('RadioGroup', TbV3RadioGroup); //Radio.Group);
componentMap.set('Checkbox', Checkbox);
componentMap.set('CheckboxGroup', TbV3CheckboxGroup); //Checkbox.Group);
componentMap.set('Cascader', Cascader);
componentMap.set('Slider', Slider);
componentMap.set('Rate', Rate);

componentMap.set('DatePicker', DatePicker);
componentMap.set('MonthPicker', DatePicker.MonthPicker);
componentMap.set('RangePicker', DatePicker.RangePicker);
componentMap.set('WeekPicker', DatePicker.WeekPicker);
componentMap.set('TimePicker', TimePicker);
componentMap.set('StrengthMeter', StrengthMeter);
componentMap.set('IconPicker', IconPicker);
componentMap.set('InputCountDown', CountdownInput);

componentMap.set('None', Input);
componentMap.set('Divider', Divider);
componentMap.set('FormGroup', FormGroup);

export function add(compName: ComponentType, component: Component) {
  componentMap.set(compName, component);
}

export function del(compName: ComponentType) {
  componentMap.delete(compName);
}

export { componentMap };
