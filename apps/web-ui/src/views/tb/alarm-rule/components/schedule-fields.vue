<script setup lang="ts">
import type { AlarmRuleSchedule } from '#/api/tb/alarm-rule';

import { computed } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { VbenSelect } from '@vben-core/shadcn-ui';

import { Segmented, Select } from 'antdv-next';

import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { options, validateSchedule } from '../form-data';
import { useFormNode } from '../use-form-node';
import ScheduleTimeRange from './schedule-time-range.vue';

const props = defineProps<{ argumentNames: string[] }>();
const model = defineModel<AlarmRuleSchedule>({ required: true });
const { invalid, ownErrors } = useFormNode(() => [
  validateSchedule(model.value, props.argumentNames),
]);
const mode = computed({
  get: () =>
    typeof model.value.dynamicValueArgument === 'string' ? 'dynamic' : 'static',
  set(value: string) {
    if (value === 'dynamic') {
      model.value = { dynamicValueArgument: props.argumentNames[0] ?? '' };
    } else {
      handleChangeType('ANY_TIME');
    }
  },
});
const days = computed(() =>
  Array.from({ length: 7 }, (_, index) => ({
    value: index + 1,
    label: $t(`alarm-rule.options.weekdays.${index}`),
  })),
);
const timezones = computed(() =>
  [
    ...new Set([
      model.value.staticValue?.timezone,
      'UTC',
      ...Intl.supportedValuesOf('timeZone'),
    ]),
  ]
    .filter((value): value is string => !!value)
    .map((value) => {
      try {
        const offset = new Intl.DateTimeFormat('en', {
          timeZone: value,
          timeZoneName: 'longOffset',
        })
          .formatToParts(new Date())
          .find((part) => part.type === 'timeZoneName')
          ?.value.replace('GMT', 'UTC');
        return { value, label: `${value} (${offset})` };
      } catch {
        return { value, label: value };
      }
    }),
);
function setDay(day: number, enabled: boolean) {
  const time = model.value.staticValue;
  if (!time) return;
  const selected = new Set(time.daysOfWeek);
  if (enabled) selected.add(day);
  else selected.delete(day);
  time.daysOfWeek = [...selected].toSorted((a, b) => a - b);
}
function handleChangeType(value: unknown) {
  const type =
    value === 'CUSTOM' || value === 'SPECIFIC_TIME' ? value : 'ANY_TIME';
  const timezone =
    model.value.staticValue?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  model.value = {
    staticValue: {
      type,
      ...(type === 'ANY_TIME'
        ? {}
        : {
            timezone,
            ...(type === 'SPECIFIC_TIME'
              ? { daysOfWeek: [1, 2, 3, 4, 5], startsOn: 0, endsOn: 0 }
              : {
                  items: Array.from({ length: 7 }, (_, index) => ({
                    dayOfWeek: index + 1,
                    enabled: true,
                    startsOn: 0,
                    endsOn: 0,
                  })),
                }),
          }),
    },
  };
}
</script>
<template>
  <FormSection
    size="small"
    :title="$t('alarm-rule.fields.expression')"
    content-class="space-y-5"
  >
    <template #actions>
      <Segmented
        shape="round"
        v-model:value="mode"
        :options="[
          { value: 'static', label: $t('alarm-rule.options.static') },
          { value: 'dynamic', label: $t('alarm-rule.options.dynamic') },
        ]"
        :aria-label="$t('alarm-rule.fields.expression')"
      />
    </template>
    <label v-if="mode === 'dynamic'" class="grid gap-2 text-sm">
      <span>{{ $t('alarm-rule.fields.argument') }}</span>
      <VbenSelect
        v-model="model.dynamicValueArgument"
        :options="argumentNames.map((value) => ({ value, label: value }))"
        class="w-full"
        :aria-label="$t('alarm-rule.fields.argument')"
      />
    </label>
    <template v-else-if="model.staticValue">
      <VbenSelect
        :model-value="model.staticValue.type"
        :options="options(['ANY_TIME', 'SPECIFIC_TIME', 'CUSTOM'])"
        class="w-full"
        :aria-label="$t('alarm-rule.fields.scheduleType')"
        @update:model-value="handleChangeType"
      />
      <template v-if="model.staticValue.type !== 'ANY_TIME'">
        <label class="grid gap-2 text-sm">
          <span>{{ $t('alarm-rule.fields.timezone') }}</span>
          <Select
            v-model:value="model.staticValue.timezone"
            show-search
            option-filter-prop="label"
            :options="timezones"
            class="w-full"
            :aria-label="$t('alarm-rule.fields.timezone')"
          />
        </label>
        <template v-if="model.staticValue.type === 'SPECIFIC_TIME'">
          <div
            class="flex flex-wrap gap-2"
            role="group"
            :aria-label="$t('alarm-rule.options.days')"
          >
            <VbenButton
              v-for="day in days"
              :key="day.value"
              type="button"
              :variant="
                model.staticValue.daysOfWeek?.includes(day.value)
                  ? 'default'
                  : 'secondary'
              "
              class="h-9 gap-2 rounded-full px-4 font-normal shadow-none"
              :aria-label="day.label"
              :aria-pressed="
                !!model.staticValue.daysOfWeek?.includes(day.value)
              "
              @click="
                setDay(
                  day.value,
                  !model.staticValue.daysOfWeek?.includes(day.value),
                )
              "
            >
              <IconifyIcon
                v-if="model.staticValue.daysOfWeek?.includes(day.value)"
                icon="lucide:check"
                class="size-4 shrink-0"
              />
              {{ day.label }}
            </VbenButton>
          </div>
          <ScheduleTimeRange
            v-model:start="model.staticValue.startsOn"
            v-model:end="model.staticValue.endsOn"
          />
        </template>
        <div v-else class="space-y-4">
          <div
            v-for="item in model.staticValue.items"
            :key="item.dayOfWeek"
            class="grid items-center gap-3 md:grid-cols-[7rem_minmax(0,1fr)]"
          >
            <VbenButton
              type="button"
              :variant="item.enabled ? 'default' : 'secondary'"
              class="h-9 justify-self-start gap-2 rounded-full px-4 font-normal shadow-none md:mt-7 md:w-full"
              :aria-label="days[item.dayOfWeek - 1]?.label"
              :aria-pressed="item.enabled"
              @click="item.enabled = !item.enabled"
            >
              <IconifyIcon
                v-if="item.enabled"
                icon="lucide:check"
                class="size-4 shrink-0"
              />
              {{ days[item.dayOfWeek - 1]?.label }}
            </VbenButton>
            <ScheduleTimeRange
              v-model:start="item.startsOn"
              v-model:end="item.endsOn"
              :disabled="!item.enabled"
              :label="days[item.dayOfWeek - 1]?.label"
            />
          </div>
        </div>
        <p class="text-muted-foreground text-xs">
          {{ $t('alarm-rule.messages.fullDayHint') }}
        </p>
      </template>
    </template>
    <p
      v-if="invalid && ownErrors[0]"
      role="alert"
      class="text-destructive text-xs"
      data-alarm-invalid
      tabindex="-1"
    >
      {{ ownErrors[0] }}
    </p>
  </FormSection>
</template>
