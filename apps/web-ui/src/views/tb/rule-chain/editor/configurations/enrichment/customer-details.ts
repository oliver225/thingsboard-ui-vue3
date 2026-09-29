import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { createFetchToField } from '../shared/fetch-to-field';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.detailsList',
      label: $t('rule-chain.config.detailsList'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        mode: 'multiple',
        options: [
          'ID',
          'TITLE',
          'COUNTRY',
          'CITY',
          'STATE',
          'ZIP',
          'ADDRESS',
          'ADDRESS2',
          'PHONE',
          'EMAIL',
          'ADDITIONAL_INFO',
        ].map((value) => ({ value, label: String(value) })),
      },
    },
    createFetchToField($t('rule-chain.nodeAction.addSelectedDetailsTo')),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
