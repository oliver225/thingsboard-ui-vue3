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
          fieldName: 'configuration.queueType',
          label: $t('rule-chain.config.queueType'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: ['STANDARD', 'FIFO'].map((value) => ({
              value,
              label: $t(`rule-chain.config.options.${value}`),
            })),
          },
        },
        {
          fieldName: 'configuration.queueUrlPattern',
          label: $t('rule-chain.config.queueUrlPattern'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.queueUrlPattern'),
        },
        {
          fieldName: 'configuration.delaySeconds',
          label: $t('rule-chain.config.delaySeconds'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0).max(900).nullish(),
          componentProps: { min: 0, max: 900, precision: 0, step: 1 },
          dependencies: {
            triggerFields: ['configuration.queueType'],
            resolve: ({ values: { configuration } }) => ({
              if: configuration.queueType === 'STANDARD',
            }),
          },
        },
        mappingField(
          'configuration.messageAttributes',
          'rule-chain.config.messageAttributes',
        ),
      ],
      { template: true },
    ),
    section(
      '_awsCredentials',
      $t('rule-chain.externalUi.awsCredentials'),
      [
        {
          fieldName: 'configuration.accessKeyId',
          label: $t('rule-chain.config.accessKeyId'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText('rule-chain.config.accessKeyId'),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.secretAccessKey',
          label: $t('rule-chain.config.secretAccessKey'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText('rule-chain.config.secretAccessKey'),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.region',
          label: $t('rule-chain.config.region'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.region'),
        },
      ],
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
  ...createMappingHandlers('messageAttributes'),
} satisfies NodeFormDefinition;
