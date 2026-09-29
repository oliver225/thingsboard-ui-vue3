import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { createMappingHandlers } from '../shared/configuration';
import FileTextInput from '../shared/file-text-input.vue';
import { mappingField, requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_message',
      $t('rule-chain.externalUi.message'),
      [
        {
          fieldName: 'configuration.projectId',
          label: $t('rule-chain.config.projectId'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.config.projectId'),
        },
        {
          fieldName: 'configuration.topicName',
          label: $t('rule-chain.nodeAction.topicName'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: requiredText('rule-chain.nodeAction.topicName'),
        },
        mappingField(
          'configuration.messageAttributes',
          'rule-chain.config.messageAttributes',
        ),
      ],
      { template: true },
    ),
    section(
      '_credentials',
      $t('rule-chain.externalUi.authentication'),
      [
        {
          fieldName: 'configuration.serviceAccountKey',
          label: $t('rule-chain.config.serviceAccountKey'),
          formItemClass: 'sm:col-span-2',
          component: FileTextInput,
          modelPropName: 'modelValue',
          componentProps: { json: true },
          rules: 'jsonObjectRequired',
          dependencies: {
            triggerFields: ['configuration.serviceAccountKeyFileName'],
            resolve: ({ values: { configuration }, controller }) => ({
              componentProps: {
                fileName: configuration.serviceAccountKeyFileName,
                onSelect: (name: string) =>
                  controller.setFieldValue(
                    'configuration.serviceAccountKeyFileName',
                    name,
                  ),
              },
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
  ...createMappingHandlers('messageAttributes'),
} satisfies NodeFormDefinition;
