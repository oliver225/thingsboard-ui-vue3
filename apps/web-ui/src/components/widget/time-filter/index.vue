<script setup lang="ts">
import type { TimeFilterValue } from './model';

import { computed, ref, useId } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  VbenButton,
  VbenSegmented,
} from '@vben-core/shadcn-ui';

import { DatePicker, InputNumber } from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';

import IntervalField from './interval-field.vue';
import {
  aggregations,
  defaultAggregationInterval,
  timeDurations,
  timeFilterError,
  timeFilterLayers,
  timeFilterLimits,
} from './model';
import SelectField from './select-field.vue';

const props = defineProps<{ modelValue: TimeFilterValue; title?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: TimeFilterValue] }>();
const id = useId();
const open = ref(false);
const draft = ref({ ...props.modelValue });
const submitted = ref(false);
const error = computed(() =>
  submitted.value ? timeFilterError(draft.value) : undefined,
);
const calendarClass = `time-filter-calendar-${id.replaceAll(':', '-')}`;
const panelStyle = {
  zIndex: timeFilterLayers.panel,
  maxHeight: 'min(620px, var(--reka-popover-content-available-height))',
};
const calendarStyles = {
  popup: { root: { zIndex: timeFilterLayers.calendar } },
};
const dateFields = [
  { key: 'startTs', label: 'start' },
  { key: 'endTs', label: 'end' },
] as const;
const rangeOptions = computed(() => {
  const options = timeDurations.map((value) => ({
    value,
    label: $t(`widget.timeFilter.durations.${value}`),
  }));
  if (draft.value.mode === 'history') {
    options.unshift({ value: 0, label: $t('widget.timeFilter.custom') });
  }
  return options;
});
const aggregationOptions = computed(() =>
  aggregations.map((value) => ({
    value,
    label: $t(`widget.timeFilter.aggregations.${value}`),
  })),
);
const modeTabs = computed(() =>
  ['realtime', 'history'].map((value) => ({
    value,
    label: $t(`widget.timeFilter.${value}`),
  })),
);
const label = computed(() => {
  const value = props.modelValue;
  if (value.mode === 'realtime') {
    return `${$t('widget.timeFilter.realtime')} · ${$t(`widget.timeFilter.durations.${value.duration}`)}`;
  }
  const start = dayjs(value.startTs).format('MM/DD');
  const end = dayjs(value.endTs).format('MM/DD');
  return `${$t('widget.timeFilter.history')} · ${start}–${end}`;
});

function setOpen(value: boolean) {
  if (value) {
    draft.value = {
      ...props.modelValue,
      interval: props.modelValue.interval || defaultAggregationInterval,
    };
    submitted.value = false;
  }
  open.value = value;
}

function setDuration(duration: number) {
  draft.value.duration = duration;
  if (duration) {
    draft.value.endTs = Date.now();
    draft.value.startTs = draft.value.endTs - duration;
  }
}

function setMode(mode: string | undefined) {
  if (mode === draft.value.mode || (mode !== 'realtime' && mode !== 'history'))
    return;
  draft.value.mode = mode;
  setDuration(draft.value.duration || 86_400_000);
}

function setDate(field: 'endTs' | 'startTs', timestamp: number) {
  draft.value[field] = timestamp;
  draft.value.duration = 0;
}

function setLimit(value: null | number | string) {
  draft.value.limit = Number(value ?? Number.NaN);
}

// The calendar is portalled outside the popover; selecting a date must not dismiss it.
function keepCalendarOpen(event: CustomEvent<{ originalEvent: Event }>) {
  const target = event.detail.originalEvent.target;
  if (target instanceof Element && target.closest(`.${calendarClass}`)) {
    event.preventDefault();
  }
}

function apply() {
  submitted.value = true;
  if (error.value) return;
  emit('update:modelValue', { ...draft.value });
  open.value = false;
}
</script>

<template>
  <Popover :open="open" @update:open="setOpen">
    <PopoverTrigger as-child>
      <VbenButton
        type="button"
        variant="outline"
        size="sm"
        class="time-filter-trigger h-[30px] gap-1.5 px-2"
        :aria-label="`${$t('widget.timeFilter.title')}：${title ?? ''}`"
        :title="label"
      >
        <IconifyIcon icon="lucide:clock-3" class="size-3.5 shrink-0" />
        <span class="max-w-[130px] truncate">{{ label }}</span>
        <IconifyIcon icon="lucide:chevron-down" class="size-3 shrink-0" />
      </VbenButton>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      class="time-filter-popover w-[340px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border shadow-md"
      :style="panelStyle"
      :aria-label="$t('widget.timeFilter.title')"
      @interact-outside="keepCalendarOpen"
    >
      <form class="space-y-4" @submit.prevent="apply">
        <h3 class="text-sm font-medium">{{ $t('widget.timeFilter.title') }}</h3>
        <VbenSegmented
          :model-value="draft.mode"
          :tabs="modeTabs"
          class="time-filter-mode"
          :aria-label="$t('widget.timeFilter.mode')"
          @update:model-value="setMode"
        />
        <SelectField
          :id="`${id}-range`"
          :model-value="draft.duration"
          :label="$t('widget.timeFilter.range')"
          :options="rangeOptions"
          @update:model-value="setDuration"
        />
        <template v-if="draft.mode === 'history'">
          <div v-for="field in dateFields" :key="field.key" class="space-y-1.5">
            <Label :for="`${id}-${field.key}`">
              {{ $t(`widget.timeFilter.${field.label}`) }}
            </Label>
            <DatePicker
              :id="`${id}-${field.key}`"
              :value="dayjs(draft[field.key])"
              format="YYYY-MM-DD HH:mm"
              :show-time="{ format: 'HH:mm' }"
              :allow-clear="false"
              :need-confirm="false"
              class="h-[34px] w-full"
              :classes="{ popup: { root: calendarClass } }"
              :styles="calendarStyles"
              @change="setDate(field.key, Number($event?.valueOf()))"
              @keydown.esc.stop
            />
          </div>
        </template>
        <div class="grid grid-cols-2 gap-3">
          <SelectField
            :id="`${id}-agg`"
            v-model="draft.agg"
            :label="$t('widget.timeFilter.aggregation')"
            :options="aggregationOptions"
          />
          <div class="space-y-1.5">
            <Label :for="`${id}-limit`">{{
              $t('widget.timeFilter.limit')
            }}</Label>
            <InputNumber
              :id="`${id}-limit`"
              :value="Number.isFinite(draft.limit) ? draft.limit : null"
              :min="timeFilterLimits.min"
              :max="timeFilterLimits.max"
              :step="1"
              :precision="0"
              class="h-[34px] w-full"
              @update:value="setLimit"
            />
          </div>
        </div>
        <IntervalField
          v-if="draft.agg !== 'NONE'"
          :id="`${id}-interval`"
          v-model="draft.interval"
        />
        <p v-if="error" role="alert" class="text-destructive text-xs">
          {{ $t(`widget.timeFilter.errors.${error}`, timeFilterLimits) }}
        </p>
        <div class="flex justify-end gap-2 border-t pt-3">
          <VbenButton
            type="button"
            variant="outline"
            size="sm"
            @click="open = false"
          >
            {{ $t('widget.timeFilter.cancel') }}
          </VbenButton>
          <VbenButton type="submit" size="sm">
            {{ $t('widget.timeFilter.apply') }}
          </VbenButton>
        </div>
      </form>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.time-filter-mode {
  width: 100%;
}

.time-filter-mode :deep([data-slot='tabs-list']) {
  height: 34px;
  border-radius: 8px;
}

.time-filter-mode :deep([role='tab']) {
  min-width: 0;
  padding-inline: 8px;
  font-size: 14px;
  line-height: 18px;
}
</style>
