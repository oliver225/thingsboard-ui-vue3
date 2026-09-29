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
          fieldName: 'configuration.exchangeNamePattern',
          label: $t('rule-chain.nodeAction.exchangeNamePattern'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.routingKeyPattern',
          label: $t('rule-chain.nodeAction.routingKeyPattern'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.messageProperties',
          label: $t('rule-chain.nodeAction.messageProperties'),
          formItemClass: 'sm:col-span-2',
          component: 'Select',
          componentProps: {
            allowClear: true,
            options: [
              'BASIC',
              'TEXT_PLAIN',
              'MINIMAL_BASIC',
              'MINIMAL_PERSISTENT_BASIC',
              'PERSISTENT_BASIC',
              'PERSISTENT_TEXT_PLAIN',
            ].map((value) => ({ value, label: value })),
          },
        },
      ],
      { template: true },
    ),
    section('_connection', $t('rule-chain.externalUi.connection'), [
      {
        fieldName: 'configuration.host',
        label: $t('rule-chain.nodeAction.host'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: requiredText('rule-chain.nodeAction.host'),
      },
      {
        fieldName: 'configuration.port',
        label: $t('rule-chain.nodeAction.port'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(1).max(65_535),
        componentProps: { min: 1, max: 65_535, precision: 0, step: 1 },
      },
      {
        fieldName: 'configuration.virtualHost',
        label: $t('rule-chain.nodeAction.virtualHost'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenInput',
        modelPropName: 'modelValue',
      },
    ]),
    section(
      '_credentials',
      $t('rule-chain.externalUi.authentication'),
      [
        {
          fieldName: 'configuration.username',
          label: $t('rule-chain.nodeAction.username'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.password',
          label: $t('rule-chain.nodeAction.password'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          componentProps: { autocomplete: 'new-password' },
        },
      ],
      { collapsible: true },
    ),
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
        {
          fieldName: 'configuration.automaticRecoveryEnabled',
          label: $t('rule-chain.config.automaticRecoveryEnabled'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            title: $t('rule-chain.config.automaticRecoveryEnabled'),
          },
        },
        {
          fieldName: 'configuration.connectionTimeout',
          label: $t('rule-chain.config.connectionTimeout'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).nullish(),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.handshakeTimeout',
          label: $t('rule-chain.nodeAction.handshakeTimeout'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).nullish(),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        mappingField(
          'configuration.clientProperties',
          'rule-chain.nodeAction.clientProperties',
        ),
      ],
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
  ...createMappingHandlers('clientProperties'),
} satisfies NodeFormDefinition;
