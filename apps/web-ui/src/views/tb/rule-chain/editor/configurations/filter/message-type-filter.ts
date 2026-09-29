import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { messageTypeLabels } from '../shared/message-type-options';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.messageTypes',
      label: $t('rule-chain.config.messageTypes'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        mode: 'tags',
        optionFilterProp: 'label',
        placeholder: $t('rule-chain.config.messageTypesPlaceholder'),
        options: Object.entries(messageTypeLabels).map(([value, label]) => ({
          value,
          label: `${$t(`rule-chain.nodeAction.${label}`)} (${value})`,
        })),
      },
    },
  ];
}

export const definition = {
  title: $t('rule-chain.config.messageTypes'),
  createSchema,
} satisfies NodeFormDefinition;
