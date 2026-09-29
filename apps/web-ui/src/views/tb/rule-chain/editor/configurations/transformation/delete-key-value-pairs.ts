import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import SegmentedSetting from '../shared/segmented-setting.vue';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.deleteFrom',
      label: $t('rule-chain.config.deleteFrom'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: SegmentedSetting,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        title: $t('rule-chain.config.deleteFrom'),
        defaultValue: 'DATA',
        options: ['DATA', 'METADATA'].map((value) => ({
          value,
          label: $t(
            `rule-chain.nodeAction.${value === 'DATA' ? 'message' : 'metadata'}`,
          ),
        })),
      },
    },
    {
      fieldName: 'configuration.keys',
      label: $t('rule-chain.config.mapKey'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: { mode: 'tags' },
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
