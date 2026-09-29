import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { createMappingHandlers } from '../shared/configuration';
import { hint, section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.tableName',
      label: $t('rule-chain.config.tableName'),
      description: $t('rule-chain.actionUi.customTableHelp'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.tableName'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [$t('rule-chain.config.tableName')]),
        ),
    },
    section('_mapping', $t('rule-chain.actionUi.fieldsMapping'), [
      {
        fieldName: 'configuration.fieldsMapping',
        hideLabel: true,
        formItemClass: 'sm:col-span-2',
        type: 'array',
        children: [
          {
            fieldName: 'key',
            label: $t('rule-chain.actionUi.messageField'),
            component: 'VbenInput',
            modelPropName: 'modelValue',
            rules: z
              .string({
                error: $t('ui.formRules.required', [
                  $t('rule-chain.actionUi.messageField'),
                ]),
              })
              .trim()
              .min(
                1,
                $t('ui.formRules.required', [
                  $t('rule-chain.actionUi.messageField'),
                ]),
              ),
          },
          {
            fieldName: 'value',
            label: $t('rule-chain.actionUi.tableColumn'),
            component: 'VbenInput',
            modelPropName: 'modelValue',
            rules: z
              .string({
                error: $t('ui.formRules.required', [
                  $t('rule-chain.actionUi.tableColumn'),
                ]),
              })
              .trim()
              .min(
                1,
                $t('ui.formRules.required', [
                  $t('rule-chain.actionUi.tableColumn'),
                ]),
              ),
          },
        ],
        arrayProps: {
          showIndex: false,
          addButtonText: $t('rule-chain.config.addRow'),
          emptyText: $t('rule-chain.config.noRows'),
          actionText: $t('tb.common.actions'),
        },
        rules: 'required',
      },
      hint('_mappingHelp', $t('rule-chain.actionUi.customMappingHelp')),
    ]),
    {
      fieldName: 'configuration.defaultTtl',
      label: $t('rule-chain.nodeAction.defaultTtl'),
      description: $t('rule-chain.actionUi.ttlZeroHelp'),
      help: $t('rule-chain.nodeAction.defaultTtlHelp'),
      formItemClass: 'sm:col-span-2',
      component: 'InputNumber',
      rules: z.number().int().min(0),
      componentProps: { min: 0, precision: 0, step: 1 },
    },
  ];
}

export const definition = {
  createSchema,
  ...createMappingHandlers('fieldsMapping'),
} satisfies NodeFormDefinition;
