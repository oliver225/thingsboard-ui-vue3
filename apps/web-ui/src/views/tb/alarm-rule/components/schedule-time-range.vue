<script setup lang="ts">
import { computed } from 'vue';

import { TimePicker } from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';

const props = defineProps<{ disabled?: boolean; label?: string }>();
const start = defineModel<number>('start');
const end = defineModel<number>('end');
const timeOfDay = (value?: number) =>
  value === undefined
    ? undefined
    : dayjs().startOf('day').add(value, 'millisecond');
const milliseconds = (value: unknown) =>
  dayjs.isDayjs(value)
    ? (value.hour() * 3600 + value.minute() * 60 + value.second()) * 1000
    : undefined;
const preview = computed(() => {
  if (start.value === undefined || end.value === undefined) return '—';
  if (start.value === end.value) return $t('alarm-rule.options.allDay');
  const format =
    start.value % 60_000 || end.value % 60_000 ? 'h:mm:ss A' : 'h:mm A';
  return `${timeOfDay(start.value)?.format(format)} – ${timeOfDay(end.value)?.format(format)}`;
});
</script>
<template>
  <div
    class="grid min-w-0 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
  >
    <label
      class="grid min-w-0 gap-2 text-sm"
      :class="{ 'text-muted-foreground': disabled }"
    >
      <span><span v-if="label" class="sr-only">{{ label }} </span>{{ $t('alarm-rule.fields.startsOn') }}</span>
      <TimePicker
        :value="timeOfDay(start)"
        format="HH:mm:ss"
        :disabled="disabled"
        :allow-clear="false"
        :aria-label="
          [props.label, $t('alarm-rule.fields.startsOn')]
            .filter(Boolean)
            .join(' ')
        "
        class="h-10 w-full"
        @update:value="(value) => (start = milliseconds(value))"
      />
    </label>
    <label
      class="grid min-w-0 gap-2 text-sm"
      :class="{ 'text-muted-foreground': disabled }"
    >
      <span><span v-if="label" class="sr-only">{{ label }} </span>{{ $t('alarm-rule.fields.endsOn') }}</span>
      <TimePicker
        :value="timeOfDay(end)"
        format="HH:mm:ss"
        :disabled="disabled"
        :allow-clear="false"
        :aria-label="
          [props.label, $t('alarm-rule.fields.endsOn')]
            .filter(Boolean)
            .join(' ')
        "
        class="h-10 w-full"
        @update:value="(value) => (end = milliseconds(value))"
      />
    </label>
    <p
      class="text-muted-foreground text-center text-sm tabular-nums sm:pt-7"
      aria-live="polite"
    >
      {{ preview }}
    </p>
  </div>
</template>
