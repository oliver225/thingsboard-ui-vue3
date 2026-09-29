import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { ref } from 'vue';

import { VbenSegmented } from '@vben/common-ui';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import {
  toMapping,
  toMappingRows,
  validateMapping,
} from '../shared/configuration';

export function createSchema(): VbenFormSchema[] {
  const renameIn = ref('DATA');
  return [
    {
      fieldName: 'configuration.renameIn',
      label: $t('rule-chain.config.renameIn'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: VbenSegmented,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        class: 'mx-auto w-full max-w-md p-[2px]',
        'aria-label': $t('rule-chain.config.renameIn'),
        tabs: ['DATA', 'METADATA'].map((value) => ({
          value,
          label: $t(
            `rule-chain.nodeAction.${value === 'DATA' ? 'message' : 'metadata'}`,
          ),
        })),
      },
      dependencies: {
        triggerFields: ['configuration.renameIn'],
        resolve: ({ values: { configuration } }) => {
          renameIn.value = configuration?.renameIn ?? 'DATA';
          return {};
        },
      },
    },
    {
      fieldName: 'configuration.renameKeysMapping',
      label: () =>
        $t(
          renameIn.value === 'METADATA'
            ? 'rule-chain.config.metadataKeysMapping'
            : 'rule-chain.config.messageKeysMapping',
        ),
      formItemClass: 'sm:col-span-2',
      type: 'array',
      children: [
        {
          fieldName: 'key',
          label: $t('rule-chain.nodeAction.currentKey'),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.currentKey'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.currentKey'),
              ]),
            ),
        },
        {
          fieldName: 'value',
          label: $t('rule-chain.nodeAction.renameKey'),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.renameKey'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.renameKey'),
              ]),
            ),
        },
      ],
      arrayProps: {
        showIndex: false,
        addButtonText: $t('rule-chain.nodeAction.addMapping'),
        emptyText: $t('rule-chain.config.noRows'),
        actionText: $t('tb.common.actions'),
      },
      rules: 'required',
    },
  ];
}

export const definition = {
  get title() {
    return $t('rule-chain.config.renameIn');
  },
  createSchema,
  getValues(configuration) {
    let renameIn = configuration.renameIn ?? 'DATA';
    if (typeof configuration.fromMetadata === 'boolean') {
      renameIn = configuration.fromMetadata ? 'METADATA' : 'DATA';
    }
    configuration = {
      ...configuration,
      renameIn,
      renameKeysMapping: toMappingRows(configuration.renameKeysMapping),
    };
    return configuration;
  },
  toConfiguration(configuration) {
    const { fromMetadata: _fromMetadata, ...currentConfiguration } =
      configuration;
    configuration = {
      ...currentConfiguration,
      renameKeysMapping: toMapping(configuration.renameKeysMapping),
    };
    return configuration;
  },
  validate(configuration) {
    const errors = [
      ...validateMapping(
        configuration.renameKeysMapping,
        'configuration.renameKeysMapping',
      ),
    ];
    if (
      configuration.renameKeysMapping?.some(
        ({ key, value }: { key: string; value: string }) =>
          key?.trim() && key.trim() === value?.trim(),
      )
    ) {
      errors.push({
        fieldName: 'configuration.renameKeysMapping',
        message: $t('rule-chain.config.renameKeysMustDiffer'),
      });
    }
    if (errors.length > 0) return errors;
    return [];
  },
} satisfies NodeFormDefinition;
