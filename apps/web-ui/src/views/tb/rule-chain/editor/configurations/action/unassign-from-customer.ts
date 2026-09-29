import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { templateHint } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.unassignFromCustomer',
      label: $t('rule-chain.config.unassignFromCustomer'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.unassignFromCustomer'),
        title: $t('rule-chain.config.unassignFromCustomer'),
      },
    },
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
      dependencies: {
        triggerFields: ['configuration.unassignFromCustomer'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.unassignFromCustomer === true,
        }),
      },
    },
    {
      ...templateHint(),
      dependencies: {
        triggerFields: ['configuration.unassignFromCustomer'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!configuration.unassignFromCustomer,
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    return {
      ...configuration,
      unassignFromCustomer:
        configuration.customerNamePattern !== null &&
        configuration.customerNamePattern !== undefined,
    };
  },
  toConfiguration(configuration) {
    const { unassignFromCustomer, ...config } = configuration;
    return {
      ...config,
      customerNamePattern: unassignFromCustomer
        ? config.customerNamePattern.trim()
        : null,
    };
  },
} satisfies NodeFormDefinition;
