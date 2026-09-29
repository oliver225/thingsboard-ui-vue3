import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.interval',
      label: $t('rule-chain.nodeAction.interval'),
      formItemClass: 'sm:col-span-1',
      component: 'SecondsInput',
      rules: z.number().int().min(1),
      componentProps: { min: 1 },
    },
    {
      fieldName: 'configuration.telemetryPrefix',
      label: $t('rule-chain.nodeAction.telemetryPrefix'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.telemetryPrefix'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.telemetryPrefix'),
          ]),
        ),
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
