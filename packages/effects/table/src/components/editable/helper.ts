import type { Ref } from 'vue';

import type { ComponentType } from '../../types/componentType';
import type { Fn, Recordable } from '../../types/shared';

import { i18n } from '@vben/locales';
import { isObject } from '@vben/utils';

/**
 * @description: 生成placeholder
 */
export function createPlaceholderMessage(component: ComponentType) {
  const { t } = i18n.global;
  if (component.includes('Input') || component.includes('AutoComplete')) {
    return t('table.inputPlaceholder');
  }
  if (component.includes('Picker')) {
    return t('table.selectPlaceholder');
  }

  if (
    component.includes('Select') ||
    component.includes('Checkbox') ||
    component.includes('Radio') ||
    component.includes('Switch') ||
    component.includes('DatePicker') ||
    component.includes('TimePicker')
  ) {
    return t('table.selectPlaceholder');
  }
  return '';
}

/** Register cell callbacks and refs on the row model used by the row editor. */
export function updateEditRecordState(
  record: Recordable,
  key: string,
  dataIndex: string,
  editing: boolean,
  callbackOrRef: Fn | Ref,
  labelRef?: Ref,
) {
  if (editing) {
    if (!isObject(record[key])) record[key] = {};
    record[key][dataIndex] = callbackOrRef;
    if (labelRef) record[key][`${dataIndex}_label`] = labelRef;
  } else if (record[key]) {
    Reflect.deleteProperty(record[key], dataIndex);
    if (labelRef) Reflect.deleteProperty(record[key], `${dataIndex}_label`);
    if (Object.keys(record[key]).length === 0)
      Reflect.deleteProperty(record, key);
  }
}
