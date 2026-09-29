import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_message',
      $t('rule-chain.externalUi.message'),
      [
        {
          fieldName: 'configuration.topicArnPattern',
          label: $t('rule-chain.config.topicArnPattern'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.topicArnPattern'),
        },
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
} satisfies NodeFormDefinition;
