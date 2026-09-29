import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import AttributeScope from '../shared/attribute-scope.vue';
import { hint, section, templateDescription } from '../shared/form-layout';

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
    {
      fieldName: 'configuration.keys',
      label: $t('rule-chain.nodeAction.keys'),
      description: templateDescription,
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: { mode: 'tags' },
    },

    {
      fieldName: 'configuration.sendAttributesDeletedNotification',
      label: $t('rule-chain.nodeAction.sendAttributesDeletedNotification'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.sendAttributesDeletedNotification',
        ),
        title: $t('rule-chain.nodeAction.sendAttributesDeletedNotification'),
      },
    },
    {
      fieldName: 'configuration.notifyDevice',
      label: $t('rule-chain.nodeAction.notifyDevice'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.notifyDeviceOnDelete'),
        title: $t('rule-chain.nodeAction.notifyDevice'),
      },
      dependencies: {
        triggerFields: ['configuration.scope'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.scope === 'SHARED_SCOPE',
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
  toConfiguration(configuration) {
    return {
      ...configuration,
      notifyDevice:
        configuration.scope === 'SHARED_SCOPE' && !!configuration.notifyDevice,
    };
  },
} satisfies NodeFormDefinition;
