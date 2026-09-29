import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_function',
      $t('rule-chain.externalUi.function'),
      [
        {
          fieldName: 'configuration.functionName',
          label: $t('rule-chain.config.functionName'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.functionName'),
        },
        {
          fieldName: 'configuration.qualifier',
          label: $t('rule-chain.config.qualifier'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
      ],
      { template: true },
    ),
    section(
      '_awsCredentials',
      $t('rule-chain.externalUi.awsCredentials'),
      [
        {
          fieldName: 'configuration.accessKey',
          label: $t('rule-chain.config.accessKey'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText('rule-chain.config.accessKey'),
          componentProps: { autocomplete: 'new-password' },
        },
        {
          fieldName: 'configuration.secretKey',
          label: $t('rule-chain.config.secretKey'),
          formItemClass: 'sm:col-span-1',
          component: 'InputPassword',
          rules: requiredText('rule-chain.config.secretKey'),
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
    section(
      '_advanced',
      $t('rule-chain.externalUi.advanced'),
      [
        {
          fieldName: 'configuration.connectionTimeout',
          label: $t('rule-chain.config.connectionTimeout'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.requestTimeout',
          label: $t('rule-chain.config.requestTimeout'),
          formItemClass: 'sm:col-span-1',
          component: 'InputNumber',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
        },
        {
          fieldName: 'configuration.tellFailureIfFuncThrowsExc',
          label: $t('rule-chain.config.tellFailureIfFuncThrowsExc'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.tellFailureIfFuncThrowsExc',
            ),
            title: $t('rule-chain.config.tellFailureIfFuncThrowsExc'),
          },
        },
      ],
      { collapsible: true },
    ),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
