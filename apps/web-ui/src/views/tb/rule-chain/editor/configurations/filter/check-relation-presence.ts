import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.direction',
      label: $t('rule-chain.nodeAction.direction'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      componentProps: {
        options: ['FROM', 'TO'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
    },
    {
      fieldName: 'configuration.relationType',
      label: $t('rule-chain.nodeAction.relationType'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.relationType'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.relationType'),
          ]),
        ),
    },
    {
      fieldName: 'configuration.checkForSingleEntity',
      label: $t('rule-chain.config.checkForSingleEntity'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.checkForSingleEntity'),
        title: $t('rule-chain.config.checkForSingleEntity'),
      },
    },
    {
      fieldName: 'configuration.entityType',
      label: $t('rule-chain.nodeAction.entityType'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
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
      dependencies: {
        triggerFields: ['configuration.checkForSingleEntity'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.checkForSingleEntity === true,
        }),
      },
    },
    {
      fieldName: 'configuration.entityId',
      label: $t('rule-chain.config.entityId'),
      formItemClass: 'sm:col-span-1',
      component: 'EntityInput',
      rules: 'selectRequired',
      dependencies: {
        triggerFields: [
          'configuration.checkForSingleEntity',
          'configuration.entityType',
        ],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.checkForSingleEntity === true,
          componentProps: { entityType: configuration?.entityType },
        }),
      },
    },
  ];
}

export const definition = {
  title: $t('rule-chain.nodeAction.relationSearchParameters'),
  createSchema,
} satisfies NodeFormDefinition;
