import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { requiredText } from '../shared/form-fields';
import { section } from '../shared/form-layout';
import SlackConversationInput from '../shared/slack-conversation-input.vue';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_credentials',
      $t('rule-chain.externalUi.authentication'),
      [
        {
          fieldName: 'configuration.useSystemSettings',
          label: $t('rule-chain.config.useSystemSettings'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.config.useSystemSettings') },
        },
        {
          fieldName: 'configuration.botToken',
          label: $t('rule-chain.config.botToken'),
          formItemClass: 'sm:col-span-2',
          component: 'InputPassword',
          rules: requiredText('rule-chain.config.botToken'),
          componentProps: { autocomplete: 'new-password' },
          dependencies: {
            triggerFields: ['configuration.useSystemSettings'],
            resolve: ({ values: { configuration } }) => ({
              if: !configuration.useSystemSettings,
            }),
          },
        },
      ],
      { collapsible: true },
    ),
    section(
      '_message',
      $t('rule-chain.externalUi.message'),
      [
        {
          fieldName: 'configuration.conversationType',
          label: $t('rule-chain.config.conversationType'),
          formItemClass: 'sm:col-span-2',
          component: 'VbenSelect',
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            options: ['PUBLIC_CHANNEL', 'PRIVATE_CHANNEL', 'DIRECT'].map(
              (value) => ({
                value,
                label: $t(`rule-chain.externalUi.${value}`),
              }),
            ),
          },
        },
        {
          fieldName: 'configuration.conversation',
          label: $t('rule-chain.config.conversation'),
          component: SlackConversationInput,
          modelPropName: 'modelValue',
          formItemClass: 'sm:col-span-2',
          rules: 'selectRequired',
          dependencies: {
            triggerFields: [
              'configuration.conversationType',
              'configuration.useSystemSettings',
              'configuration.botToken',
            ],
            resolve: ({ values: { configuration } }) => ({
              componentProps: {
                type: configuration.conversationType,
                system: configuration.useSystemSettings,
                token: configuration.botToken,
              },
            }),
          },
        },
        {
          fieldName: 'configuration.messageTemplate',
          label: $t('rule-chain.config.messageTemplate'),
          formItemClass: 'sm:col-span-2',
          component: 'Textarea',
          rules: requiredText('rule-chain.config.messageTemplate'),
          componentProps: { rows: 4 },
        },
      ],
      { template: true },
    ),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
