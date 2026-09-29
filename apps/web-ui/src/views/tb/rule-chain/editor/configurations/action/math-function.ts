import type { NodeFormDefinition } from '../../types';
import type { MathArgument } from '../shared/math-arguments';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section, templateHint } from '../shared/form-layout';
import { argumentCounts, normalizeArguments } from '../shared/math-arguments';
import MathArguments from '../shared/math-arguments.vue';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.operation',
      label: $t('rule-chain.config.operation'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: [
          'CUSTOM',
          'ADD',
          'SUB',
          'MULT',
          'DIV',
          'SIN',
          'SINH',
          'COS',
          'COSH',
          'TAN',
          'TANH',
          'ACOS',
          'ASIN',
          'ATAN',
          'ATAN2',
          'EXP',
          'EXPM1',
          'SQRT',
          'CBRT',
          'GET_EXP',
          'HYPOT',
          'LOG',
          'LOG10',
          'LOG1P',
          'CEIL',
          'FLOOR',
          'FLOOR_DIV',
          'FLOOR_MOD',
          'ABS',
          'MIN',
          'MAX',
          'POW',
          'SIGNUM',
          'RAD',
          'DEG',
        ].map((value) => ({
          value,
          label: $t(`rule-chain.actionUi.math.${value}`),
        })),
      },
    },
    section('_arguments', $t('rule-chain.actionUi.arguments'), [
      {
        fieldName: 'configuration.arguments',
        hideLabel: true,
        formItemClass: 'sm:col-span-2',
        component: MathArguments,
        modelPropName: 'modelValue',
        rules: 'required',
        dependencies: {
          triggerFields: ['configuration.operation'],
          resolve: ({ values: { configuration = {} } }) => ({
            componentProps: { operation: configuration.operation },
          }),
        },
      },
      templateHint(),
    ]),
    {
      fieldName: 'configuration.customFunction',
      label: $t('rule-chain.actionUi.customExpression'),
      help: $t('rule-chain.nodeAction.customFunctionHelp'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.actionUi.customExpression'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.actionUi.customExpression'),
          ]),
        ),
      dependencies: {
        triggerFields: ['configuration.operation'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.operation === 'CUSTOM',
        }),
      },
    },
    section('_result', $t('rule-chain.actionUi.result'), [
      {
        fieldName: 'configuration.result.type',
        label: $t('rule-chain.config.result_type'),
        formItemClass: 'sm:col-span-2',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: [
            'MESSAGE_BODY',
            'MESSAGE_METADATA',
            'ATTRIBUTE',
            'TIME_SERIES',
          ].map((value) => ({
            value,
            label: $t(`rule-chain.config.options.${value}`),
          })),
        },
      },
      {
        fieldName: 'configuration.result.attributeScope',
        label: $t('rule-chain.config.result_attributeScope'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: ['SHARED_SCOPE', 'SERVER_SCOPE'].map((value) => ({
            value,
            label: $t(`rule-chain.actionUi.${value}`),
          })),
        },
        dependencies: {
          triggerFields: ['configuration.result.type'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: configuration.result?.type === 'ATTRIBUTE',
          }),
        },
      },
      {
        fieldName: 'configuration.result.key',
        label: $t('rule-chain.config.result_key'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenInput',
        modelPropName: 'modelValue',
        rules: z
          .string({
            error: $t('ui.formRules.required', [
              $t('rule-chain.config.result_key'),
            ]),
          })
          .trim()
          .min(
            1,
            $t('ui.formRules.required', [$t('rule-chain.config.result_key')]),
          ),
      },
      {
        fieldName: 'configuration.result.resultValuePrecision',
        label: $t('rule-chain.config.result_resultValuePrecision'),
        description: $t('rule-chain.actionUi.precisionHelp'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(0).nullish(),
        componentProps: { min: 0, precision: 0, step: 1 },
      },
      {
        fieldName: 'configuration.result.addToBody',
        label: $t('rule-chain.config.result_addToBody'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: { title: $t('rule-chain.config.result_addToBody') },
        dependencies: {
          triggerFields: ['configuration.result.type'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: ['ATTRIBUTE', 'TIME_SERIES'].includes(
              configuration.result?.type,
            ),
          }),
        },
      },
      {
        fieldName: 'configuration.result.addToMetadata',
        label: $t('rule-chain.config.result_addToMetadata'),
        formItemClass: 'sm:col-span-2',
        component: 'TbSwitch',
        hideLabel: true,
        componentProps: { title: $t('rule-chain.config.result_addToMetadata') },
        dependencies: {
          triggerFields: ['configuration.result.type'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: ['ATTRIBUTE', 'TIME_SERIES'].includes(
              configuration.result?.type,
            ),
          }),
        },
      },
    ]),
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    return {
      ...configuration,
      arguments: normalizeArguments(
        configuration.arguments,
        configuration.operation,
      ),
    };
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      arguments: configuration.arguments.map((argument: MathArgument) => ({
        name: argument.name,
        type: argument.type,
        key: String(argument.key).trim(),
        ...(argument.type === 'ATTRIBUTE'
          ? { attributeScope: argument.attributeScope }
          : {}),
        ...(argument.type === 'CONSTANT'
          ? {}
          : { defaultValue: argument.defaultValue }),
      })),
      result: {
        ...configuration.result,
        addToBody:
          ['ATTRIBUTE', 'TIME_SERIES'].includes(configuration.result?.type) &&
          !!configuration.result?.addToBody,
        addToMetadata:
          ['ATTRIBUTE', 'TIME_SERIES'].includes(configuration.result?.type) &&
          !!configuration.result?.addToMetadata,
      },
    };
  },
  validate(configuration) {
    const [min, max] = argumentCounts[configuration.operation] ?? [1, 16];
    const args: { type: string; key: string; attributeScope?: string }[] =
      configuration.arguments ?? [];
    if (args.length < min || args.length > max)
      return [
        {
          fieldName: 'configuration.arguments',
          message: $t('rule-chain.config.argumentCount'),
        },
      ];
    return args.flatMap((argument) => {
      if (
        ![
          'ATTRIBUTE',
          'CONSTANT',
          'MESSAGE_BODY',
          'MESSAGE_METADATA',
          'TIME_SERIES',
        ].includes(argument.type) ||
        !String(argument.key ?? '').trim()
      )
        return [
          {
            fieldName: 'configuration.arguments',
            message: $t('rule-chain.actionUi.invalidArgument'),
          },
        ];
      if (
        argument.type === 'CONSTANT' &&
        !Number.isFinite(Number(argument.key))
      )
        return [
          {
            fieldName: 'configuration.arguments',
            message: $t('rule-chain.config.constantNumber'),
          },
        ];
      if (argument.type === 'ATTRIBUTE' && !argument.attributeScope)
        return [
          {
            fieldName: 'configuration.arguments',
            message: $t('ui.formRules.selectRequired', [
              $t('rule-chain.config.scope'),
            ]),
          },
        ];
      return [];
    });
  },
} satisfies NodeFormDefinition;
