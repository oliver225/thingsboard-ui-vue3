import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section } from '../shared/form-layout';
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
      componentProps: { timeseries: true },
      rules: 'required',
    },
    section(
      '_advanced',
      $t('rule-chain.actionUi.advancedSettings'),
      [
        {
          fieldName: 'configuration.useServerTs',
          label: $t('rule-chain.nodeAction.useServerTs'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            description: $t('rule-chain.config.descriptions.useServerTs'),
            title: $t('rule-chain.nodeAction.useServerTs'),
          },
        },
        {
          fieldName: 'configuration.defaultTTL',
          label: $t('rule-chain.nodeAction.defaultTTL'),
          description: $t('rule-chain.actionUi.ttlHelp'),
          formItemClass: 'sm:col-span-2',
          component: 'SecondsInput',
          rules: z.number().int().min(0),
          componentProps: { min: 0, precision: 0, step: 1 },
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
        true,
      ),
    };
  },
  validate(configuration) {
    return validateProcessingSettings(configuration.processingSettings, true);
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      processingSettings: toProcessingSettings(
        configuration.processingSettings,
      ),
    };
  },
} satisfies NodeFormDefinition;
