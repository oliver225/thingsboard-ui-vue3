import type { NodeFormData, NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { VbenSegmented } from '@vben/common-ui';

import { $t } from '#/locales';

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
      fieldName: 'configuration.jsScript',
      label: $t('rule-chain.config.jsScript'),
      formItemClass: 'sm:col-span-2',
      component: ScriptInput,
      hideLabel: true,
      modelPropName: 'modelValue',
      componentProps: {
        functionName: 'Transform',
        language: 'JS',
        scriptType: 'update',
        nodeId: context.data?.id?.id,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['configuration.scriptLang'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.scriptLang === 'JS',
        }),
      },
    },
    {
      fieldName: 'configuration.tbelScript',
      label: $t('rule-chain.config.tbelScript'),
      formItemClass: 'sm:col-span-2',
      component: ScriptInput,
      hideLabel: true,
      modelPropName: 'modelValue',
      componentProps: {
        functionName: 'Transform',
        language: 'TBEL',
        scriptType: 'update',
        nodeId: context.data?.id?.id,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['configuration.scriptLang'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.scriptLang !== 'JS',
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
