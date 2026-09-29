import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { VbenSegmented } from '@vben/common-ui';

import { Alert } from 'antdv-next';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section } from '../shared/form-layout';
import OutputMessageType from '../shared/output-message-type.vue';

function createFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.interval',
      label: $t('rule-chain.nodeAction.interval'),
      formItemClass: 'sm:col-span-2',
      component: 'SecondsInput',
      rules: z.number().int().min(1),
      componentProps: { min: 1, precision: 0, step: 1 },
    },
    {
      fieldName: 'configuration.strategy',
      label: $t('rule-chain.nodeAction.strategy'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: VbenSegmented,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        class: 'w-full p-[2px]',
        'aria-label': $t('rule-chain.nodeAction.strategy'),
        tabs: ['FIRST', 'LAST', 'ALL'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
    },
    {
      fieldName: '_deduplicationStrategyHelp',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: Alert,
      componentProps: { type: 'warning', showIcon: true },
      dependencies: {
        triggerFields: ['configuration.strategy'],
        resolve: ({ values: { configuration } }) => {
          let key = 'rule-chain.nodeAction.firstStrategyHelp';
          if (configuration?.strategy === 'ALL')
            key = 'rule-chain.nodeAction.allStrategyHelp';
          if (configuration?.strategy === 'LAST')
            key = 'rule-chain.nodeAction.lastStrategyHelp';
          return { componentProps: { message: $t(key) } };
        },
      },
    },
    {
      fieldName: 'configuration.outMsgType',
      label: $t('rule-chain.nodeAction.outputMessageType'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: OutputMessageType,
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.outMsgType'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [$t('rule-chain.config.outMsgType')]),
        ),
      dependencies: {
        triggerFields: ['configuration.strategy'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.strategy === 'ALL',
        }),
      },
    },
    {
      fieldName: 'configuration.maxPendingMsgs',
      label: $t('rule-chain.nodeAction.maxPendingMsgs'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      help: $t('rule-chain.config.maxPendingMsgsHelp'),
      rules: z.number().int().min(1).max(1000),
      componentProps: { min: 1, max: 1000, precision: 0, step: 1 },
    },
    {
      fieldName: 'configuration.maxRetries',
      label: $t('rule-chain.nodeAction.maxRetries'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      help: $t('rule-chain.config.maxRetriesHelp'),
      rules: z.number().int().min(0).max(100),
      componentProps: { min: 0, max: 100, precision: 0, step: 1 },
    },
  ];
}

export function createSchema(): VbenFormSchema[] {
  const fields = createFields();
  const advancedFieldNames = new Set([
    'configuration.maxPendingMsgs',
    'configuration.maxRetries',
  ]);
  const sections = [
    {
      fieldName: '_deduplicationStrategy',
      title: $t('rule-chain.nodeAction.strategy'),
      collapsible: false,
      fields: fields.filter(
        (field) =>
          field.fieldName !== 'configuration.interval' &&
          !advancedFieldNames.has(field.fieldName),
      ),
    },
    {
      fieldName: '_deduplicationAdvanced',
      title: $t('rule-chain.nodeAction.advancedSettings'),
      collapsible: true,
      fields: fields.filter((field) => advancedFieldNames.has(field.fieldName)),
    },
  ];
  return [
    ...fields.filter((field) => field.fieldName === 'configuration.interval'),
    ...sections.map(
      ({ fieldName, title, collapsible, fields }): VbenFormSchema =>
        section(fieldName, title, fields, { collapsible }),
    ),
  ];
}

export const definition = {
  hasQueue: true,
  createSchema,
  getValues(configuration) {
    return {
      ...configuration,
      outMsgType: configuration.outMsgType || 'POST_TELEMETRY_REQUEST',
    };
  },
} satisfies NodeFormDefinition;
