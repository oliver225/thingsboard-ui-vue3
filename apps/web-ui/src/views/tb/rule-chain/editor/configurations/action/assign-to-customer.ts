import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { templateHint } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.customerNamePattern',
      label: $t('rule-chain.nodeAction.customerNamePattern'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.customerNamePattern'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.customerNamePattern'),
          ]),
        ),
    },
    templateHint(),
    {
      fieldName: 'configuration.createCustomerIfNotExists',
      label: $t('rule-chain.config.createCustomerIfNotExists'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        title: $t('rule-chain.config.createCustomerIfNotExists'),
      },
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
