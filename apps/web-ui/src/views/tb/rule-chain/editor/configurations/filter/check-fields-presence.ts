import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.messageNames',
      label: $t('rule-chain.config.messageNames'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      componentProps: { mode: 'tags' },
    },
    {
      fieldName: 'configuration.metadataNames',
      label: $t('rule-chain.config.metadataNames'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      componentProps: { mode: 'tags' },
    },
    {
      fieldName: 'configuration.checkAllKeys',
      label: $t('rule-chain.config.checkAllKeys'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.checkAllKeys'),
        title: $t('rule-chain.config.checkAllKeys'),
      },
    },
  ];
}

export const definition = {
  title: $t('rule-chain.config.fieldsToCheck'),
  createSchema,
  validate(configuration) {
    if (
      !configuration.messageNames?.length &&
      !configuration.metadataNames?.length
    )
      return [
        {
          fieldName: 'configuration.messageNames',
          message: $t('rule-chain.config.atLeastOneField'),
        },
      ];
    return [];
  },
} satisfies NodeFormDefinition;
