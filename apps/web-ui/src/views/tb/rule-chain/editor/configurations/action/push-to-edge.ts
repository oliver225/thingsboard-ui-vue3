import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import AttributeScope from '../shared/attribute-scope.vue';
import { hint, section } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_scope', $t('rule-chain.actionUi.attributeScope'), [
      hint('_scopeHelp', $t('rule-chain.actionUi.scopeHelp')),
      {
        fieldName: 'configuration.scope',
        hideLabel: true,
        formItemClass: 'sm:col-span-2',
        component: AttributeScope,
        modelPropName: 'modelValue',
        rules: 'selectRequired',
      },
    ]),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
