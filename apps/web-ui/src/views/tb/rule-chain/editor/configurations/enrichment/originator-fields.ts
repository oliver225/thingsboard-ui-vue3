import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { createMappingHandlers } from '../shared/configuration';
import {
  allowedEntityFields,
  getEntityFieldOptions,
} from '../shared/entity-fields';
import { createFetchToField } from '../shared/fetch-to-field';
import { templateHint } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.dataMapping',
      label: $t('rule-chain.config.dataMapping'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      type: 'array',
      children: [
        {
          fieldName: 'key',
          label: $t('rule-chain.nodeAction.sourceField'),
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          componentProps: {
            options: getEntityFieldOptions(),
          },
          rules: z.enum(allowedEntityFields, {
            error: $t('ui.formRules.selectRequired', [
              $t('rule-chain.nodeAction.sourceField'),
            ]),
          }),
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
        addButtonText: $t('rule-chain.config.addRow'),
        emptyText: $t('rule-chain.config.noRows'),
        actionText: $t('tb.common.actions'),
      },
      rules: 'required',
    },
    templateHint(
      '_originatorFieldsMappingHelp',
      $t('rule-chain.templateSyntax.targetFields'),
    ),
    {
      fieldName: 'configuration.ignoreNullStrings',
      label: $t('rule-chain.config.ignoreNullStrings'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.ignoreNullStrings'),
        title: $t('rule-chain.config.ignoreNullStrings'),
      },
    },
    createFetchToField(
      $t('rule-chain.nodeAction.addMappedOriginatorFieldsTo'),
      'selectRequired',
    ),
  ];
}

export const definition = {
  get title() {
    return $t('rule-chain.nodeAction.originatorFieldsMapping');
  },
  createSchema,
  ...createMappingHandlers('dataMapping'),
} satisfies NodeFormDefinition;
