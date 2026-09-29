<script lang="ts">
import type {
  CalculatedFieldDefinition,
  ConfigurationProps,
} from '../form-schema';

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

export const definition = {
  type: CalculatedFieldType.SIMPLE,
  output: { name: true, decimals: true, latestTs: true },
  getValues(config, limits, previous) {
    const shared =
      previous?.type === CalculatedFieldType.SCRIPT ? previous : undefined;
    return {
      ...shared,
      arguments:
        shared?.arguments ??
        toArgumentFormValues(config.arguments, {
          maxDataPoints: limits?.maxDataPointsPerRollingArg,
        }),
      expression: shared?.simpleExpression ?? config.expression ?? '',
      scriptExpression: shared?.expression,
      useLatestTs: config.useLatestTs ?? shared?.useLatestTs ?? false,
    };
  },
  validate(formValues, limits) {
    const issues = validateArguments(formValues.arguments, {
      maxArguments: limits?.maxArgumentsPerCF,
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
    });
    if (!formValues.expression.trim())
      issues.push({
        fieldName: 'expression',
        message: $t('calculated-fields.validation.required'),
      });
    if (
      formValues.expression &&
      !/^\s*\S+(?:\s\S+)*\s*$/.test(formValues.expression)
    )
      issues.push({
        fieldName: 'expression',
        message: $t('calculated-fields.validation.expressionInvalid'),
      });
    if (formValues.expression.trim().length > 255)
      issues.push({
        fieldName: 'expression',
        message: $t('calculated-fields.validation.expressionLength'),
      });
    return issues;
  },
  toConfiguration(formValues, limits) {
    return {
      arguments: toArgumentPayload(formValues.arguments, {
        maxDataPoints: limits?.maxDataPointsPerRollingArg,
      }),
      expression: formValues.expression.trim(),
      ...(formValues.outputType === 'TIME_SERIES'
        ? { useLatestTs: formValues.useLatestTs }
        : {}),
    };
  },
} satisfies CalculatedFieldDefinition;
</script>

<script setup lang="ts">
const props = defineProps<ConfigurationProps>();
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
        watchKeyChange: true,
        entityId: {
          entityType: formValues.entityType,
          id: formValues.entityId,
        },
        entityName,
        ownerId: props.ownerId,
        maxArguments: limits?.maxArgumentsPerCF,
        maxDataPoints: limits?.maxDataPointsPerRollingArg,
      },
    },
  ];
});
const expressionFields = computed<VbenFormSchema[]>(() => {
  return [
    {
      fieldName: 'expression',
      component: 'VbenInput',
      label: $t('calculated-fields.fields.expression'),
      rules: 'required',
      componentProps: {
        maxlength: 255,
        placeholder: '(temperature - 32) / 1.8',
      },
      formItemClass: 'sm:col-span-2',
    },
  ];
});
</script>

<template>
  <div class="space-y-4">
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.arguments')"
      :description="$t('calculated-fields.messages.simpleArgumentsHint')"
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
      :title="$t('calculated-fields.sections.expression')"
      :description="$t('calculated-fields.messages.expressionTitleHint')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in expressionFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
  </div>
</template>
