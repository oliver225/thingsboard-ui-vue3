<script setup lang="ts">
import type { UsageMetric, UsageMetricKey, UsagePeriod } from './metrics';

import type { EntityData } from '#/api/tb/entity-query';

import {
  computed,
  defineAsyncComponent,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { VbenButton } from '@vben-core/shadcn-ui';

import { Alert, Button, Empty, Spin } from 'antdv-next';

import { getApiUsageState } from '#/api/tb/usage';
import { $t } from '#/locales';

import { defaultUsageMetrics, numericValue, usageMetrics } from './metrics';
import UsageChart from './usage-chart.vue';

defineOptions({ name: 'ApiUsage' });
const QueueStatistics = defineAsyncComponent(
  () => import('./queue-statistics.vue'),
);
const statusColors = {
  ENABLED: '#198038',
  WARNING: '#faa405',
  DISABLED: '#d12730',
  UNKNOWN: '#8c8c8c',
};
const usageKeys = [
  ...new Set(
    usageMetrics.flatMap((item) => [item.count, item.limit, item.state]),
  ),
];
const showQueue = ref(false);
const contentRef = ref<HTMLElement>();
const selected = ref<UsageMetricKey>();
const usage = ref<EntityData>();
const loading = ref(false);
const loadError = ref(false);
const refreshToken = ref(0);
let usageRequest = 0;
let timer: ReturnType<typeof setInterval> | undefined;

const charts = computed<{ metric: UsageMetric; period: UsagePeriod }[]>(() => {
  const metric = usageMetrics.find((item) => item.key === selected.value);
  if (metric) {
    return (['hour', 'day', 'month'] as const).map((period) => ({
      metric,
      period,
    }));
  }
  return usageMetrics
    .filter((item) => defaultUsageMetrics.includes(item.key))
    .map((metric) => ({ metric, period: 'hour' }));
});
const cards = computed(() => {
  const latest = usage.value?.latest?.TIME_SERIES ?? {};
  return usageMetrics.map((item) => {
    const count = numericValue(latest[item.count]?.value);
    const limit = numericValue(latest[item.limit]?.value);
    const state = String(latest[item.state]?.value ?? '').toUpperCase();
    const status =
      (['DISABLED', 'ENABLED', 'WARNING'] as const).find(
        (value) => value === state,
      ) ?? 'UNKNOWN';
    return {
      ...item,
      count,
      limit,
      status,
      color: statusColors[status],
      percent:
        count !== undefined && limit !== undefined && limit > 0
          ? Math.min(100, Math.max(0, (count / limit) * 100))
          : 0,
    };
  });
});
function displayNumber(value: number | undefined) {
  return value === undefined ? '—' : value.toLocaleString();
}
async function loadUsage(refreshCharts = true) {
  const version = ++usageRequest;
  loading.value = true;
  loadError.value = false;
  try {
    const result = await getApiUsageState(usageKeys);
    if (version !== usageRequest) return;
    usage.value = result;
    if (refreshCharts) ++refreshToken.value;
  } catch {
    if (version === usageRequest) {
      usage.value = undefined;
      loadError.value = true;
    }
  } finally {
    if (version === usageRequest) loading.value = false;
  }
}
function selectMetric(key?: UsageMetricKey) {
  showQueue.value = false;
  selected.value = key;
}
function startRefresh() {
  if (!timer)
    timer = setInterval(() => {
      if (!document.hidden && !loading.value && !showQueue.value)
        void loadUsage(false);
    }, 60_000);
}
function stopRefresh() {
  clearInterval(timer);
  timer = undefined;
  ++usageRequest;
  loading.value = false;
}
watch([selected, showQueue], () => {
  contentRef.value?.scrollTo({ top: 0 });
});
onMounted(() => {
  void loadUsage();
  startRefresh();
});
onActivated(startRefresh);
onDeactivated(stopRefresh);
onBeforeUnmount(stopRefresh);
</script>

<template>
  <Page auto-content-height content-class="usage-page-content">
    <div class="usage-layout">
      <aside class="usage-sidebar bg-card">
        <header class="usage-header">
          <div class="usage-heading">
            <h1>{{ $t('usage.menu') }}</h1>
            <p>{{ $t('usage.fields.monthlyUsage') }}</p>
          </div>
          <Button
            v-if="selected || showQueue"
            type="text"
            :aria-label="$t('usage.actions.defaultView')"
            :title="$t('usage.actions.defaultView')"
            @click="selectMetric()"
          >
            <template #icon><IconifyIcon icon="lucide:layout-grid" /></template>
          </Button>
          <Button
            v-else
            type="text"
            :loading="loading"
            :aria-label="$t('usage.actions.refresh')"
            @click="loadUsage()"
          >
            <template #icon><IconifyIcon icon="lucide:refresh-cw" /></template>
          </Button>
        </header>
        <Alert
          v-if="loadError"
          class="mx-4 mb-3"
          type="error"
          show-icon
          :message="$t('usage.messages.loadError')"
        >
          <template #action>
            <Button size="small" @click="loadUsage()">
              {{ $t('usage.actions.retry') }}
            </Button>
          </template>
        </Alert>
        <div class="usage-options">
          <Spin :spinning="loading && !usage">
            <nav :aria-label="$t('usage.fields.metric')">
              <VbenButton
                v-for="card in cards"
                :key="card.key"
                type="button"
                variant="ghost"
                class="usage-row"
                :style="{ '--usage-status-color': card.color }"
                :class="{ active: selected === card.key && !showQueue }"
                :aria-pressed="selected === card.key && !showQueue"
                @click="selectMetric(card.key)"
              >
                <span class="usage-icon" aria-hidden="true">
                  <IconifyIcon :icon="card.icon" class="size-4" />
                </span>
                <span class="usage-row-body">
                  <span class="usage-row-top">
                    <span class="usage-label">{{
                      $t(`usage.options.metrics.${card.key}`)
                    }}</span>
                    <IconifyIcon
                      icon="lucide:chevron-right"
                      class="usage-chevron size-3.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="usage-row-bottom">
                    <span class="usage-amount">
                      <span class="usage-count">{{
                        displayNumber(card.count)
                      }}</span>
                      <span class="usage-limit">/
                        {{
                          card.limit === 0 ? '∞' : displayNumber(card.limit)
                        }}</span>
                    </span>
                    <span class="usage-status">
                      <span class="usage-status-dot"></span>
                      {{ $t(`usage.options.status.${card.status}`) }}
                    </span>
                  </span>
                  <span
                    v-if="card.limit !== undefined && card.limit > 0"
                    class="usage-progress"
                    aria-hidden="true"
                  >
                    <span :style="{ width: `${card.percent}%` }"></span>
                  </span>
                </span>
              </VbenButton>
              <VbenButton
                type="button"
                variant="ghost"
                class="usage-row queue-entry"
                :class="{ active: showQueue }"
                :aria-pressed="showQueue"
                aria-controls="usage-content"
                @click="showQueue = true"
              >
                <span class="usage-icon" aria-hidden="true">
                  <IconifyIcon icon="lucide:workflow" class="size-4" />
                </span>
                <span class="usage-row-top">
                  <span class="usage-label">{{
                    $t('usage.actions.queueStats')
                  }}</span>
                  <IconifyIcon
                    icon="lucide:chevron-right"
                    class="usage-chevron size-3.5"
                    aria-hidden="true"
                  />
                </span>
              </VbenButton>
            </nav>
          </Spin>
        </div>
      </aside>
      <main id="usage-content" ref="contentRef" class="usage-content">
        <QueueStatistics v-if="showQueue" />
        <template v-else>
          <Empty
            v-if="!usage && !loading && !loadError"
            class="mb-4"
            :description="$t('usage.messages.noUsage')"
          />
          <div class="usage-charts">
            <UsageChart
              v-for="chart in charts"
              :key="`${chart.metric.key}-${chart.period}`"
              :class="{ 'usage-hourly': selected && chart.period === 'hour' }"
              :title="
                $t(`usage.chart.${chart.period}`, {
                  metric: $t(`usage.options.metrics.${chart.metric.key}`),
                })
              "
              :metric="chart.metric"
              :period="chart.period"
              :entity-id="usage?.entityId"
              :refresh-token="refreshToken"
            />
          </div>
        </template>
      </main>
    </div>
  </Page>
</template>

<style scoped>
.usage-layout {
  display: grid;
  grid-template-columns: minmax(280px, 28%) minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.usage-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.usage-header {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 16px;
  border-bottom: 1px solid var(--color-border);
}

.usage-heading h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.usage-heading p {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--color-muted-foreground);
}

.usage-options {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.usage-options nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.usage-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  width: 100%;
  height: auto;
  min-height: 88px;
  padding: 12px;
  text-align: left;
  white-space: normal;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 2%);
  transition:
    background-color 150ms,
    border-color 150ms;
}

.usage-row:hover {
  background: color-mix(in srgb, var(--color-muted) 55%, var(--color-card));
  border-color: color-mix(
    in srgb,
    var(--color-muted-foreground) 30%,
    var(--color-border)
  );
}

.usage-row.active {
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-card));
  border-color: color-mix(
    in srgb,
    var(--color-primary) 60%,
    var(--color-border)
  );
}

.usage-row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.usage-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-muted-foreground);
  background: var(--color-muted);
  border-radius: 8px;
}

.active .usage-icon {
  color: var(--color-primary-foreground);
  background: var(--color-primary);
}

.usage-row-body {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
}

.usage-row-top,
.usage-row-bottom {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.usage-label {
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: var(--color-foreground);
}

.usage-chevron {
  flex-shrink: 0;
  color: var(--color-muted-foreground);
  opacity: 0.5;
}

.active .usage-chevron {
  color: var(--color-primary);
  opacity: 1;
}

.usage-row-bottom {
  flex-wrap: wrap;
  row-gap: 4px;
}

.usage-amount {
  display: flex;
  gap: 5px;
  align-items: baseline;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}

.usage-count {
  font-size: 19px;
  font-weight: 600;
  line-height: 24px;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
}

.usage-limit {
  font-size: 11px;
  color: var(--color-muted-foreground);
  white-space: nowrap;
}

.usage-status {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: var(--color-foreground);
  background: color-mix(
    in srgb,
    var(--usage-status-color) 8%,
    var(--color-card)
  );
  border: 1px solid
    color-mix(in srgb, var(--usage-status-color) 20%, var(--color-border));
  border-radius: 6px;
}

.usage-status-dot {
  width: 6px;
  height: 6px;
  background: var(--usage-status-color);
  border-radius: 50%;
}

.usage-progress {
  height: 3px;
  overflow: hidden;
  background: var(--color-muted);
  border-radius: 3px;
}

.usage-progress > span {
  display: block;
  height: 100%;
  background: var(--usage-status-color);
  border-radius: inherit;
}

.queue-entry {
  align-items: center;
  min-height: 60px;
}

.usage-content {
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

:deep(.usage-page-content) {
  overflow: hidden;
}

.usage-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.usage-hourly {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .usage-layout {
    grid-template-columns: 290px minmax(0, 1fr);
  }

  .usage-charts {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .usage-layout {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    overflow: visible;
  }

  .usage-sidebar {
    max-height: 360px;
  }

  .usage-content {
    height: auto;
    padding-right: 0;
    overflow: visible;
  }

  :deep(.usage-page-content) {
    overflow-y: auto;
  }
}
</style>
