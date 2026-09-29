import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { hint, section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_routing', $t('rule-chain.actionUi.replyRouting'), [
      hint('_routingHelp', $t('rule-chain.actionUi.restRoutingHelp')),
      {
        fieldName: 'configuration.serviceIdMetaDataAttribute',
        label: $t('rule-chain.config.serviceIdMetaDataAttribute'),
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
    ]),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
