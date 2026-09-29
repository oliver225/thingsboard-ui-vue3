import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { toCredentials, validateCredentials } from '../shared/configuration';
import { createCredentialsFields } from '../shared/credentials-fields';
import { requiredText } from '../shared/form-fields';
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
          fieldName: 'configuration.parseToPlainText',
          label: $t('rule-chain.nodeAction.parseToPlainText'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t('rule-chain.config.descriptions.parseToPlainText'),
            title: $t('rule-chain.nodeAction.parseToPlainText'),
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
        fieldName: 'configuration.connectTimeoutSec',
        label: $t('rule-chain.config.connectTimeoutSec'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(1).max(200),
        componentProps: { min: 1, max: 200, precision: 0, step: 1 },
      },
      {
        fieldName: 'configuration.clientId',
        label: $t('rule-chain.nodeAction.clientId'),
        help: $t('rule-chain.nodeAction.clientIdHelp'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenInput',
        modelPropName: 'modelValue',
      },
      {
        fieldName: 'configuration.appendClientIdSuffix',
        label: $t('rule-chain.nodeAction.appendClientIdSuffix'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: {
          description: $t(
            'rule-chain.config.descriptions.appendClientIdSuffix',
          ),
          title: $t('rule-chain.nodeAction.appendClientIdSuffix'),
        },
      },
      {
        fieldName: 'configuration.protocolVersion',
        label: $t('rule-chain.config.protocolVersion'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: [
            { value: 'MQTT_3_1', label: 'MQTT 3.1' },
            { value: 'MQTT_3_1_1', label: 'MQTT 3.1.1' },
            { value: 'MQTT_5', label: 'MQTT 5.0' },
          ],
        },
      },
    ]),
    section(
      '_credentials',
      $t('rule-chain.externalUi.authentication'),
      [
        {
          fieldName: 'configuration.ssl',
          label: $t('rule-chain.config.ssl'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.config.ssl') },
        },
        ...createCredentialsFields(),
      ],
      { collapsible: true },
    ),
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
        {
          fieldName: 'configuration.cleanSession',
          label: $t('rule-chain.nodeAction.cleanSession'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.nodeAction.cleanSession') },
        },
        {
          fieldName: 'configuration.retainedMessage',
          label: $t('rule-chain.config.retainedMessage'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.config.retainedMessage') },
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
      credentials: toCredentials(configuration.credentials),
    };
  },
  validate(configuration) {
    return validateCredentials(configuration.credentials);
  },
} satisfies NodeFormDefinition;
