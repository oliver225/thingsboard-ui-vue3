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
import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { CalculatedFieldType } from '#/enums';
import { $t } from '#/locales';

import { calculatedFieldDefaultScript } from '../form-data';
import PropagationData from './propagation-data.vue';

export const definition = {
  type: CalculatedFieldType.PROPAGATION,
  getValues: (config, limits) => ({
    arguments: toArgumentFormValues(config.arguments, {
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
    }),
    expression: config.expression ?? calculatedFieldDefaultScript,
    relationDirection: config.relation?.direction ?? 'TO',
    relationType: config.relation?.relationType ?? 'Contains',
    applyExpression: config.applyExpressionToResolvedArguments ?? false,
  }),
  validate(formValues, limits) {
    const issues = validateArguments(formValues.arguments, {
      maxArguments: limits?.maxArgumentsPerCF,
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
      onlyCurrentEntity: !formValues.applyExpression,
      forbiddenNames: formValues.applyExpression
        ? ['ctx', 'e', 'pi']
        : ['ctx', 'e', 'pi', 'propagationCtx'],
      allowRolling: formValues.applyExpression,
    });
    if (!formValues.relationType.trim())
      issues.push({
        fieldName: 'relationType',
        message: $t('calculated-fields.validation.required'),
      });
    if (formValues.applyExpression && !formValues.expression.trim())
      issues.push({
        fieldName: 'expression',
        message: $t('calculated-fields.validation.required'),
      });
    if (
      !formValues.arguments.some(
        (argument) => argument.sourceType === 'CURRENT',
      )
    )
      issues.push({
        fieldName: 'arguments',
        message: $t('calculated-fields.validation.currentArgument'),
      });
    return issues;
  },
  toConfiguration: (formValues, limits) => ({
    arguments: toArgumentPayload(formValues.arguments, {
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
    }),
    relation: {
      direction: formValues.relationDirection,
      relationType: formValues.relationType.trim(),
    },
    applyExpressionToResolvedArguments: formValues.applyExpression,
    ...(formValues.applyExpression
      ? { expression: formValues.expression.trim() }
      : {}),
  }),
} satisfies CalculatedFieldDefinition;
</script>

<script setup lang="ts">
const props = defineProps<ConfigurationProps>();
const emit = defineEmits<{
  change: [field: string, value: unknown];
  test: [request?: ScriptTestData];
}>();
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
          label: $t(`calculated-fields.options.propagationDirections.${value}`),
        })),
      },
    },
    {
      fieldName: 'relationType',
      component: 'AutoComplete',
      label: $t('calculated-fields.fields.relationType'),
      rules: 'required',
      componentProps: {
        options: ['Contains', 'Manages'].map((value) => ({ value })),
        maxlength: 255,
        filterOption: (input: string, option: { value: string }) =>
          option.value.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      fieldName: 'applyExpression',
      component: 'TbSwitch',
      hideLabel: true,
      formItemClass: 'sm:col-span-2 pb-2',
      componentProps: {
        title: $t('calculated-fields.fields.applyExpression'),
        description: $t('calculated-fields.messages.propagationDataHint'),
        class: 'bg-muted/40',
      },
    },
  ];
});
const argumentsFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits, entityName } = props;
  return [
    {
      fieldName: 'arguments',
      component: markRaw(PropagationData),
      modelPropName: 'modelValue',
      hideLabel: true,
      formItemClass: 'pb-0 sm:col-span-2',
      componentProps: {
        applyExpression: formValues.applyExpression,
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
      rules: 'required',
      formItemClass: 'sm:col-span-2',
      componentProps: {
        language: 'tbel',
        testDisabled:
          validateArguments(formValues.arguments, {
            maxArguments: props.limits?.maxArgumentsPerCF,
            maxDataPoints: props.limits?.maxDataPointsPerRollingArg,
            allowRolling: true,
            forbiddenNames: ['ctx', 'e', 'pi'],
          }).length > 0 ||
          !formValues.arguments.some(
            (argument) => argument.sourceType === 'CURRENT',
          ),
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
      :title="$t('calculated-fields.fields.propagationPath')"
      :description="
        $t('calculated-fields.messages.propagationHint', {
          max: limits?.maxRelatedEntitiesToReturnPerCfArgument ?? '—',
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
      :title="$t('calculated-fields.sections.propagationData')"
      :description="$t('calculated-fields.messages.propagationDataHint')"
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
      v-if="props.values.applyExpression"
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
