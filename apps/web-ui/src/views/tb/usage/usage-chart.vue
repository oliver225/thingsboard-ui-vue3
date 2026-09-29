<script setup lang="ts">
import type { UsageMetric, UsagePeriod } from './metrics';

import type { TimeFilterValue } from '#/components/widget';
import type { EntityId } from '#/types/tb';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Alert, Button, Modal, Spin } from 'antdv-next';
import dayjs from 'dayjs';

import { getTimeseries } from '#/api/tb/telemetry';
import { TrendChart } from '#/components/trend-chart';
import { TimeFilter } from '#/components/widget';
import { $t } from '#/locales';

import { telemetryPoints, usageColors } from './metrics';
import { defaultTimeFilter, timeFilterQuery } from './time-filter';

const props = defineProps<{
  title: string;
  metric: UsageMetric;
  period: UsagePeriod;
  entityId?: EntityId;
  refreshToken: number;
}>();
const filter = ref(defaultTimeFilter(props.period));
const range = ref(timeFilterQuery(filter.value));
const data = ref<[number, number][]>([]);
const loading = ref(false);
const error = ref(false);
const truncated = ref(false);
const fullscreen = ref(false);
let version = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let paused = false;
const series = computed(() => [
  {
    name: $t(`usage.options.metrics.${props.metric.key}`),
    color: usageColors[props.metric.key],
    data: data.value,
  },
]);
const subtitle = computed(() =>
  filter.value.mode === 'realtime'
    ? $t('widget.timeFilter.realtimeDescription', {
        range: $t(`widget.timeFilter.durations.${filter.value.duration}`),
      })
    : `${dayjs(range.value.startTs).format('YYYY-MM-DD HH:mm')} – ${dayjs(range.value.endTs).format('YYYY-MM-DD HH:mm')}`,
);
const showPointCount = computed(() =>
  ['AVG', 'MAX', 'MIN'].includes(filter.value.agg),
);
const summaryLabel = computed(() =>
  showPointCount.value
    ? $t('widget.timeFilter.points')
    : $t('usage.fields.total'),
);
const summary = computed(() =>
  showPointCount.value
    ? data.value.length
    : data.value.reduce((sum, point) => sum + point[1], 0),
);
async function load() {
  const request = ++version;
  data.value = [];
  error.value = false;
  truncated.value = false;
  if (!props.entityId) {
    loading.value = false;
    return;
  }
  const query = timeFilterQuery(filter.value);
  range.value = query;
  loading.value = true;
  const key =
    props.period === 'month'
      ? props.metric.count
      : `${props.metric.count}Hourly`;
  try {
    const response = await getTimeseries(props.entityId, {
      ...query,
      keys: key,
      orderBy: 'DESC',
      useStrictDataTypes: true,
    });
    if (request !== version) return;
    const points = telemetryPoints(response[key] ?? []);
    data.value = points.slice(-query.limit);
    truncated.value = query.agg === 'NONE' && points.length >= query.limit;
  } catch {
    if (request === version) error.value = true;
  } finally {
    if (request === version) loading.value = false;
  }
}
function applyFilter(value: TimeFilterValue) {
  filter.value = value;
  void load();
}
function startRefresh() {
  if (paused) {
    paused = false;
    void load();
  }
  if (!timer)
    timer = setInterval(() => {
      if (
        !document.hidden &&
        !loading.value &&
        filter.value.mode === 'realtime'
      )
        void load();
    }, 60_000);
}
function stopRefresh() {
  paused = true;
  clearInterval(timer);
  timer = undefined;
  ++version;
  loading.value = false;
}
watch([() => props.entityId?.id, () => props.refreshToken], load, {
  immediate: true,
});
onMounted(startRefresh);
onActivated(startRefresh);
onDeactivated(stopRefresh);
onBeforeUnmount(stopRefresh);
</script>

<template>
  <section class="usage-chart bg-card min-w-0 rounded-xl border p-4">
    <header class="mb-2 flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold">{{ title }}</h2>
        <p class="text-muted-foreground mt-1 text-xs">{{ subtitle }}</p>
      </div>
      <div class="ml-auto flex shrink-0 items-center gap-1">
        <TimeFilter
          :model-value="filter"
          :title="title"
          @update:model-value="applyFilter"
        />
        <Button
          type="text"
          :aria-label="`${$t('usage.actions.fullscreen')}：${title}`"
          @click="fullscreen = true"
        >
          <template #icon>
            <IconifyIcon icon="lucide:maximize-2" class="size-4" />
          </template>
        </Button>
      </div>
    </header>
    <Alert
      v-if="error"
      type="error"
      show-icon
      :message="$t('usage.messages.loadError')"
    >
      <template #action>
        <Button size="small" @click="load()">
          {{ $t('usage.actions.retry') }}
        </Button>
      </template>
    </Alert>
    <Spin :spinning="loading">
      <TrendChart
        :series="series"
        :start-ts="range.startTs"
        :end-ts="range.endTs"
        bar
        hide-legend
        height="clamp(200px, 27vh, 360px)"
      />
    </Spin>
    <div class="text-muted-foreground mt-4 text-sm">
      <div class="mb-2 text-right">{{ summaryLabel }}</div>
      <div
        v-for="item in series"
        :key="item.name"
        class="flex items-center justify-between gap-3"
      >
        <span class="flex min-w-0 items-center gap-1.5"><span
            class="size-2 shrink-0 rounded-full"
            :style="{ backgroundColor: item.color }"
          ></span>{{ item.name }}</span>
        <span class="tabular-nums">{{
          error || loading || !item.data.length ? '—' : summary.toLocaleString()
        }}</span>
      </div>
    </div>
    <p v-if="truncated" class="text-muted-foreground mt-3 text-xs">
      {{ $t('widget.timeFilter.limitReached') }}
    </p>
    <Modal
      v-model:open="fullscreen"
      :title="title"
      :footer="null"
      width="calc(100vw - 48px)"
      :style="{ top: '24px' }"
      destroy-on-close
    >
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p class="text-muted-foreground text-xs">{{ subtitle }}</p>
        <TimeFilter
          :model-value="filter"
          :title="title"
          @update:model-value="applyFilter"
        />
      </div>
      <Alert
        v-if="error"
        type="error"
        :message="$t('usage.messages.loadError')"
      />
      <Spin :spinning="loading">
        <TrendChart
          v-if="fullscreen"
          :series="series"
          :start-ts="range.startTs"
          :end-ts="range.endTs"
          bar
          height="calc(100vh - 190px)"
        />
      </Spin>
    </Modal>
  </section>
</template>
