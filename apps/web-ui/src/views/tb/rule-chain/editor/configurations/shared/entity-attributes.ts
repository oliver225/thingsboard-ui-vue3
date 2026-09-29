import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { ref } from 'vue';

import { VbenSegmented } from '@vben/common-ui';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { createMappingHandlers } from './configuration';
import { createFetchToField } from './fetch-to-field';
import { templateHint } from './form-layout';

function createSchema(entity: 'customer' | 'tenant'): VbenFormSchema[] {
  const latestTelemetry = ref(false);
  const sourceKeyLabel = () =>
    $t(
      latestTelemetry.value
        ? 'rule-chain.nodeAction.sourceTelemetryKey'
        : 'rule-chain.nodeAction.sourceAttributeKey',
    );

  return [
    {
      fieldName: 'configuration.dataToFetch',
      label: $t('rule-chain.nodeAction.dataToFetch'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: VbenSegmented,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        class: 'mx-auto w-full max-w-md p-[2px]',
        'aria-label': $t('rule-chain.nodeAction.dataToFetch'),
        tabs: ['ATTRIBUTES', 'LATEST_TELEMETRY'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
      dependencies: {
        triggerFields: ['configuration.dataToFetch'],
        resolve: ({ values: { configuration } }) => {
          // 同步初始回填和后续切换时的映射、写入位置标签。
          latestTelemetry.value =
            configuration?.dataToFetch === 'LATEST_TELEMETRY';
          return {};
        },
      },
    },
    {
      fieldName: 'configuration.dataMapping',
      label: () =>
        $t(
          latestTelemetry.value
            ? 'rule-chain.nodeAction.telemetryMapping'
            : 'rule-chain.nodeAction.attributeMapping',
        ),
      formItemClass: 'sm:col-span-2',
      type: 'array',
      children: [
        {
          fieldName: 'key',
          label: sourceKeyLabel,
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: () => $t('ui.formRules.required', [sourceKeyLabel()]),
            })
            .trim()
            .min(1, {
              error: () => $t('ui.formRules.required', [sourceKeyLabel()]),
            }),
        },
        {
          fieldName: 'value',
          label: $t('rule-chain.nodeAction.targetKey'),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.targetKey'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.targetKey'),
              ]),
            ),
        },
      ],
      arrayProps: {
        showIndex: false,
        addButtonText: $t('rule-chain.config.addRow'),
        emptyText: $t('rule-chain.config.noRows'),
        actionText: $t('tb.common.actions'),
      },
      rules: 'required',
    },
    templateHint(
      `_${entity}MappingHelp`,
      $t('rule-chain.templateSyntax.allFields'),
    ),
    {
      ...createFetchToField(
        $t('rule-chain.nodeAction.addMappedAttributesTo'),
        'selectRequired',
      ),
      label: () =>
        $t(
          latestTelemetry.value
            ? 'rule-chain.nodeAction.addMappedTelemetryTo'
            : 'rule-chain.nodeAction.addMappedAttributesTo',
        ),
      dependencies: {
        triggerFields: ['configuration.dataToFetch'],
        resolve: ({ values: { configuration } }) => ({
          componentProps: {
            title: $t(
              configuration?.dataToFetch === 'LATEST_TELEMETRY'
                ? 'rule-chain.nodeAction.addMappedTelemetryTo'
                : 'rule-chain.nodeAction.addMappedAttributesTo',
            ),
          },
        }),
      },
    },
  ];
}

export function createEntityAttributesDefinition(
  entity: 'customer' | 'tenant',
) {
  return {
    get title() {
      return $t(`rule-chain.nodeAction.${entity}Mapping`);
    },
    createSchema: () => createSchema(entity),
    ...createMappingHandlers('dataMapping'),
  } satisfies NodeFormDefinition;
}
