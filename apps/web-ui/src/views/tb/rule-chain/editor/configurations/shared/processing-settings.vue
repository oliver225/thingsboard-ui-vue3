<script setup lang="ts">
import type {
  ProcessingSettings,
  ProcessingStrategy,
  ProcessingTarget,
} from './processing-settings';

import { computed, ref, useId } from 'vue';

import { Alert, Segmented, Select } from 'antdv-next';

import SecondsInput from '#/adapter/component/seconds-input.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import {
  initialProcessingSettings,
  processingTargets,
} from './processing-settings';

const props = defineProps<{ timeseries?: boolean }>();
const value = defineModel<ProcessingSettings>();
const id = useId();
const basicType = ref<ProcessingSettings['type']>('ON_EVERY_MESSAGE');
const settings = computed(
  () => value.value ?? initialProcessingSettings(undefined, props.timeseries),
);
const advanced = computed(() => settings.value.type === 'ADVANCED');
const mode = computed({
  get: () => (advanced.value ? 'ADVANCED' : 'BASIC'),
  set: (mode: string) => {
    if (mode === 'ADVANCED') basicType.value = settings.value.type;
    value.value = {
      ...settings.value,
      type: mode === 'ADVANCED' ? 'ADVANCED' : basicType.value,
    };
  },
});
const modes = computed(() =>
  ['BASIC', 'ADVANCED'].map((value) => ({
    value,
    label: $t(`rule-chain.actionUi.${value}`),
  })),
);
const options = (advanced: boolean) =>
  [
    'ON_EVERY_MESSAGE',
    'DEDUPLICATE',
    advanced ? 'SKIP' : 'WEBSOCKETS_ONLY',
  ].map((value) => ({
    value,
    label: $t(`rule-chain.config.options.${value}`),
  }));
function update(
  key: ProcessingTarget | undefined,
  patch: Partial<ProcessingSettings> | Partial<ProcessingStrategy>,
) {
  value.value = key
    ? { ...settings.value, [key]: { ...settings.value[key], ...patch } }
    : ({ ...settings.value, ...patch } as ProcessingSettings);
}
const rows = computed(() =>
  advanced.value
    ? processingTargets(!!props.timeseries).map((key) => ({
        key,
        strategy: settings.value[key] ?? {
          type: 'ON_EVERY_MESSAGE' as const,
          deduplicationIntervalSecs: 60,
        },
      }))
    : [{ key: undefined, strategy: settings.value }],
);
</script>

<template>
  <FormSection
    size="small"
    :title="$t('rule-chain.actionUi.processingSettings')"
    content-class="flex flex-col gap-5"
  >
    <template #actions>
      <Segmented
        v-model:value="mode"
        :aria-label="$t('rule-chain.actionUi.processingMode')"
        :options="modes"
        shape="round"
      />
    </template>
    <Alert
      type="warning"
      show-icon
      :message="$t('rule-chain.actionUi.processingHelp')"
    />
    <component
      :is="row.key ? FormSection : 'div'"
      v-for="row in rows"
      :key="row.key ?? 'basic'"
      v-bind="
        row.key
          ? {
              size: 'small',
              title: $t(`rule-chain.config.processingSettings_${row.key}_type`),
              contentClass: 'grid grid-cols-1 gap-5',
            }
          : { class: 'grid grid-cols-1 gap-5' }
      "
    >
      <div class="flex min-w-0 flex-col gap-2">
        <label :for="`${id}-${row.key}-type`">{{
          $t('rule-chain.actionUi.strategy')
        }}</label>
        <Select
          :id="`${id}-${row.key}-type`"
          :value="row.strategy.type"
          :options="options(advanced)"
          @change="
            (type) =>
              update(row.key, { type: type as ProcessingStrategy['type'] })
          "
        />
      </div>
      <div
        v-if="row.strategy.type === 'DEDUPLICATE'"
        class="flex min-w-0 flex-col gap-2"
      >
        <label :for="`${id}-${row.key}-interval`">{{
          $t('rule-chain.nodeAction.deduplicationInterval')
        }}</label>
        <SecondsInput
          :id="`${id}-${row.key}-interval`"
          :model-value="row.strategy.deduplicationIntervalSecs"
          :min="1"
          :max="86400"
          class="w-full"
          @update:model-value="
            (next) =>
              update(row.key, {
                deduplicationIntervalSecs:
                  next === null ? undefined : Number(next),
              })
          "
        />
      </div>
    </component>
  </FormSection>
</template>
