<script setup lang="ts">
import type {
  ArgumentEditorOptions,
  ArgumentValues,
} from '#/adapter/component/field-arguments/data';

import FieldArguments from '#/adapter/component/field-arguments/index.vue';
defineProps<
  ArgumentEditorOptions & {
    modelValue: ArgumentValues[];
    applyExpression: boolean;
    disabled?: boolean;
  }
>();
const emit = defineEmits<{
  'update:modelValue': [rows: ArgumentValues[]];
}>();
</script>

<template>
  <FieldArguments
    :model-value="modelValue"
    :entity-id="entityId"
    :entity-name="entityName"
    :owner-id="ownerId"
    :only-current-entity="!applyExpression"
    :allow-rolling="applyExpression"
    :hide-source="!applyExpression"
    :watch-key-change="!applyExpression"
    :forbidden-names="
      applyExpression
        ? ['ctx', 'e', 'pi']
        : ['ctx', 'e', 'pi', 'propagationCtx']
    "
    :disabled="disabled"
    :max-arguments="maxArguments"
    :max-data-points="maxDataPoints"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
