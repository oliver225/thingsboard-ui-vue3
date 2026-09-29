import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.inputValueKey',
      label: $t('rule-chain.config.inputValueKey'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.inputValueKey'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [$t('rule-chain.config.inputValueKey')]),
        ),
    },
    {
      fieldName: 'configuration.outputValueKey',
      label: $t('rule-chain.config.outputValueKey'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.outputValueKey'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [$t('rule-chain.config.outputValueKey')]),
        ),
    },
    {
      fieldName: 'configuration.round',
      label: $t('rule-chain.config.round'),
      formItemClass: 'sm:col-span-2',
      component: 'InputNumber',
      rules: z.number().int().min(0).max(15).nullish(),
      componentProps: { min: 0, max: 15, precision: 0, step: 1 },
    },
    {
      fieldName: 'configuration.useCache',
      label: $t('rule-chain.nodeAction.useCache'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: { title: $t('rule-chain.nodeAction.useCache') },
      dependencies: {
        triggerFields: ['configuration.inputValueKey'],
        resolve: ({ values: { configuration } }) => ({
          componentProps: {
            description: $t('rule-chain.config.descriptions.useCache', {
              inputValueKey:
                configuration.inputValueKey ||
                $t('rule-chain.config.inputValueKey'),
            }),
          },
        }),
      },
    },
    {
      fieldName: 'configuration.addPeriodBetweenMsgs',
      label: $t('rule-chain.nodeAction.addPeriodBetweenMsgs'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        title: $t('rule-chain.nodeAction.addPeriodBetweenMsgs'),
      },
      dependencies: {
        triggerFields: ['configuration.periodValueKey'],
        resolve: ({ values: { configuration } }) => ({
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.addPeriodBetweenMsgs',
              {
                periodValueKey: configuration.periodValueKey || 'periodInMs',
              },
            ),
          },
        }),
      },
    },
    {
      fieldName: 'configuration.periodValueKey',
      label: $t('rule-chain.config.periodValueKey'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.periodValueKey'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [$t('rule-chain.config.periodValueKey')]),
        ),
      dependencies: {
        triggerFields: ['configuration.addPeriodBetweenMsgs'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.addPeriodBetweenMsgs === true,
        }),
      },
    },

    {
      fieldName: 'configuration.tellFailureIfDeltaIsNegative',
      label: $t('rule-chain.nodeAction.tellFailureIfDeltaIsNegative'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.tellFailureIfDeltaIsNegative',
        ),
        title: $t('rule-chain.nodeAction.tellFailureIfDeltaIsNegative'),
      },
    },
    {
      fieldName: 'configuration.excludeZeroDeltas',
      label: $t('rule-chain.config.excludeZeroDeltas'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: { title: $t('rule-chain.config.excludeZeroDeltas') },
      dependencies: {
        triggerFields: [
          'configuration.addPeriodBetweenMsgs',
          'configuration.outputValueKey',
          'configuration.periodValueKey',
        ],
        resolve: ({ values: { configuration } }) => ({
          componentProps: {
            description: $t(
              configuration.addPeriodBetweenMsgs
                ? 'rule-chain.config.descriptions.excludeZeroDeltasWithPeriod'
                : 'rule-chain.config.descriptions.excludeZeroDeltas',
              {
                outputValueKey:
                  configuration.outputValueKey ||
                  $t('rule-chain.config.outputValueKey'),
                periodValueKey: configuration.periodValueKey || 'periodInMs',
              },
            ),
          },
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
