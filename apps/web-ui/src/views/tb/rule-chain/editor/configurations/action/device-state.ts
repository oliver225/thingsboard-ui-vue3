import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.event',
      label: $t('rule-chain.actionUi.connectivityEvent'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: [
          'ACTIVITY_EVENT',
          'INACTIVITY_EVENT',
          'CONNECT_EVENT',
          'DISCONNECT_EVENT',
        ].map((value) => ({
          value,
          label: $t(`rule-chain.actionUi.${value}`),
        })),
      },
    },
  ];
}

export const definition = {
  title: $t('rule-chain.actionUi.connectivityEvent'),
  createSchema,
} satisfies NodeFormDefinition;
