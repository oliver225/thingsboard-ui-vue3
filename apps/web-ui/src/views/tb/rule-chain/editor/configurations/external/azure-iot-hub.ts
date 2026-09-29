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
      ],
      { template: true },
    ),
    section('_connection', $t('rule-chain.externalUi.connection'), [
      {
        fieldName: 'configuration.host',
        label: $t('rule-chain.nodeAction.host'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: requiredText('rule-chain.nodeAction.host'),
      },
      {
        fieldName: 'configuration.clientId',
        label: $t('rule-chain.externalUi.deviceId'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: requiredText('rule-chain.externalUi.deviceId'),
      },
      {
        fieldName: 'configuration.protocolVersion',
        label: $t('rule-chain.config.protocolVersion'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: [{ value: 'MQTT_3_1_1', label: 'MQTT 3.1.1' }],
        },
      },
    ]),
    section(
      '_credentials',
      $t('rule-chain.externalUi.authentication'),
      createCredentialsFields({ azure: true }),
      { collapsible: true },
    ),
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
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
          fieldName: 'configuration.cleanSession',
          label: $t('rule-chain.nodeAction.cleanSession'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.nodeAction.cleanSession') },
        },
        {
          fieldName: 'configuration.ssl',
          label: $t('rule-chain.config.ssl'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.config.ssl') },
        },
      ],
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
  toConfiguration(configuration) {
    const credentials = configuration.credentials;
    return {
      ...configuration,
      credentials:
        credentials.type === 'sas'
          ? {
              type: 'sas',
              sasKey: credentials.sasKey,
              caCert: credentials.caCert,
              caCertFileName: credentials.caCertFileName,
            }
          : toCredentials(credentials),
    };
  },
  validate(configuration) {
    return validateCredentials(configuration.credentials);
  },
} satisfies NodeFormDefinition;
