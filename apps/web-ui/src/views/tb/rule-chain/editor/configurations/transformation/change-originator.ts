import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section, templateHint } from '../shared/form-layout';

function createFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.originatorSource',
      label: $t('rule-chain.nodeAction.newOriginator'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        'aria-label': $t('rule-chain.nodeAction.newOriginator'),
        options: [
          'CUSTOMER',
          'TENANT',
          'RELATED',
          'ALARM_ORIGINATOR',
          'ENTITY',
        ].map((value) => ({
          value,
          label: $t(
            value === 'ENTITY'
              ? 'rule-chain.nodeAction.entityNameMatching'
              : `rule-chain.config.options.${value}`,
          ),
        })),
      },
    },
    {
      fieldName: 'configuration.entityType',
      label: $t('rule-chain.nodeAction.type'),
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
        triggerFields: ['configuration.originatorSource'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.originatorSource === 'ENTITY',
        }),
      },
    },
    {
      fieldName: 'configuration.entityNamePattern',
      label: $t('rule-chain.nodeAction.namePattern'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.namePattern'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.namePattern'),
          ]),
        ),
      dependencies: {
        triggerFields: ['configuration.originatorSource'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.originatorSource === 'ENTITY',
        }),
      },
    },
    {
      fieldName: 'configuration.relationsQuery.direction',
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
      dependencies: {
        triggerFields: ['configuration.originatorSource'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.originatorSource === 'RELATED',
        }),
      },
    },
    {
      fieldName: 'configuration.relationsQuery.maxLevel',
      label: $t('rule-chain.nodeAction.maxRelationLevel'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().int().min(1),
      componentProps: { min: 1, precision: 0, step: 1 },
      dependencies: {
        triggerFields: ['configuration.originatorSource'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.originatorSource === 'RELATED',
        }),
      },
    },
    {
      fieldName: 'configuration.relationsQuery.fetchLastLevelOnly',
      label: $t('rule-chain.config.relationsQuery_fetchLastLevelOnly'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.lastLevelEntities'),
        title: $t('rule-chain.config.relationsQuery_fetchLastLevelOnly'),
      },
      dependencies: {
        triggerFields: ['configuration.originatorSource'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.originatorSource === 'RELATED',
        }),
      },
    },
    {
      fieldName: 'configuration.relationsQuery.filters',
      label: $t('rule-chain.nodeAction.relationFilters'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      type: 'array',
      children: [
        {
          fieldName: 'relationType',
          label: $t('rule-chain.config.relationFilterType'),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.config.relationFilterType'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [
                $t('rule-chain.config.relationFilterType'),
              ]),
            ),
        },
        {
          fieldName: 'entityTypes',
          label: $t('rule-chain.config.entityTypes'),
          component: 'Select',
          componentProps: {
            mode: 'multiple',
            placeholder: $t('rule-chain.nodeAction.anyEntity'),
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
        },
      ],
      arrayProps: {
        showIndex: false,
        addButtonText: $t('rule-chain.nodeAction.addFilter'),
        emptyText: $t('rule-chain.config.noRows'),
        actionText: $t('tb.common.actions'),
      },
      dependencies: {
        triggerFields: ['configuration.originatorSource'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.originatorSource === 'RELATED',
        }),
      },
    },
  ];
}

function createSection(
  fieldName: string,
  title: string,
  fields: VbenFormSchema[],
  originatorSource?: 'ENTITY' | 'RELATED',
): VbenFormSchema {
  return {
    ...section(fieldName, title, fields),
    ...(originatorSource
      ? {
          dependencies: {
            triggerFields: ['configuration.originatorSource'],
            resolve: ({ values: { configuration } }) => ({
              if: configuration.originatorSource === originatorSource,
            }),
          },
        }
      : {}),
  };
}

export function createSchema(): VbenFormSchema[] {
  const fields = createFields();
  const relationFields = fields.filter((field) =>
    field.fieldName.startsWith('configuration.relationsQuery.'),
  );
  const filtersFieldName = 'configuration.relationsQuery.filters';
  return [
    ...fields.filter(
      (field) => field.fieldName === 'configuration.originatorSource',
    ),
    createSection(
      '_changeOriginatorRelations',
      $t('rule-chain.nodeAction.relationQuery'),
      [
        ...relationFields.filter(
          (field) => field.fieldName !== filtersFieldName,
        ),
        createSection(
          '_changeOriginatorFilters',
          $t('rule-chain.nodeAction.relationFilters'),
          relationFields.filter(
            (field) => field.fieldName === filtersFieldName,
          ),
        ),
      ],
      'RELATED',
    ),
    createSection(
      '_changeOriginatorNamePattern',
      '',
      [
        templateHint(
          '_changeOriginatorNamePatternHelp',
          $t('rule-chain.templateSyntax.namePattern'),
        ),
        ...fields.filter((field) =>
          [
            'configuration.entityNamePattern',
            'configuration.entityType',
          ].includes(field.fieldName),
        ),
      ],
      'ENTITY',
    ),
  ];
}

export const definition = {
  get title() {
    return $t('rule-chain.nodeAction.newOriginator');
  },
  createSchema,
  toConfiguration(configuration) {
    return {
      ...configuration,
      entityType:
        configuration.originatorSource === 'ENTITY'
          ? configuration.entityType
          : null,
      entityNamePattern:
        configuration.originatorSource === 'ENTITY'
          ? configuration.entityNamePattern.trim()
          : null,
    };
  },
} satisfies NodeFormDefinition;
