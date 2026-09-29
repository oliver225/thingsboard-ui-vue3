import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { createMappingHandlers } from '../shared/configuration';
import { mappingField, requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_message',
      $t('rule-chain.externalUi.message'),
      [
        {
          fieldName: 'configuration.topicPattern',
          label: $t('rule-chain.nodeAction.topicPattern'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.nodeAction.topicPattern'),
        },
        {
          fieldName: 'configuration.keyPattern',
          label: $t('rule-chain.nodeAction.keyPattern'),
          help: $t('rule-chain.nodeAction.keyPatternHelp'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
      ],
      { template: true },
    ),
    section('_connection', $t('rule-chain.externalUi.connection'), [
      {
        fieldName: 'configuration.bootstrapServers',
        label: $t('rule-chain.nodeAction.bootstrapServers'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: requiredText('rule-chain.nodeAction.bootstrapServers'),
      },
    ]),
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
        {
          fieldName: 'configuration.acks',
          label: $t('rule-chain.nodeAction.acks'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: ['0', '1', 'all'].map((value) => ({
              value,
              label: String(value),
            })),
          },
        },
        {
          fieldName: 'configuration.retries',
          label: $t('rule-chain.nodeAction.retries'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).nullish(),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.batchSize',
          label: $t('rule-chain.nodeAction.batchSize'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).nullish(),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.linger',
          label: $t('rule-chain.nodeAction.linger'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).nullish(),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.bufferMemory',
          label: $t('rule-chain.nodeAction.bufferMemory'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).nullish(),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        mappingField(
          'configuration.otherProperties',
          'rule-chain.nodeAction.otherProperties',
        ),
        {
          fieldName: 'configuration.addMetadataKeyValuesAsKafkaHeaders',
          label: $t('rule-chain.config.addMetadataKeyValuesAsKafkaHeaders'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.addMetadataKeyValuesAsKafkaHeaders',
            ),
            title: $t('rule-chain.config.addMetadataKeyValuesAsKafkaHeaders'),
          },
        },
        {
          fieldName: 'configuration.kafkaHeadersCharset',
          label: $t('rule-chain.config.kafkaHeadersCharset'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: [
              'US-ASCII',
              'ISO-8859-1',
              'utf8',
              'UTF-16BE',
              'UTF-16LE',
              'UTF-16',
            ].map((value) => ({ value, label: String(value) })),
          },
          dependencies: {
            triggerFields: ['configuration.addMetadataKeyValuesAsKafkaHeaders'],
            resolve: ({ values: { configuration } }) => ({
              if: configuration.addMetadataKeyValuesAsKafkaHeaders === true,
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
  ...createMappingHandlers('otherProperties'),
} satisfies NodeFormDefinition;
