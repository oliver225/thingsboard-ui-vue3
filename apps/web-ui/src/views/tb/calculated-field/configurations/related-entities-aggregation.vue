<script lang="ts">
import type {
  CalculatedFieldDefinition,
  ConfigurationProps,
} from '../form-schema';

import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type { VbenFormSchema } from '#/adapter/form';

import { computed, markRaw } from 'vue';

import {
  toArgumentFormValues,
  toArgumentPayload,
  validateArguments,
} from '#/adapter/component/field-arguments/data';
import FieldArguments from '#/adapter/component/field-arguments/index.vue';
import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { CalculatedFieldType } from '#/enums';
import { $t } from '#/locales';

import { toMetricFormValues, toMetricPayload } from '../form-data';
import Metrics, { validateMetricValues } from './metrics.vue';

export const definition = {
  type: CalculatedFieldType.RELATED_ENTITIES_AGGREGATION,
  output: { decimals: true, latestTs: true },
  getValues: (config, limits) => ({
    arguments: toArgumentFormValues(config.arguments, {
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
    }),
    metrics: toMetricFormValues(config),
    useLatestTs: config.useLatestTs ?? false,
    relationDirection: config.relation?.direction ?? 'FROM',
    relationType: config.relation?.relationType ?? 'Contains',
    scheduledUpdateInterval:
      limits?.minAllowedScheduledUpdateIntervalInSecForCF ?? 60,
    deduplicationInterval:
      config.deduplicationIntervalInSec ??
      limits?.minAllowedDeduplicationIntervalInSecForCF ??
      1,
  }),
  validate(formValues, limits) {
    const issues = validateArguments(formValues.arguments, {
      maxArguments: limits?.maxArgumentsPerCF,
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
      onlyCurrentEntity: true,
      defaultValueRequired: true,
    });
    if (formValues.metrics.length === 0)
      issues.push({
        fieldName: 'metrics',
        message: $t('calculated-fields.validation.metrics'),
      });
    const maxItems = (limits?.maxArgumentsPerCF ?? 0) - 2;
    if (maxItems > 0 && formValues.metrics.length > maxItems)
      issues.push({
        fieldName: 'metrics',
        message: $t('calculated-fields.validation.maxItems', {
          count: maxItems,
        }),
      });
    formValues.metrics.forEach((row, index) =>
      issues.push(
        ...validateMetricValues(
          row,
          formValues.type,
          formValues.arguments,
          formValues.metrics.slice(0, index).map((other) => other.name.trim()),
        ).map((issue) => ({
          ...issue,
          fieldName: `metrics[${index}].${issue.fieldName}`,
        })),
      ),
    );
    if (!formValues.relationType.trim())
      issues.push({
        fieldName: 'relationType',
        message: $t('calculated-fields.validation.required'),
      });
    if (
      !Number.isSafeInteger(formValues.deduplicationInterval) ||
      formValues.deduplicationInterval <
        (limits?.minAllowedDeduplicationIntervalInSecForCF ?? 1) ||
      formValues.deduplicationInterval > Number.MAX_SAFE_INTEGER
    )
      issues.push({
        fieldName: 'deduplicationInterval',
        message: $t('calculated-fields.validation.range', {
          min: limits?.minAllowedDeduplicationIntervalInSecForCF ?? 1,
          max: Number.MAX_SAFE_INTEGER,
        }),
      });
    return issues;
  },
  toConfiguration: (formValues, limits) => ({
    arguments: toArgumentPayload(formValues.arguments),
    metrics: toMetricPayload(formValues.metrics, false),
    relation: {
      direction: formValues.relationDirection,
      relationType: formValues.relationType.trim(),
    },
    scheduledUpdateInterval:
      limits?.minAllowedScheduledUpdateIntervalInSecForCF ??
      formValues.scheduledUpdateInterval,
    deduplicationIntervalInSec: formValues.deduplicationInterval,
    ...(formValues.outputType === 'TIME_SERIES'
      ? { useLatestTs: formValues.useLatestTs }
      : {}),
  }),
} satisfies CalculatedFieldDefinition;
</script>

<script setup lang="ts">
const props = defineProps<ConfigurationProps>();
const emit = defineEmits<{ test: [request?: ScriptTestData] }>();
const relationFields = computed<VbenFormSchema[]>(() => {
  return [
    {
      fieldName: 'relationDirection',
      component: 'VbenSelect',
      label: $t('calculated-fields.fields.direction'),
      rules: 'selectRequired',
      componentProps: {
        options: ['FROM', 'TO'].map((value) => ({
          value,
          label: $t(
            `calculated-fields.features.aggregation.direction.${value}`,
          ),
        })),
      },
    },
    {
      fieldName: 'relationType',
      component: 'VbenInput',
      label: $t('calculated-fields.fields.relationType'),
      rules: 'required',
      componentProps: { maxlength: 255 },
    },
  ];
});
const argumentsFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits, entityName } = props;
  return [
    {
      fieldName: 'arguments',
      component: markRaw(FieldArguments),
      modelPropName: 'modelValue',
      hideLabel: true,
      formItemClass: 'pb-0 sm:col-span-2',
      componentProps: {
        onlyCurrentEntity: true,
        defaultValueRequired: true,
        hideSource: true,
        watchKeyChange: true,
        predefinedEntityFilter: {
          type: 'relationsQuery',
          rootStateEntity: false,
          rootEntity: {
            entityType: formValues.entityType,
            id: formValues.entityId,
          },
          direction: formValues.relationDirection,
          filters: [
            {
              relationType: formValues.relationType,
              entityTypes: ['DEVICE', 'ASSET', 'CUSTOMER', 'TENANT'],
            },
          ],
          maxLevel: 1,
        },
        entityId: {
          entityType: formValues.entityType,
          id: formValues.entityId,
        },
        entityName,
        maxArguments: limits?.maxArgumentsPerCF,
        maxDataPoints: limits?.maxDataPointsPerRollingArg,
      },
    },
  ];
});
const metricsFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits, validationField } = props;
  return [
    {
      fieldName: 'metrics',
      component: markRaw(Metrics),
      modelPropName: 'modelValue',
      hideLabel: true,
      formItemClass: 'pb-0 sm:col-span-2',
      componentProps: {
        arguments: formValues.arguments,
        type: formValues.type,
        disabled: !formValues.entityType || !formValues.entityId,
        validationField,
        maxItems: limits?.maxArgumentsPerCF
          ? limits.maxArgumentsPerCF - 2
          : undefined,
        onTest: (request?: ScriptTestData) => emit('test', request),
      },
    },
  ];
});
const schedulingFields = computed<VbenFormSchema[]>(() => {
  const { limits } = props;
  return [
    {
      fieldName: 'deduplicationInterval',
      component: 'SecondsInput',
      modelPropName: 'modelValue',
      label: $t('calculated-fields.fields.deduplicationInterval'),
      componentProps: {
        min: limits?.minAllowedDeduplicationIntervalInSecForCF ?? 1,
        class: 'w-full',
        'aria-label': $t('calculated-fields.fields.deduplicationInterval'),
      },
    },
  ];
});
</script>

<template>
  <div class="space-y-4">
    <FormSection
      size="small"
      :title="$t('calculated-fields.features.aggregation.relatedPath')"
      :description="
        $t('calculated-fields.features.aggregation.relatedPathHelp', {
          max: limits?.maxRelatedEntitiesToReturnPerCfArgument,
        })
      "
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in relationFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.arguments')"
      :description="
        $t('calculated-fields.features.aggregation.relatedArgumentsHelp')
      "
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in argumentsFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.metrics')"
      :description="$t('calculated-fields.features.aggregation.metricsHelp')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in metricsFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.scheduling')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in schedulingFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
  </div>
</template>
