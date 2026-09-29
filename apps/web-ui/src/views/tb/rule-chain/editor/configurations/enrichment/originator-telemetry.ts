import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { VbenSegmented } from '@vben/common-ui';

import { Alert } from 'antdv-next';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section, templateDescription } from '../shared/form-layout';

function createFetchStrategyFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.fetchMode',
      label: $t('rule-chain.nodeAction.fetchStrategy'),
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: VbenSegmented,
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        class: 'mx-auto w-full p-[2px]',
        'aria-label': $t('rule-chain.nodeAction.fetchStrategy'),
        tabs: ['FIRST', 'LAST', 'ALL'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
    },
    {
      fieldName: '_fetchStrategyHelp',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: Alert,
      componentProps: { type: 'warning', showIcon: true },
      dependencies: {
        triggerFields: ['configuration.fetchMode'],
        resolve: ({ values: { configuration } }) => {
          let key = 'rule-chain.nodeAction.fetchStrategyFirstHelp';
          if (configuration?.fetchMode === 'ALL')
            key = 'rule-chain.nodeAction.fetchStrategyAllHelp';
          if (configuration?.fetchMode === 'LAST')
            key = 'rule-chain.nodeAction.fetchStrategyLastHelp';
          return { componentProps: { message: $t(key) } };
        },
      },
    },
    {
      fieldName: 'configuration.aggregation',
      label: $t('rule-chain.config.aggregation'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['NONE', 'MIN', 'MAX', 'AVG', 'SUM', 'COUNT'].map((value) => ({
          value,
          label: $t(`rule-chain.options.aggregation.${value}`),
        })),
      },
      dependencies: {
        triggerFields: ['configuration.fetchMode'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.fetchMode === 'ALL',
        }),
      },
    },
    {
      fieldName: 'configuration.orderBy',
      label: $t('rule-chain.config.orderBy'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['ASC', 'DESC'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
      dependencies: {
        triggerFields: ['configuration.fetchMode'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.fetchMode === 'ALL',
        }),
      },
    },
    {
      fieldName: 'configuration.limit',
      label: $t('rule-chain.nodeAction.limit'),
      help: $t('rule-chain.nodeAction.limitHelp'),
      formItemClass: 'sm:col-span-2',
      component: 'InputNumber',
      rules: z.number().int().min(2).max(1000),
      componentProps: { min: 2, max: 1000, precision: 0, step: 1 },
      dependencies: {
        triggerFields: ['configuration.fetchMode'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.fetchMode === 'ALL',
        }),
      },
    },
  ];
}

function createIntervalFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.useMetadataIntervalPatterns',
      label: $t('rule-chain.config.useMetadataIntervalPatterns'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.useMetadataIntervalPatterns',
        ),
        title: $t('rule-chain.nodeAction.useDynamicInterval'),
      },
    },
    {
      fieldName: 'configuration.startInterval',
      label: $t('rule-chain.nodeAction.startInterval'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().int().min(0),
      componentProps: { min: 0, precision: 0, step: 1 },
      dependencies: {
        triggerFields: ['configuration.useMetadataIntervalPatterns'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.useMetadataIntervalPatterns === false,
        }),
      },
    },
    {
      fieldName: 'configuration.startIntervalTimeUnit',
      label: $t('rule-chain.nodeAction.timeUnit'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['MILLISECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS'].map(
          (value) => ({
            value,
            label: $t(`rule-chain.config.options.${value}`),
          }),
        ),
      },
      dependencies: {
        triggerFields: ['configuration.useMetadataIntervalPatterns'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.useMetadataIntervalPatterns === false,
        }),
      },
    },
    {
      fieldName: 'configuration.endInterval',
      label: $t('rule-chain.nodeAction.endInterval'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().int().min(0),
      componentProps: { min: 0, precision: 0, step: 1 },
      dependencies: {
        triggerFields: ['configuration.useMetadataIntervalPatterns'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.useMetadataIntervalPatterns === false,
        }),
      },
    },
    {
      fieldName: 'configuration.endIntervalTimeUnit',
      label: $t('rule-chain.nodeAction.timeUnit'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['MILLISECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS'].map(
          (value) => ({
            value,
            label: $t(`rule-chain.config.options.${value}`),
          }),
        ),
      },
      dependencies: {
        triggerFields: ['configuration.useMetadataIntervalPatterns'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.useMetadataIntervalPatterns === false,
        }),
      },
    },
    {
      fieldName: 'configuration.startIntervalPattern',
      label: $t('rule-chain.config.startIntervalPattern'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.startIntervalPattern'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.config.startIntervalPattern'),
          ]),
        ),
      dependencies: {
        triggerFields: ['configuration.useMetadataIntervalPatterns'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.useMetadataIntervalPatterns === true,
        }),
      },
    },
    {
      fieldName: 'configuration.endIntervalPattern',
      label: $t('rule-chain.config.endIntervalPattern'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.endIntervalPattern'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.config.endIntervalPattern'),
          ]),
        ),
      dependencies: {
        triggerFields: ['configuration.useMetadataIntervalPatterns'],
        resolve: ({ values: { configuration } }) => ({
          if: configuration.useMetadataIntervalPatterns === true,
        }),
      },
    },
  ];
}

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.latestTsKeyNames',
      label: $t('rule-chain.config.latestTsKeyNames'),
      description: templateDescription,
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: { mode: 'tags' },
    },
    section(
      '_fetchInterval',
      $t('rule-chain.nodeAction.fetchInterval'),
      createIntervalFields(),
    ),
    section(
      '_fetchStrategy',
      $t('rule-chain.nodeAction.fetchStrategy'),
      createFetchStrategyFields(),
    ),
  ];
}

export const definition = {
  createSchema,
  validate(configuration) {
    if (configuration.useMetadataIntervalPatterns) return [];
    const units: Record<string, number> = {
      MILLISECONDS: 1,
      SECONDS: 1000,
      MINUTES: 60_000,
      HOURS: 3_600_000,
      DAYS: 86_400_000,
    };
    return configuration.startInterval *
      (units[configuration.startIntervalTimeUnit] ?? Number.NaN) >
      configuration.endInterval *
        (units[configuration.endIntervalTimeUnit] ?? Number.NaN)
      ? []
      : [
          {
            fieldName: 'configuration.startInterval',
            message: $t('rule-chain.config.intervalOrder'),
          },
        ];
  },
} satisfies NodeFormDefinition;
