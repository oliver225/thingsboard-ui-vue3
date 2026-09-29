import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import SegmentedSetting from './segmented-setting.vue';

/** 消息正文／元数据写入位置，保留各节点自己的标题和校验规则。 */
export function createFetchToField(
  title: string,
  rules?: VbenFormSchema['rules'],
): VbenFormSchema {
  return {
    fieldName: 'configuration.fetchTo',
    label: title,
    hideLabel: true,
    formItemClass: 'sm:col-span-2',
    component: SegmentedSetting,
    modelPropName: 'modelValue',
    rules,
    componentProps: {
      title,
      defaultValue: 'METADATA',
      options: [
        { value: 'DATA', label: $t('rule-chain.nodeAction.message') },
        { value: 'METADATA', label: $t('rule-chain.nodeAction.metadata') },
      ],
    },
  };
}
