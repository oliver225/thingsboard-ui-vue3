import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { hint, section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section(
      '_routing',
      $t('rule-chain.actionUi.replyRouting'),
      [
        {
          ...hint('_routingHelp', $t('rule-chain.actionUi.rpcRoutingHelp')),
          formItemClass: 'sm:col-span-3',
        },
        {
          fieldName: 'configuration.serviceIdMetaDataAttribute',
          label: $t('rule-chain.config.serviceIdMetaDataAttribute'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.sessionIdMetaDataAttribute',
          label: $t('rule-chain.config.sessionIdMetaDataAttribute'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
        {
          fieldName: 'configuration.requestIdMetaDataAttribute',
          label: $t('rule-chain.nodeAction.requestIdMetaDataAttribute'),
          formItemClass: 'sm:col-span-1',
          component: 'VbenInput',
          modelPropName: 'modelValue',
        },
      ],
      { columns: 3 },
    ),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
