import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

function providerFields(
  type: 'AWS_SNS' | 'SMPP' | 'TWILIO',
  fields: VbenFormSchema[],
): VbenFormSchema[] {
  return fields.map((field) => ({
    ...field,
    dependencies: {
      triggerFields: [
        'configuration.useSystemSmsSettings',
        'configuration.smsProviderConfiguration.type',
      ],
      resolve: ({ values: { configuration } }) => ({
        if:
          !configuration.useSystemSmsSettings &&
          configuration.smsProviderConfiguration?.type === type,
      }),
    },
  }));
}

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_message',
      $t('rule-chain.externalUi.message'),
      [
        {
          fieldName: 'configuration.numbersToTemplate',
          label: $t('rule-chain.config.numbersToTemplate'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.numbersToTemplate'),
        },
        {
          fieldName: 'configuration.smsMessageTemplate',
          label: $t('rule-chain.nodeAction.smsMessageTemplate'),
          formItemClass: 'sm:col-span-2',
          component: 'Textarea',
          rules: requiredText('rule-chain.nodeAction.smsMessageTemplate'),
          componentProps: { rows: 4 },
        },
      ],
      { template: true },
    ),
    section('_smsProvider', $t('rule-chain.externalUi.smsProvider'), [
      {
        fieldName: 'configuration.useSystemSmsSettings',
        label: $t('rule-chain.config.useSystemSmsSettings'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: { title: $t('rule-chain.config.useSystemSmsSettings') },
      },
      {
        fieldName: 'configuration.smsProviderConfiguration.type',
        label: $t('rule-chain.config.smsProviderConfiguration_type'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: [
            { value: 'AWS_SNS', label: 'AWS SNS' },
            { value: 'TWILIO', label: 'Twilio' },
            { value: 'SMPP', label: 'SMPP' },
          ],
        },
        dependencies: {
          triggerFields: ['configuration.useSystemSmsSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmsSettings,
          }),
        },
      },
      ...providerFields('AWS_SNS', [
        {
          fieldName: 'configuration.smsProviderConfiguration.accessKeyId',
          label: $t('rule-chain.config.smsProviderConfiguration_accessKeyId'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_accessKeyId',
          ),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.secretAccessKey',
          label: $t(
            'rule-chain.config.smsProviderConfiguration_secretAccessKey',
          ),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_secretAccessKey',
          ),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.region',
          label: $t('rule-chain.config.smsProviderConfiguration_region'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_region',
          ),
        },
      ]),
      ...providerFields('TWILIO', [
        {
          fieldName: 'configuration.smsProviderConfiguration.accountSid',
          label: $t('rule-chain.config.smsProviderConfiguration_accountSid'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_accountSid',
          ),
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.accountToken',
          label: $t('rule-chain.config.smsProviderConfiguration_accountToken'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_accountToken',
          ),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.numberFrom',
          label: $t('rule-chain.config.smsProviderConfiguration_numberFrom'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_numberFrom',
          ),
        },
      ]),
      ...providerFields('SMPP', [
        {
          fieldName: 'configuration.smsProviderConfiguration.host',
          label: $t('rule-chain.config.smsProviderConfiguration_host'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_host',
          ),
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.port',
          label: $t('rule-chain.config.smsProviderConfiguration_port'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(1).max(65_535),
          componentProps: { min: 1, max: 65_535, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.systemId',
          label: $t('rule-chain.config.smsProviderConfiguration_systemId'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_systemId',
          ),
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.password',
          label: $t('rule-chain.config.smsProviderConfiguration_password'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_password',
          ),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.systemType',
          label: $t('rule-chain.config.smsProviderConfiguration_systemType'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.bindType',
          label: $t('rule-chain.config.smsProviderConfiguration_bindType'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: ['TX', 'RX', 'TRX'].map((value) => ({
              value,
              label: String(value),
            })),
          },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.protocolVersion',
          label: $t(
            'rule-chain.config.smsProviderConfiguration_protocolVersion',
          ),
          formItemClass: 'sm:col-span-1',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: [3.3, 3.4].map((value) => ({
              value,
              label: String(value),
            })),
          },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.sourceAddress',
          label: $t('rule-chain.config.smsProviderConfiguration_sourceAddress'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText(
            'rule-chain.config.smsProviderConfiguration_sourceAddress',
          ),
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.sourceTon',
          label: $t('rule-chain.config.smsProviderConfiguration_sourceTon'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.sourceNpi',
          label: $t('rule-chain.config.smsProviderConfiguration_sourceNpi'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.destinationTon',
          label: $t(
            'rule-chain.config.smsProviderConfiguration_destinationTon',
          ),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.destinationNpi',
          label: $t(
            'rule-chain.config.smsProviderConfiguration_destinationNpi',
          ),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.addressRange',
          label: $t('rule-chain.config.smsProviderConfiguration_addressRange'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.serviceType',
          label: $t('rule-chain.config.smsProviderConfiguration_serviceType'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.smsProviderConfiguration.codingScheme',
          label: $t('rule-chain.config.smsProviderConfiguration_codingScheme'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
      ]),
    ]),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
