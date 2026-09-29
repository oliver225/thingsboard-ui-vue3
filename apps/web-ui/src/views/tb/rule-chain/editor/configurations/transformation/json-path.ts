import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.jsonPath',
      label: $t('rule-chain.nodeAction.jsonPathExpression'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.jsonPathExpression'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.jsonPathExpression'),
          ]),
        ),
    },
  ];
}

export const definition = {
  get title() {
    return $t('rule-chain.nodeAction.jsonPathExpression');
  },
  createSchema,
} satisfies NodeFormDefinition;
