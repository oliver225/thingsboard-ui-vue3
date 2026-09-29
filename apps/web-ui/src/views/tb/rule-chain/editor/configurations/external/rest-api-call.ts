import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import {
  toCredentials,
  toMapping,
  toMappingRows,
  validateCredentials,
  validateMapping,
} from '../shared/configuration';
import { createCredentialsFields } from '../shared/credentials-fields';
import { mappingField, requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_request',
      $t('rule-chain.externalUi.request'),
      [
        {
          fieldName: 'configuration.restEndpointUrlPattern',
          label: $t('rule-chain.config.restEndpointUrlPattern'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.restEndpointUrlPattern'),
        },
        {
          fieldName: 'configuration.requestMethod',
          label: $t('rule-chain.nodeAction.requestMethod'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: [
              'GET',
              'POST',
              'PUT',
              'DELETE',
              'PATCH',
              'HEAD',
              'OPTIONS',
            ].map((value) => ({ value, label: String(value) })),
          },
        },
        mappingField('configuration.headers', 'rule-chain.config.headers'),
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
        {
          fieldName: 'configuration.ignoreRequestBody',
          label: $t('rule-chain.nodeAction.ignoreRequestBody'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            title: $t('rule-chain.nodeAction.ignoreRequestBody'),
          },
        },
      ],
      { template: true },
    ),
    section('_proxy', $t('rule-chain.externalUi.proxy'), [
      {
        fieldName: 'configuration.enableProxy',
        label: $t('rule-chain.nodeAction.enableProxy'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: { title: $t('rule-chain.nodeAction.enableProxy') },
      },
      {
        fieldName: 'configuration.useSystemProxyProperties',
        label: $t('rule-chain.nodeAction.useSystemProxyProperties'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: {
          title: $t('rule-chain.nodeAction.useSystemProxyProperties'),
        },
        dependencies: {
          triggerFields: ['configuration.enableProxy'],
          resolve: ({ values: { configuration } }) => ({
            if: configuration.enableProxy === true,
          }),
        },
      },
      {
        fieldName: 'configuration.proxyScheme',
        label: $t('rule-chain.nodeAction.proxyScheme'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        componentProps: {
          options: ['http', 'https'].map((value) => ({
            value,
            label: String(value),
          })),
        },
        dependencies: {
          triggerFields: [
            'configuration.useSystemProxyProperties',
            'configuration.enableProxy',
          ],
          resolve: ({ values: { configuration } }) => ({
            if: !!(
              configuration.enableProxy &&
              !configuration.useSystemProxyProperties
            ),
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
            'configuration.useSystemProxyProperties',
            'configuration.enableProxy',
          ],
          resolve: ({ values: { configuration } }) => ({
            if: !!(
              configuration.enableProxy &&
              !configuration.useSystemProxyProperties
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
            'configuration.useSystemProxyProperties',
            'configuration.enableProxy',
          ],
          resolve: ({ values: { configuration } }) => ({
            if: !!(
              configuration.enableProxy &&
              !configuration.useSystemProxyProperties
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
            'configuration.useSystemProxyProperties',
            'configuration.enableProxy',
          ],
          resolve: ({ values: { configuration } }) => ({
            if: !!(
              configuration.enableProxy &&
              !configuration.useSystemProxyProperties
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
            'configuration.useSystemProxyProperties',
            'configuration.enableProxy',
          ],
          resolve: ({ values: { configuration } }) => ({
            if: !!(
              configuration.enableProxy &&
              !configuration.useSystemProxyProperties
            ),
          }),
        },
      },
    ]),
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
        {
          fieldName: 'configuration.useSimpleClientHttpFactory',
          label: $t('rule-chain.nodeAction.useSimpleClientHttpFactory'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            title: $t('rule-chain.nodeAction.useSimpleClientHttpFactory'),
          },
          dependencies: {
            triggerFields: ['configuration.enableProxy'],
            resolve: ({ values: { configuration }, controller }) => ({
              if: !configuration.enableProxy,
              componentProps: {
                onChange: (checked: boolean) => {
                  if (checked && configuration.credentials?.type === 'cert.PEM')
                    controller.setFieldValue(
                      'configuration.credentials.type',
                      'anonymous',
                    );
                },
              },
            }),
          },
        },
        {
          fieldName: 'configuration.readTimeoutMs',
          label: $t('rule-chain.config.readTimeoutMs'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).max(2_147_483_647).nullish(),
          componentProps: { min: 0, max: 2_147_483_647, precision: 0, step: 1 },
          dependencies: {
            triggerFields: [
              'configuration.useSimpleClientHttpFactory',
              'configuration.enableProxy',
            ],
            resolve: ({ values: { configuration } }) => ({
              if:
                !configuration.useSimpleClientHttpFactory ||
                configuration.enableProxy,
            }),
          },
        },
        {
          fieldName: 'configuration.maxParallelRequestsCount',
          label: $t('rule-chain.nodeAction.maxParallelRequestsCount'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).max(2_147_483_647).nullish(),
          componentProps: { min: 0, max: 2_147_483_647, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.maxInMemoryBufferSizeInKb',
          label: $t('rule-chain.config.maxInMemoryBufferSizeInKb'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(1).max(25_000).nullish(),
          componentProps: { min: 1, max: 25_000, precision: 0, step: 1 },
        },
      ],
      { collapsible: true },
    ),
    section(
      '_credentials',
      $t('rule-chain.externalUi.authentication'),
      createCredentialsFields({ rest: true }),
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    return {
      ...configuration,
      headers: toMappingRows(configuration.headers),
    };
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      headers: toMapping(configuration.headers),
      credentials: toCredentials(configuration.credentials),
    };
  },
  validate(configuration) {
    return [
      ...validateMapping(configuration.headers, 'configuration.headers'),
      ...validateCredentials(configuration.credentials),
    ];
  },
} satisfies NodeFormDefinition;
