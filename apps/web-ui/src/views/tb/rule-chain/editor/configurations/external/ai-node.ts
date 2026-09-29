import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';
import ResponseFormatInput from '../shared/response-format-input.vue';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_model', $t('rule-chain.externalUi.model'), [
      {
        fieldName: 'configuration.modelId',
        label: $t('rule-chain.config.modelId'),
        formItemClass: 'sm:col-span-2',
        component: 'EntityInput',
        componentProps: { entityType: 'AI_MODEL', objectId: true },
        rules: 'selectRequired',
      },
    ]),
    section(
      '_prompts',
      $t('rule-chain.externalUi.prompts'),
      [
        {
          fieldName: 'configuration.systemPrompt',
          label: $t('rule-chain.config.systemPrompt'),
          formItemClass: 'sm:col-span-2',
          component: 'Textarea',
          componentProps: { rows: 4, maxlength: 500_000 },
          rules: z.string().max(500_000).optional(),
        },
        {
          fieldName: 'configuration.userPrompt',
          label: $t('rule-chain.config.userPrompt'),
          formItemClass: 'sm:col-span-2',
          component: 'Textarea',
          rules: requiredText('rule-chain.config.userPrompt').max(500_000),
          componentProps: { rows: 4, maxlength: 500_000 },
        },
        {
          fieldName: 'configuration.resourceIds',
          label: $t('rule-chain.config.resourceIds'),
          formItemClass: 'sm:col-span-2',
          component: 'EntityInput',
          componentProps: { entityType: 'TB_RESOURCE', multiple: true },
        },
      ],
      {
        collapsible: true,
        template: true,
      },
    ),
    section('_response', $t('rule-chain.externalUi.response'), [
      {
        fieldName: 'configuration.responseFormat.type',
        label: $t('rule-chain.config.responseFormat_type'),
        formItemClass: 'sm:col-span-2',
        component: ResponseFormatInput,
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        dependencies: {
          triggerFields: ['configuration.modelId'],
          resolve: ({ values: { configuration } }) => ({
            componentProps: { modelId: configuration.modelId },
          }),
        },
      },
      {
        fieldName: 'configuration.responseFormat.schema',
        label: $t('rule-chain.config.responseFormat_schema'),
        formItemClass: 'sm:col-span-2',
        component: 'JsonEditor',
        componentProps: { height: 220 },
        rules: 'jsonObjectRequired',
        dependencies: {
          triggerFields: ['configuration.responseFormat.type'],
          resolve: ({ values: { configuration } }) => ({
            if: configuration.responseFormat?.type === 'JSON_SCHEMA',
          }),
        },
      },
    ]),
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
        {
          fieldName: 'configuration.timeoutSeconds',
          label: $t('rule-chain.config.timeoutSeconds'),
          formItemClass: 'sm:col-span-2',
          component: 'SecondsInput',
          rules: z.number().int().min(1).max(600),
          componentProps: { min: 1, max: 600, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.forceAck',
          label: $t('rule-chain.config.forceAck'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t('rule-chain.config.descriptions.forceAck'),
            title: $t('rule-chain.config.forceAck'),
          },
        },
      ],
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    configuration = {
      ...configuration,
      responseFormat: {
        ...configuration.responseFormat,
        schema: JSON.stringify(
          configuration.responseFormat?.schema ?? {},
          null,
          2,
        ),
      },
    };
    return configuration;
  },
  toConfiguration(configuration) {
    if (configuration.responseFormat?.type === 'JSON_SCHEMA')
      configuration = {
        ...configuration,
        responseFormat: {
          ...configuration.responseFormat,
          schema: JSON.parse(configuration.responseFormat.schema),
        },
      };
    const responseFormat = { ...configuration.responseFormat };
    if (responseFormat.type !== 'JSON_SCHEMA') delete responseFormat.schema;
    if (!configuration.systemPrompt?.trim()) delete configuration.systemPrompt;
    return { ...configuration, responseFormat };
  },
} satisfies NodeFormDefinition;
