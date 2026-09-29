<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';

import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { createQueueFormSchema } from './form-schema';

const props = defineProps<{
  index: number;
  nameDisabled?: boolean;
  validationError?: { fieldName: string };
}>();
const expandedGroups = reactive<Record<string, boolean>>({});
const schema = computed(() =>
  createQueueFormSchema({
    index: props.index,
    nameDisabled: props.nameDisabled,
  }),
);
const groups = [
  { key: 'submit', fields: ['submitType', 'batchSize'] },
  {
    key: 'processing',
    fields: [
      'processingType',
      'retries',
      'failurePercentage',
      'pauseBetweenRetries',
      'maxPauseBetweenRetries',
    ],
  },
  {
    key: 'polling',
    fields: [
      'pollInterval',
      'partitions',
      'packProcessingTimeout',
      'consumerPerPartition',
    ],
  },
] as const;

function getGroupFields(fieldNames: readonly string[]) {
  return fieldNames.flatMap((fieldName) =>
    schema.value.filter(
      (field) => field.fieldName === `queues[${props.index}].${fieldName}`,
    ),
  );
}

watch(
  () => props.validationError,
  (error) => {
    if (!error) return;
    const group = groups.find(({ fields }) =>
      fields.some(
        (fieldName) =>
          error.fieldName === `queues[${props.index}].${fieldName}`,
      ),
    );
    if (group) expandedGroups[group.key] = true;
  },
);
</script>

<template>
  <div class="tenant-profile-section-stack">
    <FormField
      v-for="field in getGroupFields(['name'])"
      :key="field.fieldName"
      :schema="field"
    />
    <FormSection
      v-for="group in groups"
      :key="group.key"
      v-model:open="expandedGroups[group.key]"
      collapsible
      :title="$t(`settings.features.queues.groups.${group.key}`)"
    >
      <div class="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
        <FormField
          v-for="field in getGroupFields(group.fields)"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormField
      v-for="field in getGroupFields([
        'duplicateMsgToAllPartitions',
        'customProperties',
        'description',
      ])"
      :key="field.fieldName"
      :schema="field"
    />
  </div>
</template>
