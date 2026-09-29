import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.alarmStatusList',
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          'ACTIVE_UNACK',
          'ACTIVE_ACK',
          'CLEARED_UNACK',
          'CLEARED_ACK',
        ].map((status) => ({
          value: status,
          label: $t(`alarm.options.status.${status}`),
        })),
      },
      label: $t('rule-chain.nodeAction.alarmStatus'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      rules: z
        .array(z.string())
        .min(1, $t('rule-chain.nodeAction.alarmStatusRequired')),
    },
  ];
}

export const definition = {
  title: $t('rule-chain.nodeAction.alarmStatus'),
  createSchema,
} satisfies NodeFormDefinition;
