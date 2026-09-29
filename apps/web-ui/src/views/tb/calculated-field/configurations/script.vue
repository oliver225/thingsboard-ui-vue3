<script lang="ts">
import type {
  CalculatedFieldDefinition,
  ConfigurationProps,
} from '../form-schema';

import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type { VbenFormSchema } from '#/adapter/form';

import { computed, markRaw } from 'vue';

import {
  createScriptParameters,
  toArgumentFormValues,
  toArgumentPayload,
  validateArguments,
} from '#/adapter/component/field-arguments/data';
import FieldArguments from '#/adapter/component/field-arguments/index.vue';
import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { CalculatedFieldType } from '#/enums';
import { $t } from '#/locales';

import { calculatedFieldDefaultScript } from '../form-data';

export const definition = {
  type: CalculatedFieldType.SCRIPT,
  getValues(config, limits, previous) {
    const shared =
      previous?.type === CalculatedFieldType.SIMPLE ? previous : undefined;
    return {
      ...shared,
      arguments:
        shared?.arguments ??
        toArgumentFormValues(config.arguments, {
          maxDataPoints: limits?.maxDataPointsPerRollingArg,
        }),
      expression:
        shared?.scriptExpression ??
        config.expression ??
        calculatedFieldDefaultScript,
      simpleExpression: shared?.expression,
    };
  },
  validate(formValues, limits) {
    const issues = validateArguments(formValues.arguments, {
      maxArguments: limits?.maxArgumentsPerCF,
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
      allowRolling: true,
    });
    if (!formValues.expression.trim())
      issues.push({
        fieldName: 'expression',
        message: $t('calculated-fields.validation.required'),
      });
    return issues;
  },
  toConfiguration: (formValues, limits) => ({
    arguments: toArgumentPayload(formValues.arguments, {
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
    }),
    expression: formValues.expression.trim(),
  }),
} satisfies CalculatedFieldDefinition;
</script>

<script setup lang="ts">
const props = defineProps<ConfigurationProps>();
const emit = defineEmits<{
  change: [field: string, value: unknown];
  test: [request?: ScriptTestData];
}>();
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
        allowRolling: true,
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
const scriptFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues } = props;
  return [
    {
      fieldName: 'expression',
      component: 'ScriptEditor',
      modelPropName: 'modelValue',
      label: $t('calculated-fields.fields.script'),
      hideLabel: true,
      rules: 'required',
      formItemClass: 'sm:col-span-2',
      componentProps: {
        language: 'tbel',
        title: 'function calculate(ctx) {',
        testDisabled:
          validateArguments(formValues.arguments, {
            maxArguments: props.limits?.maxArgumentsPerCF,
            maxDataPoints: props.limits?.maxDataPointsPerRollingArg,
            allowRolling: true,
          }).length > 0,
        height: 240,
        ariaLabel: $t('calculated-fields.fields.script'),
        parameters: createScriptParameters(formValues.arguments),
        testHandler: (expression: string) =>
          emit('test', {
            expression,
            arguments: formValues.arguments,
            onApply: (script: string) => emit('change', 'expression', script),
          }),
        placeholder: $t('calculated-fields.messages.scriptHint'),
      },
    },
  ];
});
</script>

<template>
  <div class="space-y-4">
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.arguments')"
      :description="$t('calculated-fields.messages.scriptArgumentsHint')"
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
      :title="$t('calculated-fields.sections.script')"
      :description="$t('calculated-fields.messages.scriptHint')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in scriptFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
  </div>
</template>
