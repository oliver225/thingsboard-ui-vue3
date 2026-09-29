import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { templateDescription } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.useMetadataPeriodInSecondsPatterns',
      label: $t('rule-chain.config.useMetadataPeriodInSecondsPatterns'),
      formItemClass: 'sm:col-span-2',
      component: 'TbCheckbox',
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.useMetadataPeriodInSecondsPatterns',
        ),
        title: $t('rule-chain.config.useMetadataPeriodInSecondsPatterns'),
      },
    },
    {
      fieldName: 'configuration.periodInSecondsPattern',
      label: $t('rule-chain.nodeAction.periodInSecondsPattern'),
      description: templateDescription,
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.periodInSecondsPattern'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.periodInSecondsPattern'),
          ]),
        ),
      dependencies: {
        triggerFields: ['configuration.useMetadataPeriodInSecondsPatterns'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.useMetadataPeriodInSecondsPatterns === true,
        }),
      },
    },
    {
      fieldName: 'configuration.periodInSeconds',
      label: $t('rule-chain.nodeAction.periodInSeconds'),
      formItemClass: 'sm:col-span-2',
      component: 'InputNumber',
      rules: z.number().int().min(0),
      componentProps: { min: 0 },
      dependencies: {
        triggerFields: ['configuration.useMetadataPeriodInSecondsPatterns'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !configuration.useMetadataPeriodInSecondsPatterns,
        }),
      },
    },

    {
      fieldName: 'configuration.maxPendingMsgs',
      label: $t('rule-chain.nodeAction.maxPendingMsgs'),
      formItemClass: 'sm:col-span-2',
      component: 'InputNumber',
      rules: z.number().int().min(1).max(100_000),
      componentProps: { min: 1, max: 100_000, precision: 0, step: 1 },
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
