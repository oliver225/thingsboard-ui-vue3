import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_smtp', $t('rule-chain.externalUi.smtp'), [
      {
        fieldName: 'configuration.useSystemSmtpSettings',
        label: $t('rule-chain.nodeAction.useSystemSmtpSettings'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: {
          title: $t('rule-chain.nodeAction.useSystemSmtpSettings'),
        },
      },
      {
        fieldName: 'configuration.smtpProtocol',
        label: $t('rule-chain.config.smtpProtocol'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: ['smtp', 'smtps'].map((value) => ({
            value,
            label: String(value),
          })),
        },
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.smtpHost',
        label: $t('rule-chain.nodeAction.smtpHost'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: requiredText('rule-chain.nodeAction.smtpHost'),
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.smtpPort',
        label: $t('rule-chain.nodeAction.smtpPort'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(1).max(65_535),
        componentProps: { min: 1, max: 65_535, precision: 0, step: 1 },
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.timeout',
        label: $t('rule-chain.nodeAction.timeout'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(0),
        componentProps: { min: 0, precision: 0, step: 1 },
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.username',
        label: $t('rule-chain.nodeAction.username'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.password',
        label: $t('rule-chain.nodeAction.password'),
        formItemClass: 'sm:col-span-1',
        component: 'InputPassword',
        componentProps: { autocomplete: 'new-password' },
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.enableTls',
        label: $t('rule-chain.nodeAction.enableTls'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: { title: $t('rule-chain.nodeAction.enableTls') },
        dependencies: {
          triggerFields: ['configuration.useSystemSmtpSettings'],
          resolve: ({ values: { configuration } }) => ({
            if: !configuration.useSystemSmtpSettings,
          }),
        },
      },
      {
        fieldName: 'configuration.tlsVersion',
        label: $t('rule-chain.nodeAction.tlsVersion'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        componentProps: {
          options: ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'].map((value) => ({
            value,
            label: String(value),
          })),
        },
        dependencies: {
          triggerFields: [
            'configuration.enableTls',
            'configuration.useSystemSmtpSettings',
          ],
          resolve: ({ values: { configuration } }) => ({
            if: !!(
              !configuration.useSystemSmtpSettings && configuration.enableTls
            ),
          }),
        },
      },
    ]),
    {
      ...section('_proxy', $t('rule-chain.externalUi.proxy'), [
        {
          fieldName: 'configuration.enableProxy',
          label: $t('rule-chain.nodeAction.enableProxy'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.nodeAction.enableProxy') },
          dependencies: {
            triggerFields: ['configuration.useSystemSmtpSettings'],
            resolve: ({ values: { configuration } }) => ({
              if: !configuration.useSystemSmtpSettings,
            }),
          },
        },
        {
          fieldName: 'configuration.proxyHost',
          label: $t('rule-chain.nodeAction.proxyHost'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.nodeAction.proxyHost'),
          dependencies: {
            triggerFields: [
              'configuration.useSystemSmtpSettings',
              'configuration.enableProxy',
            ],
            resolve: ({ values: { configuration } }) => ({
              if: !!(
                !configuration.useSystemSmtpSettings &&
                configuration.enableProxy
              ),
            }),
          },
        },
        {
          fieldName: 'configuration.proxyPort',
          label: $t('rule-chain.nodeAction.proxyPort'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(1).max(65_535),
          componentProps: { min: 1, max: 65_535, precision: 0, step: 1 },
          dependencies: {
            triggerFields: [
              'configuration.useSystemSmtpSettings',
              'configuration.enableProxy',
            ],
            resolve: ({ values: { configuration } }) => ({
              if: !!(
                !configuration.useSystemSmtpSettings &&
                configuration.enableProxy
              ),
            }),
          },
        },
        {
          fieldName: 'configuration.proxyUser',
          label: $t('rule-chain.nodeAction.proxyUser'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          dependencies: {
            triggerFields: [
              'configuration.useSystemSmtpSettings',
              'configuration.enableProxy',
            ],
            resolve: ({ values: { configuration } }) => ({
              if: !!(
                !configuration.useSystemSmtpSettings &&
                configuration.enableProxy
              ),
            }),
          },
        },
        {
          fieldName: 'configuration.proxyPassword',
          label: $t('rule-chain.nodeAction.proxyPassword'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          componentProps: { autocomplete: 'new-password' },
          dependencies: {
            triggerFields: [
              'configuration.useSystemSmtpSettings',
              'configuration.enableProxy',
            ],
            resolve: ({ values: { configuration } }) => ({
              if: !!(
                !configuration.useSystemSmtpSettings &&
                configuration.enableProxy
              ),
            }),
          },
        },
      ]),
      dependencies: {
        triggerFields: ['configuration.useSystemSmtpSettings'],
        resolve: ({ values: { configuration } }) => ({
          if: !configuration.useSystemSmtpSettings,
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    return {
      ...configuration,
      proxyPort: configuration.proxyPort
        ? Number(configuration.proxyPort)
        : null,
    };
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      proxyPort:
        configuration.proxyPort === null ||
        configuration.proxyPort === undefined
          ? null
          : String(configuration.proxyPort),
    };
  },
} satisfies NodeFormDefinition;
