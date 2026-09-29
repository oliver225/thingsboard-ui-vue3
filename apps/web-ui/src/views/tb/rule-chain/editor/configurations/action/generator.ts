import type { NodeFormData, NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { VbenSegmented } from '@vben/common-ui';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section } from '../shared/form-layout';
import ScriptInput from '../shared/script-input.vue';

export function createSchema(context: NodeFormData): VbenFormSchema[] {
  return [
    section('_generation', $t('rule-chain.actionUi.generationParameters'), [
      {
        fieldName: 'configuration.msgCount',
        label: $t('rule-chain.config.msgCount'),
        description: $t('rule-chain.actionUi.messageCountHelp'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(0),
        componentProps: { min: 0, precision: 0, step: 1 },
      },
      {
        fieldName: 'configuration.periodInSeconds',
        label: $t('rule-chain.nodeAction.periodInSeconds'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(1),
        componentProps: { min: 1 },
      },
    ]),
    section('_originator', $t('rule-chain.actionUi.originator'), [
      {
        fieldName: 'configuration.originatorType',
        label: $t('rule-chain.config.originatorType'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
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
            'RULE_NODE',
          ].map((value) => ({
            value,
            label: $t(`rule-chain.config.options.${value}`),
          })),
        },
        rules: 'selectRequired',
      },
      {
        fieldName: 'configuration.originatorId',
        label: $t('rule-chain.config.originatorId'),
        formItemClass: 'sm:col-span-1',
        component: 'EntityInput',
        dependencies: {
          triggerFields: ['configuration.originatorType'],
          resolve: ({ values: { configuration = {} } }) => ({
            if:
              !!configuration.originatorType &&
              !['RULE_NODE', 'TENANT'].includes(configuration.originatorType),
            componentProps: { entityType: configuration?.originatorType },
          }),
        },
        rules: 'selectRequired',
      },
    ]),
    section(
      '_function',
      $t('rule-chain.actionUi.generatorFunction'),
      [
        {
          fieldName: 'configuration.scriptLang',
          label: $t('rule-chain.config.scriptLang'),
          hideLabel: true,
          formItemClass: 'sm:col-span-2',
          component: VbenSegmented,
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            class: 'mx-auto w-full max-w-xs p-[2px]',
            'aria-label': $t('rule-chain.config.scriptLang'),
            tabs: [
              { label: 'JavaScript', value: 'JS' },
              { label: 'TBEL', value: 'TBEL' },
            ],
          },
        },
        {
          fieldName: 'configuration.jsScript',
          label: $t('rule-chain.config.jsScript'),
          formItemClass: 'sm:col-span-2',
          component: ScriptInput,
          hideLabel: true,
          modelPropName: 'modelValue',
          componentProps: {
            functionName: 'Generate',
            functionArgs: ['prevMsg', 'prevMetadata', 'prevMsgType'],
            language: 'JS',
            scriptType: 'generate',
            nodeId: context.data?.id?.id,
          },
          rules: 'required',
          dependencies: {
            triggerFields: ['configuration.scriptLang'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: configuration.scriptLang === 'JS',
            }),
          },
        },
        {
          fieldName: 'configuration.tbelScript',
          label: $t('rule-chain.config.tbelScript'),
          formItemClass: 'sm:col-span-2',
          component: ScriptInput,
          hideLabel: true,
          modelPropName: 'modelValue',
          componentProps: {
            functionName: 'Generate',
            functionArgs: ['prevMsg', 'prevMetadata', 'prevMsgType'],
            language: 'TBEL',
            scriptType: 'generate',
            nodeId: context.data?.id?.id,
          },
          rules: 'required',
          dependencies: {
            triggerFields: ['configuration.scriptLang'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: configuration.scriptLang !== 'JS',
            }),
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
    return {
      ...configuration,
      originatorType: configuration.originatorType ?? 'RULE_NODE',
      scriptLang: configuration.scriptLang || 'JS',
    };
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      originatorId: ['RULE_NODE', 'TENANT'].includes(
        configuration.originatorType,
      )
        ? null
        : configuration.originatorId,
    };
  },
} satisfies NodeFormDefinition;
