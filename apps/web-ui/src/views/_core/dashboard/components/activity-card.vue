<script setup lang="ts">
import type { TimeFilterValue } from '#/components/widget';

import { computed, ref, watch } from 'vue';

import { VbenSegmented } from '@vben/common-ui';

import { Button } from 'antdv-next';

import { TrendChart } from '#/components/trend-chart';
import { TimeFilter } from '#/components/widget';
import { $t } from '#/locales';
import { defaultTimeFilter } from '#/views/tb/usage/time-filter';

import { useUsage } from '../use-usage';
import HomeCard from './home-card.vue';

const props = defineProps<{ system?: boolean }>();
const selected = ref('transportMsgCountHourly');
const filter = ref<TimeFilterValue>(defaultTimeFilter('day'));
const options = computed(() => [
  {
    label: $t('home.messages'),
    value: 'transportMsgCountHourly',
    unit: $t('home.units.messages'),
    bar: true,
  },
  ...(props.system
    ? []
    : [
        {
          label: $t('home.activeDevices'),
          value: 'activeDevicesCountHourly',
          unit: '',
          bar: false,
        },
      ]),
  {
    label: $t('home.dataPoints'),
    value: 'storageDataPointsCountHourly',
    unit: $t('home.units.dataPoints'),
    bar: true,
  },
]);
const metric = computed(() =>
  options.value.find((item) => item.value === selected.value),
);
watch(selected, () => {
  filter.value = { ...filter.value, agg: metric.value?.bar ? 'SUM' : 'AVG' };
});
const { getPoints, status, startTs, endTs, refresh } = useUsage(
  () => [selected.value],
  filter,
);
const series = computed(() => [
  {
    name: metric.value?.label ?? '',
    color: '#385b8c',
    data: getPoints(selected.value),
  },
]);
</script>

<template>
  <HomeCard v-if="metric" :title="$t('home.activity')" fill>
    <template #title>
      <VbenSegmented
        v-model="selected"
        :tabs="options"
        :aria-label="$t('home.activity')"
      />
    </template>
    <template #extra>
      <TimeFilter v-model="filter" :title="$t('home.activity')" />
    </template>
    <div
      v-if="status === 'error' || status === 'stale'"
      class="flex shrink-0 items-center justify-between text-sm text-red-500"
    >
      {{ $t('home.loadFailed') }}
      <Button size="small" @click="refresh">{{ $t('home.retry') }}</Button>
    </div>
    <TrendChart
      :series="series"
      :unit="metric.unit"
      :bar="metric.bar"
      :start-ts="startTs"
      :end-ts="endTs"
      hide-legend
      height="100%"
      class="min-h-0 flex-1"
      :empty-message="
        $t(status === 'loading' ? 'home.loading' : 'home.noTelemetry')
      "
    />
  </HomeCard>
</template>
