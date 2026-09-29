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
          triggerFields: ['configuration.entityType'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: configuration.entityType !== 'TENANT',
          }),
        },
      },
      {
        fieldName: 'configuration.entityTypePattern',
        label: $t('rule-chain.actionUi.profileName'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        dependencies: {
          triggerFields: [
            'configuration.createEntityIfNotExists',
            'configuration.entityType',
          ],
          resolve: ({ values: { configuration = {} } }) => ({
            if: ['ASSET', 'DEVICE'].includes(configuration.entityType),
            rules: configuration.createEntityIfNotExists
              ? 'required'
              : undefined,
          }),
        },
      },
      templateHint(),
      {
        fieldName: 'configuration.createEntityIfNotExists',
        label: $t('rule-chain.config.createEntityIfNotExists'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: {
          description: $t(
            'rule-chain.config.descriptions.createEntityIfNotExists',
          ),
          title: $t('rule-chain.config.createEntityIfNotExists'),
        },
        dependencies: {
          triggerFields: ['configuration.entityType'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: ['ASSET', 'CUSTOMER', 'DEVICE'].includes(
              configuration.entityType,
            ),
          }),
        },
      },
    ]),
    section(
      '_advanced',
      $t('rule-chain.actionUi.advancedSettings'),
      [
        {
          fieldName: 'configuration.removeCurrentRelations',
          label: $t('rule-chain.nodeAction.removeCurrentRelations'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.removeCurrentRelations',
            ),
            title: $t('rule-chain.nodeAction.removeCurrentRelations'),
          },
        },
        {
          fieldName: 'configuration.changeOriginatorToRelatedEntity',
          label: $t('rule-chain.nodeAction.changeOriginatorToRelatedEntity'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.changeOriginatorToRelatedEntity',
            ),
            title: $t('rule-chain.nodeAction.changeOriginatorToRelatedEntity'),
          },
        },
      ],
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
  toConfiguration(configuration) {
    return {
      ...configuration,
      entityNamePattern: configuration.entityNamePattern?.trim() || null,
      entityTypePattern: configuration.entityTypePattern?.trim() || null,
      createEntityIfNotExists:
        ['ASSET', 'CUSTOMER', 'DEVICE'].includes(configuration.entityType) &&
        !!configuration.createEntityIfNotExists,
    };
  },
} satisfies NodeFormDefinition;
