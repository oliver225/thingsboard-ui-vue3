import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import AttributeScope from '../shared/attribute-scope.vue';
import { hint, section } from '../shared/form-layout';
import {
  initialProcessingSettings,
  toProcessingSettings,
  validateProcessingSettings,
} from '../shared/processing-settings';
import ProcessingSettingsInput from '../shared/processing-settings.vue';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.processingSettings',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: ProcessingSettingsInput,
      modelPropName: 'modelValue',
      componentProps: { timeseries: false },
      rules: 'required',
    },
    section('_scope', $t('rule-chain.actionUi.attributeScope'), [
      hint('_scopeHelp', $t('rule-chain.actionUi.scopeHelp')),
      {
        fieldName: 'configuration.scope',
        component: AttributeScope,
        modelPropName: 'modelValue',
        hideLabel: true,
        formItemClass: 'sm:col-span-2',
        rules: 'selectRequired',
        dependencies: {
          triggerFields: [],
          resolve: ({ controller }) => ({
            componentProps: {
              onChange: (scope: string) => {
                controller.setFieldValue(
                  'configuration.updateAttributesOnlyOnValueChange',
                  false,
                );
                if (scope !== 'SHARED_SCOPE')
                  controller.setFieldValue('configuration.notifyDevice', false);
                if (scope === 'CLIENT_SCOPE')
                  controller.setFieldValue(
                    'configuration.sendAttributesUpdatedNotification',
                    false,
                  );
              },
            },
          }),
        },
      },
    ]),
    section(
      '_advanced',
      $t('rule-chain.actionUi.advancedSettings'),
      [
        {
          fieldName: 'configuration.updateAttributesOnlyOnValueChange',
          label: $t('rule-chain.config.updateAttributesOnlyOnValueChange'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            title: $t('rule-chain.config.updateAttributesOnlyOnValueChange'),
          },
          dependencies: {
            triggerFields: ['configuration.updateAttributesOnlyOnValueChange'],
            resolve: ({ values: { configuration = {} } }) => ({
              componentProps: {
                description: $t(
                  configuration.updateAttributesOnlyOnValueChange
                    ? 'rule-chain.config.descriptions.updateChangedAttributes'
                    : 'rule-chain.config.descriptions.updateAttributesAlways',
                ),
              },
            }),
          },
        },
        {
          fieldName: 'configuration.sendAttributesUpdatedNotification',
          label: $t('rule-chain.nodeAction.sendAttributesUpdatedNotification'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.sendAttributesUpdatedNotification',
            ),
            title: $t(
              'rule-chain.nodeAction.sendAttributesUpdatedNotification',
            ),
          },
          dependencies: {
            triggerFields: ['configuration.scope'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: configuration.scope !== 'CLIENT_SCOPE',
            }),
          },
        },
        {
          fieldName: 'configuration.notifyDevice',
          label: $t('rule-chain.nodeAction.notifyDevice'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.notifyDeviceOnUpdate',
            ),
            title: $t('rule-chain.nodeAction.notifyDevice'),
          },
          dependencies: {
            triggerFields: ['configuration.scope'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: configuration.scope === 'SHARED_SCOPE',
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
  getValues(configuration) {
    return {
      ...configuration,
      processingSettings: initialProcessingSettings(
        configuration.processingSettings,
        false,
      ),
    };
  },
  validate(configuration) {
    return validateProcessingSettings(configuration.processingSettings, false);
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      processingSettings: toProcessingSettings(
        configuration.processingSettings,
      ),
      notifyDevice:
        configuration.scope === 'SHARED_SCOPE' && !!configuration.notifyDevice,
      sendAttributesUpdatedNotification:
        configuration.scope !== 'CLIENT_SCOPE' &&
        !!configuration.sendAttributesUpdatedNotification,
    };
  },
} satisfies NodeFormDefinition;
