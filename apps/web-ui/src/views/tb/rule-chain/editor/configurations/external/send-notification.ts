import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_notification', $t('rule-chain.externalUi.notification'), [
      {
        fieldName: 'configuration.templateId',
        label: $t('rule-chain.config.templateId'),
        formItemClass: 'sm:col-span-2',
        component: 'EntityInput',
        componentProps: {
          entityType: 'NOTIFICATION_TEMPLATE',
          objectId: true,
          params: { notificationTypes: 'RULE_NODE' },
        },
        rules: 'selectRequired',
      },
      {
        fieldName: 'configuration.targets',
        label: $t('rule-chain.config.targets'),
        formItemClass: 'sm:col-span-2',
        component: 'EntityInput',
        componentProps: { entityType: 'NOTIFICATION_TARGET', multiple: true },
        rules: 'selectRequired',
      },
    ]),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
