<script setup lang="ts">
import { computed, ref } from 'vue';

import { Label } from '@vben-core/shadcn-ui';

import { InputNumber } from 'antdv-next';

import { $t } from '#/locales';

import { aggregationIntervals, intervalUnits } from './model';
import SelectField from './select-field.vue';

defineProps<{ id: string }>();
const interval = defineModel<number>({ required: true });
const CUSTOM_INTERVAL = -1;
const selection = ref(
  aggregationIntervals.includes(interval.value)
    ? interval.value
    : CUSTOM_INTERVAL,
);
const unit = ref(getUnit(interval.value));
const amount = computed(() =>
  Number.isFinite(interval.value) ? interval.value / unit.value : null,
);
const maxAmount = computed(() =>
  Math.floor(Number.MAX_SAFE_INTEGER / unit.value),
);
const options = computed(() => [
  ...aggregationIntervals.map((value) => ({
    value,
    label: $t(`widget.timeFilter.intervals.${value}`),
  })),
  { value: CUSTOM_INTERVAL, label: $t('widget.timeFilter.customInterval') },
]);
const units = computed(() =>
  intervalUnits.map(({ value, label }) => ({
    value,
    label: $t(`widget.timeFilter.units.${label}`),
  })),
);
function getUnit(milliseconds: number): number {
  return (
    intervalUnits.find(
      ({ value }) => milliseconds > 0 && milliseconds % value === 0,
    )?.value ?? 60_000
  );
}

function selectInterval(value: number) {
  selection.value = value;
  if (value === CUSTOM_INTERVAL) return;
  interval.value = value;
  unit.value = getUnit(value);
}

function setAmount(value: null | number | string) {
  interval.value = Number(value ?? Number.NaN) * unit.value;
}

function setUnit(value: number) {
  const count = amount.value;
  unit.value = value;
  setAmount(count);
}
</script>

<template>
  <div class="space-y-3">
    <SelectField
      :id="id"
      :model-value="selection"
      :label="$t('widget.timeFilter.interval')"
      :options="options"
      @update:model-value="selectInterval"
    />
    <div v-if="selection === CUSTOM_INTERVAL" class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <Label :for="`${id}-amount`">{{
          $t('widget.timeFilter.intervalValue')
        }}</Label>
        <InputNumber
          :id="`${id}-amount`"
          :value="amount"
          :min="1"
          :max="maxAmount"
          :step="1"
          :precision="0"
          class="h-[34px] w-full"
          @update:value="setAmount"
        />
      </div>
      <SelectField
        :id="`${id}-unit`"
        :model-value="unit"
        :label="$t('widget.timeFilter.intervalUnit')"
        :options="units"
        @update:model-value="setUnit"
      />
    </div>
    <p class="text-muted-foreground text-xs">
      {{ $t('widget.timeFilter.intervalHint') }}
    </p>
  </div>
</template>
