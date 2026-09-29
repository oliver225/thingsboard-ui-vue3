import type { NodeFormData, NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { VbenSegmented } from '@vben/common-ui';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { templateDescription } from '../shared/form-layout';
import ScriptInput from '../shared/script-input.vue';

export function createSchema(context: NodeFormData): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.scriptLang',
      label: $t('rule-chain.config.scriptLang'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: VbenSegmented,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        class: 'mx-auto w-full max-w-xs p-[2px]',
        'aria-label': $t('rule-chain.config.scriptLang'),
        tabs: [
          { label: 'JavaScript', value: 'JS' },
          { label: 'TBEL', value: 'TBEL' },
        ],
      },
    },
    {
      fieldName: 'configuration.alarmDetailsBuildJs',
      label: $t('rule-chain.config.alarmDetailsBuildJs'),
      formItemClass: 'sm:col-span-2',
      component: ScriptInput,
      hideLabel: true,
      modelPropName: 'modelValue',
      componentProps: {
        functionName: 'Details',
        language: 'JS',
        scriptType: 'json',
        nodeId: context.data?.id?.id,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['configuration.scriptLang'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.scriptLang === 'JS',
        }),
      },
    },
    {
      fieldName: 'configuration.alarmDetailsBuildTbel',
      label: $t('rule-chain.config.alarmDetailsBuildTbel'),
      formItemClass: 'sm:col-span-2',
      component: ScriptInput,
      hideLabel: true,
      modelPropName: 'modelValue',
      componentProps: {
        functionName: 'Details',
        language: 'TBEL',
        scriptType: 'json',
        nodeId: context.data?.id?.id,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['configuration.scriptLang'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.scriptLang !== 'JS',
        }),
      },
    },
    {
      fieldName: 'configuration.alarmType',
      label: $t('rule-chain.nodeAction.alarmType'),
      description: templateDescription,
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.alarmType'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [$t('rule-chain.nodeAction.alarmType')]),
        ),
    },
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    return { ...configuration, scriptLang: configuration.scriptLang || 'JS' };
  },
} satisfies NodeFormDefinition;
