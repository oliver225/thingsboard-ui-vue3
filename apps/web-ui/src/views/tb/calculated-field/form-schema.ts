import type { CalculatedFieldFormValues } from './form-data';

import type { VbenFormSchema } from '#/adapter/form';
import type { CalculatedFieldConfiguration } from '#/api/tb/calculated-field';
import type { SystemParams } from '#/api/tb/system-info';
import type { FormValidationIssue } from '#/types/form';
import type { EntityId } from '#/types/tb';

import { CalculatedFieldType, EntityType } from '#/enums';
import { $t } from '#/locales';

import { getEntityTypeOptions } from './form-data';
export type ValidationIssue = FormValidationIssue;
export interface ConfigurationProps {
  values: CalculatedFieldFormValues;
  limits?: SystemParams;
  entityName?: string;
  ownerId?: EntityId;
  validationField?: string;
}
export interface CalculatedFieldDefinition {
  type: CalculatedFieldType;
  getValues: (
    config: Partial<CalculatedFieldConfiguration>,
    limits?: SystemParams,
    previous?: CalculatedFieldFormValues,
  ) => Partial<CalculatedFieldFormValues>;
  validate: (
    formValues: CalculatedFieldFormValues,
    limits?: SystemParams,
  ) => ValidationIssue[];
  toConfiguration: (
    formValues: CalculatedFieldFormValues,
    limits?: SystemParams,
  ) => Partial<CalculatedFieldConfiguration>;
  output?: {
    name?: boolean;
    decimals?: boolean;
    latestTs?: boolean;
    timeSeriesOnly?: boolean;
  };
}
export function createOutputFields(
  formValues: CalculatedFieldFormValues,
  options: CalculatedFieldDefinition['output'] = {},
): VbenFormSchema[] {
  return [
    {
      fieldName: 'outputType',
      component: 'VbenSelect',
      label: $t('calculated-fields.fields.outputType'),
      rules: 'selectRequired',
      componentProps: {
        disabled: options.timeSeriesOnly,
        options: ['TIME_SERIES', 'ATTRIBUTES'].map((value) => ({
          value,
          label: $t(`calculated-fields.options.${value}`),
        })),
      },
    },
    ...(formValues.outputType === 'ATTRIBUTES' &&
    [EntityType.DEVICE, EntityType.DEVICE_PROFILE].includes(
      formValues.entityType,
    )
      ? ([
          {
            fieldName: 'outputScope',
            component: 'VbenSelect',
            label: $t('calculated-fields.fields.scope'),
            rules: 'selectRequired',
            componentProps: {
              options: ['SERVER_SCOPE', 'SHARED_SCOPE'].map((value) => ({
                value,
                label: $t(`calculated-fields.options.${value}`),
              })),
            },
          },
        ] as VbenFormSchema[])
      : []),
    ...(options.name
      ? ([
          {
            fieldName: 'outputName',
            component: 'VbenInput',
            label:
              formValues.outputType === 'ATTRIBUTES'
                ? $t('calculated-fields.fields.attributeKey')
                : $t('calculated-fields.fields.timeSeriesKey'),
            rules: 'required',
            componentProps: { maxlength: 255 },
          },
        ] as VbenFormSchema[])
      : []),
    ...(options.decimals
      ? ([
          {
            fieldName: 'decimals',
            component: 'InputNumber',
            label: $t('calculated-fields.fields.decimals'),
            componentProps: { min: 0, max: 15, precision: 0, class: 'w-full' },
          },
        ] as VbenFormSchema[])
      : []),
    ...(options.latestTs && formValues.outputType === 'TIME_SERIES'
      ? ([
          {
            fieldName: 'useLatestTs',
            component: 'TbSwitch',
            hideLabel: true,
            formItemClass: 'sm:col-span-2 pb-2',
            componentProps: {
              title: $t('calculated-fields.fields.useLatestTs'),
              description: $t(
                'calculated-fields.messages.outputHelp.useLatestTs',
              ),
              class: 'bg-muted/40',
            },
          },
        ] as VbenFormSchema[])
      : []),
  ];
}
export function createStrategyFields(
  formValues: CalculatedFieldFormValues,
): VbenFormSchema[] {
  if (formValues.strategyType === 'RULE_CHAIN') return [];
  const switches =
    formValues.outputType === 'TIME_SERIES'
      ? ['saveTimeSeries', 'saveLatest']
      : [
          'saveAttribute',
          'updateAttributesOnlyOnValueChange',
          'sendAttributesUpdatedNotification',
        ];
  const fields: VbenFormSchema[] = [
    ...switches,
    'sendWsUpdate',
    'processCfs',
  ].map((fieldName) => {
    let helpKey = fieldName;
    if (fieldName === 'sendWsUpdate' || fieldName === 'processCfs')
      helpKey += formValues.outputType;
    else if (fieldName === 'updateAttributesOnlyOnValueChange')
      helpKey += formValues.updateAttributesOnlyOnValueChange;
    return {
      fieldName,
      component: 'TbSwitch',
      hideLabel: true,
      formItemClass: 'sm:col-span-2 pb-2',
      componentProps: {
        title: $t(`calculated-fields.fields.${fieldName}`),
        description: $t(`calculated-fields.messages.outputHelp.${helpKey}`),
        class: 'bg-muted/40',
      },
    };
  });
  if (formValues.outputType === 'TIME_SERIES') {
    fields.push(
      {
        fieldName: 'customTtl',
        component: 'TbSwitch',
        hideLabel: true,
        formItemClass: 'min-w-0 pb-2',
        componentProps: {
          title: $t('calculated-fields.fields.customTtl'),
          description: $t('calculated-fields.messages.outputHelp.customTtl'),
          disabled: !formValues.saveTimeSeries,
          class: 'bg-muted/40',
        },
      },
      {
        fieldName: 'ttl',
        component: 'SecondsInput',
        modelPropName: 'modelValue',
        hideLabel: true,
        formItemClass: 'min-w-0 pb-2',
        componentProps: {
          min: 0,
          disabled: !formValues.customTtl || !formValues.saveTimeSeries,
          class: 'min-h-[50px] w-full',
          'aria-label': $t('calculated-fields.fields.ttl'),
        },
      },
    );
  }
  return fields;
}
export function validateCommonValues(
  formValues: CalculatedFieldFormValues,
  output: CalculatedFieldDefinition['output'] = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const fieldName of [
    'name',
    'entityId',
    ...(output.name ? (['outputName'] as const) : []),
  ] as const) {
    if (!formValues[fieldName]?.trim())
      issues.push({
        fieldName,
        message: $t('calculated-fields.validation.required'),
      });
  }
  if (formValues.name.length > 255)
    issues.push({
      fieldName: 'name',
      message: $t('calculated-fields.validation.titleLength'),
    });
  if (
    output.name &&
    formValues.outputName &&
    (!/^\s*\S+(?:\s\S+)*\s*$/.test(formValues.outputName) ||
      formValues.outputName.length > 255)
  )
    issues.push({
      fieldName: 'outputName',
      message: $t('calculated-fields.validation.outputKey'),
    });
  if (
    output.decimals &&
    formValues.decimals !== null &&
    (!Number.isSafeInteger(formValues.decimals) ||
      formValues.decimals < 0 ||
      formValues.decimals > 15)
  )
    issues.push({
      fieldName: 'decimals',
      message: $t('calculated-fields.validation.range', { min: 0, max: 15 }),
    });
  if (
    formValues.strategyType === 'IMMEDIATE' &&
    formValues.outputType === 'TIME_SERIES' &&
    formValues.saveTimeSeries &&
    formValues.customTtl &&
    (!Number.isSafeInteger(formValues.ttl) || formValues.ttl < 0)
  )
    issues.push({
      fieldName: 'ttl',
      message: $t('calculated-fields.validation.range', {
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      }),
    });
  return issues;
}
export function createGeneralFields({
  disabled,
  entityType,
  onEntityTypeChange,
  onEntityChange,
}: {
  disabled: boolean;
  entityType?: EntityType;
  onEntityTypeChange: () => void;
  onEntityChange: (value: unknown, option?: { label?: string }) => void;
}): VbenFormSchema[] {
  return [
    {
      component: 'VbenInput',
      fieldName: 'name',
      label: $t('calculated-fields.fields.name'),
      rules: 'required',
      componentProps: { maxlength: 255 },
    },
    {
      component: 'DebugSettingsButton',
      fieldName: 'debugSettings',
      hideLabel: true,
      formItemClass: 'self-start sm:justify-self-end sm:pt-6',
      componentProps: {
        entityLabel: $t('tb.menu.calculatedField'),
      },
    },
    {
      component: 'Select',
      fieldName: 'entityType',
      label: $t('calculated-fields.fields.entityType'),
      rules: 'selectRequired',
      componentProps: {
        options: getEntityTypeOptions(),
        disabled,
        onChange: onEntityTypeChange,
      },
    },
    {
      component: 'EntityInput',
      fieldName: 'entityId',
      label: $t('calculated-fields.fields.entityName'),
      rules: 'required',
      componentProps: {
        entityType,
        key: entityType,
        onChange: onEntityChange,
        disabled,
        showSearch: true,
      },
    },
  ];
}
