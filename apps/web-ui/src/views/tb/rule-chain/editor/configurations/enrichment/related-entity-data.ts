import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { h, ref } from 'vue';

import { VbenSegmented, VbenSelect } from '@vben/common-ui';

import { Input as VbenInput } from '@vben-core/shadcn-ui';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { createMappingHandlers } from '../shared/configuration';
import {
  allowedEntityFields,
  getEntityFieldOptions,
} from '../shared/entity-fields';
import { createFetchToField } from '../shared/fetch-to-field';
import { section, templateHint } from '../shared/form-layout';

function createRelationFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.relationsQuery.direction',
      label: $t('rule-chain.config.relationsQuery_direction'),
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
      fieldName: 'configuration.relationsQuery.maxLevel',
      label: $t('rule-chain.config.relationsQuery_maxLevel'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().int().min(1),
      componentProps: { min: 1, precision: 0, step: 1 },
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
    },
  ];
}

function createDataFields(): VbenFormSchema[] {
  const dataToFetch = ref('ATTRIBUTES');
  const sourceLabel = () => {
    if (dataToFetch.value === 'FIELDS')
      return $t('rule-chain.nodeAction.sourceField');
    if (dataToFetch.value === 'LATEST_TELEMETRY')
      return $t('rule-chain.nodeAction.sourceTelemetryKey');
    return $t('rule-chain.nodeAction.sourceAttributeKey');
  };
  return [
    {
      fieldName: 'configuration.dataToFetch',
      label: $t('rule-chain.nodeAction.dataToFetch'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: VbenSegmented,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        class: 'mx-auto w-full p-[2px]',
        'aria-label': $t('rule-chain.nodeAction.dataToFetch'),
        tabs: ['ATTRIBUTES', 'LATEST_TELEMETRY', 'FIELDS'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
      dependencies: {
        triggerFields: ['configuration.dataToFetch'],
        resolve: ({ values: { configuration } }) => {
          dataToFetch.value = configuration?.dataToFetch ?? 'ATTRIBUTES';
          return {};
        },
      },
    },
    {
      fieldName: 'configuration.dataMapping',
      label: () => {
        if (dataToFetch.value === 'FIELDS')
          return $t('rule-chain.config.dataMapping');
        if (dataToFetch.value === 'LATEST_TELEMETRY')
          return $t('rule-chain.nodeAction.telemetryMapping');
        return $t('rule-chain.nodeAction.attributeMapping');
      },
      formItemClass: 'sm:col-span-2',
      type: 'array',
      children: [
        {
          fieldName: 'key',
          label: sourceLabel,
          component: (props: Record<string, unknown>) =>
            dataToFetch.value === 'FIELDS'
              ? h(VbenSelect, { ...props, options: getEntityFieldOptions() })
              : h(VbenInput, props),
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: () => $t('ui.formRules.required', [sourceLabel()]),
            })
            .trim()
            .min(1, {
              error: () => $t('ui.formRules.required', [sourceLabel()]),
            })
            .refine(
              (value) =>
                dataToFetch.value !== 'FIELDS' ||
                allowedEntityFields.some((field) => field === value),
              {
                error: () => $t('ui.formRules.selectRequired', [sourceLabel()]),
              },
            ),
        },
        {
          fieldName: 'value',
          label: $t('rule-chain.nodeAction.targetKey'),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.targetKey'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.targetKey'),
              ]),
            ),
        },
      ],
      arrayProps: {
        showIndex: false,
        addButtonText: $t('rule-chain.nodeAction.addMapping'),
        emptyText: $t('rule-chain.config.noRows'),
        actionText: $t('tb.common.actions'),
      },
      rules: 'required',
    },
    {
      ...templateHint('_relatedEntityMappingHelp'),
      componentProps: () => ({
        scope: $t(
          dataToFetch.value === 'FIELDS'
            ? 'rule-chain.templateSyntax.targetFields'
            : 'rule-chain.templateSyntax.allFields',
        ),
      }),
    },
  ];
}

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_relatedEntityFilters',
      $t('rule-chain.nodeAction.relationFilters'),
      createRelationFields(),
    ),
    section(
      '_relatedEntityData',
      $t('rule-chain.nodeAction.dataToFetch'),
      createDataFields(),
    ),
    createFetchToField(
      $t('rule-chain.config.addMappedFieldsTo'),
      'selectRequired',
    ),
  ];
}

export const definition = {
  createSchema,
  ...createMappingHandlers('dataMapping'),
} satisfies NodeFormDefinition;
