import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section, templateHint } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_relation', $t('rule-chain.actionUi.relationParameters'), [
      {
        fieldName: 'configuration.direction',
        label: $t('rule-chain.nodeAction.direction'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
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
        formItemClass: 'sm:col-span-1',
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
    ]),
    section('_target', $t('rule-chain.actionUi.targetEntity'), [
      {
        fieldName: 'configuration.deleteForSingleEntity',
        label: $t('rule-chain.nodeAction.deleteForSingleEntity'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: {
          description: $t(
            'rule-chain.config.descriptions.deleteForSingleEntity',
          ),
          title: $t('rule-chain.nodeAction.deleteForSingleEntity'),
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
          ].map((value) => ({
            value,
            label: $t(`rule-chain.config.options.${value}`),
          })),
        },
        dependencies: {
          triggerFields: ['configuration.deleteForSingleEntity'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: !!configuration.deleteForSingleEntity,
          }),
        },
      },
      {
        fieldName: 'configuration.entityNamePattern',
        label: $t('rule-chain.config.entityNamePattern'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: z
          .string({
            error: $t('ui.formRules.required', [
              $t('rule-chain.config.entityNamePattern'),
            ]),
          })
          .trim()
          .min(
            1,
            $t('ui.formRules.required', [
              $t('rule-chain.config.entityNamePattern'),
            ]),
          ),
        dependencies: {
          triggerFields: [
            'configuration.deleteForSingleEntity',
            'configuration.entityType',
          ],
          resolve: ({ values: { configuration = {} } }) => ({
            if:
              configuration.deleteForSingleEntity &&
              configuration.entityType !== 'TENANT',
          }),
        },
      },
      {
        ...templateHint(),
        dependencies: {
          triggerFields: [
            'configuration.deleteForSingleEntity',
            'configuration.entityType',
          ],
          resolve: ({ values: { configuration = {} } }) => ({
            if:
              !!configuration.deleteForSingleEntity &&
              configuration.entityType !== 'TENANT',
          }),
        },
      },
    ]),
  ];
}

export const definition = {
  createSchema,
  toConfiguration(configuration) {
    return {
      ...configuration,
      entityNamePattern: configuration.entityNamePattern?.trim() || null,
    };
  },
} satisfies NodeFormDefinition;
