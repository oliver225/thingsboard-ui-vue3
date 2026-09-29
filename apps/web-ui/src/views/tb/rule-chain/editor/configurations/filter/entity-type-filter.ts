import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.originatorTypes',
      label: $t('rule-chain.config.originatorTypes'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        mode: 'multiple',
        options: [
          'DEVICE',
          'ASSET',
          'ENTITY_VIEW',
          'TENANT',
          'CUSTOMER',
          'USER',
          'DASHBOARD',
          'EDGE',
          'RULE_CHAIN',
        ].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
    },
  ];
}

export const definition = {
  title: $t('rule-chain.config.originatorTypes'),
  createSchema,
} satisfies NodeFormDefinition;
