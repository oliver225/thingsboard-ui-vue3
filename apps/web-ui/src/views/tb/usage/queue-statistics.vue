<script setup lang="ts">
import type { BasicColumn } from '#/adapter/table';
import type { Timeseries } from '#/api/tb/telemetry';
import type { QueueStatistics } from '#/api/tb/usage';
import type { TimeFilterValue } from '#/components/widget';

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
import { formatDateTime } from '@vben/utils';

import { Alert, Button, Empty, Modal, Select, Spin } from 'antdv-next';

import { BasicTable } from '#/adapter/table';
import { getQueueStatistics, getQueueUsageTelemetry } from '#/api/tb/usage';
import { TrendChart } from '#/components/trend-chart';
import { TimeFilter } from '#/components/widget';
import { $t } from '#/locales';

import { telemetryPoints } from './metrics';
import { defaultTimeFilter, timeFilterQuery } from './time-filter';
const selectedQueueId = ref<string>();
const queues = ref<QueueStatistics[]>([]);
const queueHistory = ref<Timeseries>({});
const loadingQueue = ref(false);
const loadingList = ref(false);
const queueError = ref(false);
const panelFilters = ref<[TimeFilterValue, TimeFilterValue]>([
  defaultTimeFilter('queue'),
  defaultTimeFilter('queue'),
]);
type PanelRange = ReturnType<typeof timeFilterQuery>;
const panelRanges = ref<[PanelRange, PanelRange]>([
  timeFilterQuery(panelFilters.value[0]),
  timeFilterQuery(panelFilters.value[1]),
]);
let timer: ReturnType<typeof setInterval> | undefined;
const expandedPanel = ref<number>();
let queueRequest = 0;
let queueListRequest = 0;
let queueController: AbortController | undefined;
let paused = false;
const queueOptions = computed(() =>
  queues.value
    .filter((queue) => queue.id?.id)
    .map((queue) => ({
      value: queue.id?.id,
      label: `${queue.queueName} · ${queue.serviceId}`,
    })),
);

const queueKeys = [
  'successfulMsgs',
  'failedMsgs',
  'tmpFailed',
  'timeoutMsgs',
  'tmpTimeout',
];
const queueSeries = computed(() =>
  queueKeys.map((key, index) => ({
    color: ['#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#a855f7'][index],
    name: $t(`usage.options.queueMetrics.${key}`),
    data: telemetryPoints(queueHistory.value[key] ?? []),
  })),
);

const chartPanels = computed(() => [
  {
    title: $t('usage.sections.queueStats'),
    icon: 'lucide:activity',
    series: queueSeries.value.slice(0, 3),
    filter: panelFilters.value[0],
    range: panelRanges.value[0],
  },
  {
    title: $t('usage.sections.timeouts'),
    icon: 'lucide:timer',
    series: queueSeries.value.slice(3),
    filter: panelFilters.value[1],
    range: panelRanges.value[1],
  },
]);
const expandedChart = computed(() =>
  expandedPanel.value === undefined
    ? undefined
    : chartPanels.value[expandedPanel.value],
);

const exceptions = computed(() =>
  (queueHistory.value.ruleEngineException ?? [])
    .map((point, index) => {
      let details: Record<string, unknown> = {};
      try {
        const parsed: unknown = JSON.parse(String(point.value));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
          details = parsed as Record<string, unknown>;
      } catch {
        /* Plain-text exceptions remain visible. */
      }
      return {
        id: `${point.ts}-${index}`,
        ts: point.ts,
        ruleChainName: String(details.ruleChainName ?? '—'),
        ruleNodeName: String(details.ruleNodeName ?? '—'),
        message: String(details.message ?? point.value),
      };
    })
    .toSorted((a, b) => b.ts - a.ts),
);
const exceptionColumns = computed<BasicColumn[]>(() => [
  {
    dataIndex: 'ts',
    title: $t('tb.common.createdTime'),
    width: 180,
    customRender: ({ value }) => formatDateTime(value),
  },
  {
    dataIndex: 'ruleChainName',
    title: $t('usage.fields.ruleChain'),
    width: 180,
  },
  { dataIndex: 'ruleNodeName', title: $t('usage.fields.ruleNode'), width: 180 },
  {
    dataIndex: 'message',
    title: $t('usage.fields.exceptionMessage'),
    minWidth: 280,
  },
]);

const truncated = computed(
  () =>
    queueKeys.some(
      (key, index) =>
        (queueHistory.value[key]?.length ?? 0) >=
        panelFilters.value[index < 3 ? 0 : 1].limit,
    ) || (queueHistory.value.ruleEngineException?.length ?? 0) >= 1000,
);
async function loadQueues() {
  const version = ++queueListRequest;
  loadingList.value = true;
  queueError.value = false;
  try {
    const result: QueueStatistics[] = [];
    let page = 0;
    let hasNext = true;
    while (hasNext) {
      const data = await getQueueStatistics({ page, pageSize: 100 });
      if (version !== queueListRequest) return;
      result.push(...data.data);
      hasNext = data.hasNext;
      page++;
    }
    queues.value = result;
    if (result.some((queue) => queue.id?.id === selectedQueueId.value)) {
      await loadQueueHistory();
    } else {
      selectedQueueId.value = result[0]?.id?.id;
      if (!selectedQueueId.value) {
        ++queueRequest;
        queueController?.abort();
        queueHistory.value = {};
        loadingQueue.value = false;
      }
    }
  } catch {
    if (version === queueListRequest) {
      ++queueRequest;
      queueController?.abort();
      queues.value = [];
      selectedQueueId.value = undefined;
      queueHistory.value = {};
      loadingQueue.value = false;
      queueError.value = true;
    }
  } finally {
    if (version === queueListRequest) loadingList.value = false;
  }
}
async function loadQueueHistory(realtimeOnly = false) {
  const version = ++queueRequest;
  queueController?.abort();
  const controller = new AbortController();
  queueController = controller;
  if (!realtimeOnly) {
    queueHistory.value = {};
    queueError.value = false;
  }
  const entityId = queues.value.find(
    (queue) => queue.id?.id === selectedQueueId.value,
  )?.id;
  if (!entityId) {
    loadingQueue.value = false;
    return;
  }
  loadingQueue.value = true;
  const end = Date.now();

  const results = await Promise.allSettled([
    ...panelFilters.value.map(async (filter, index): Promise<Timeseries> => {
      if (realtimeOnly && filter.mode === 'history') return {};
      const query = timeFilterQuery(filter, end);
      panelRanges.value[index] = query;
      const keys = index === 0 ? queueKeys.slice(0, 3) : queueKeys.slice(3);
      const result = await getQueueUsageTelemetry(
        entityId,
        { keys, ...query },
        controller.signal,
      );
      return Object.fromEntries(
        Object.entries(result).map(([key, values]) => [
          key,
          values.toSorted((a, b) => a.ts - b.ts).slice(-query.limit),
        ]),
      );
    }),
    getQueueUsageTelemetry(
      entityId,
      {
        keys: ['ruleEngineException'],
        startTs: end - 30 * 86_400_000,
        endTs: end,
        limit: 1000,
      },
      controller.signal,
    ),
  ]);
  if (version !== queueRequest) return;
  for (const result of results) {
    if (result.status === 'fulfilled')
      Object.assign(queueHistory.value, result.value);
    else queueError.value = true;
  }
  loadingQueue.value = false;
}

watch(selectedQueueId, () => {
  if (selectedQueueId.value) void loadQueueHistory();
});
function applyPanelFilter(index: number, value: TimeFilterValue) {
  panelFilters.value[index] = value;
  void loadQueueHistory();
}
function startRefresh() {
  if (!timer)
    timer = setInterval(() => {
      if (
        !document.hidden &&
        !loadingList.value &&
        !loadingQueue.value &&
        panelFilters.value.some((filter) => filter.mode === 'realtime')
      )
        void loadQueueHistory(true);
    }, 60_000);
}
onMounted(() => {
  void loadQueues();
  startRefresh();
});
function stopQueries() {
  paused = true;
  clearInterval(timer);
  timer = undefined;
  ++queueListRequest;
  ++queueRequest;
  queueController?.abort();
  loadingList.value = false;
  loadingQueue.value = false;
}
onDeactivated(stopQueries);
onBeforeUnmount(stopQueries);
onActivated(() => {
  startRefresh();
  if (paused) {
    paused = false;
    void loadQueues();
  }
});
</script>
<template>
  <div class="queue-statistics flex min-w-0 flex-col gap-3">
    <header class="queue-toolbar">
      <h2 class="text-muted-foreground shrink-0 text-sm font-medium">
        {{ $t('usage.actions.queueStats') }}
      </h2>
      <div class="queue-selector">
        <label for="usage-queue-select" class="sr-only">{{
          $t('usage.fields.queue')
        }}</label>
        <IconifyIcon
          icon="lucide:server"
          class="text-muted-foreground size-4 shrink-0"
        />
        <Select
          id="usage-queue-select"
          v-model:value="selectedQueueId"
          class="min-w-0 flex-1"
          :aria-label="$t('usage.fields.queue')"
          :options="queueOptions"
          :loading="loadingList"
          :disabled="loadingList || !queues.length"
          :placeholder="$t('usage.fields.queue')"
        />
      </div>
      <Button
        class="queue-refresh"
        type="text"
        :loading="loadingList || loadingQueue"
        :aria-label="$t('usage.actions.refresh')"
        :title="$t('usage.actions.refresh')"
        @click="loadQueues"
      >
        <template #icon>
          <IconifyIcon icon="lucide:refresh-cw" class="size-4" />
        </template>
      </Button>
    </header>
    <Alert
      v-if="queueError"
      type="error"
      show-icon
      :message="$t('usage.messages.loadError')"
    >
      <template #action>
        <Button size="small" @click="loadQueues">
          {{ $t('usage.actions.retry') }}
        </Button>
      </template>
    </Alert>
    <Empty
      v-if="!queues.length && !loadingList && !queueError"
      class="bg-card rounded-xl border py-12"
      :description="$t('usage.messages.noQueues')"
    />
    <template v-if="selectedQueueId">
      <div class="queue-chart-grid">
        <section
          v-for="(panel, index) in chartPanels"
          :key="index"
          class="queue-chart bg-card min-w-0 rounded-xl border p-4"
        >
          <header
            class="mb-3 flex flex-wrap items-center justify-between gap-2"
          >
            <h3 class="flex items-center gap-2 text-sm font-semibold">
              <IconifyIcon
                :icon="panel.icon"
                class="text-muted-foreground size-4"
              />{{ panel.title }}
            </h3>
            <div class="ml-auto flex shrink-0 items-center gap-1">
              <TimeFilter
                :model-value="panel.filter"
                :title="panel.title"
                @update:model-value="applyPanelFilter(index, $event)"
              />
              <Button
                type="text"
                :aria-label="`${$t('usage.actions.fullscreen')}：${panel.title}`"
                @click="expandedPanel = index"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:maximize-2" class="size-4" />
                </template>
              </Button>
            </div>
          </header>
          <Spin :spinning="loadingQueue">
            <TrendChart
              :series="panel.series"
              :start-ts="panel.range.startTs"
              :end-ts="panel.range.endTs"
              :empty-message="
                loadingQueue || queueError
                  ? undefined
                  : $t('widget.timeFilter.noData')
              "
              height="clamp(300px, 42vh, 440px)"
            />
          </Spin>
        </section>
      </div>
      <section class="bg-card min-w-0 overflow-hidden rounded-xl border p-4">
        <header class="mb-3 flex items-center justify-between gap-3">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <IconifyIcon
              icon="lucide:list-filter"
              class="text-muted-foreground size-4"
            />{{ $t('usage.sections.exceptions') }}
          </h3>
          <span class="text-muted-foreground text-xs">{{
            $t('usage.fields.lastMonth')
          }}</span>
        </header>
        <BasicTable
          :loading="loadingQueue"
          :columns="exceptionColumns"
          :data-source="exceptions"
          row-key="id"
          :row-selection="null"
          :default-row-selection="null"
          :can-resize="false"
          :show-table-setting="false"
          :pagination="{ pageSize: 10 }"
        />
        <p class="text-muted-foreground mt-2 text-xs">
          {{ $t('usage.messages.exceptionsHint') }}
        </p>
      </section>
      <Alert
        v-if="truncated"
        type="warning"
        show-icon
        :message="$t('usage.messages.queueTruncated')"
      />
    </template>
    <Modal
      :open="expandedPanel !== undefined"
      :title="expandedChart?.title"
      :footer="null"
      width="calc(100vw - 48px)"
      :style="{ top: '24px' }"
      destroy-on-close
      @cancel="expandedPanel = undefined"
    >
      <div v-if="expandedChart" class="mb-3 flex justify-end">
        <TimeFilter
          :model-value="expandedChart.filter"
          :title="expandedChart.title"
          @update:model-value="
            expandedPanel !== undefined &&
            applyPanelFilter(expandedPanel, $event)
          "
        />
      </div>
      <Spin :spinning="loadingQueue">
        <TrendChart
          v-if="expandedChart"
          :series="expandedChart.series"
          :start-ts="expandedChart.range.startTs"
          :end-ts="expandedChart.range.endTs"
          :empty-message="
            loadingQueue || queueError
              ? undefined
              : $t('widget.timeFilter.noData')
          "
          height="calc(100vh - 160px)"
        />
      </Spin>
    </Modal>
  </div>
</template>

<style scoped>
.queue-statistics {
  container-type: inline-size;
}

.queue-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  min-height: 44px;
  padding: 0 4px;
}

.queue-selector {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 160px;
  max-width: 360px;
  margin-left: auto;
}

.queue-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@container (max-width: 640px) {
  .queue-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    padding: 0;
  }

  .queue-toolbar > h2 {
    grid-area: 1 / 1;
  }

  .queue-refresh {
    grid-area: 2 / 2;
    justify-self: end;
  }

  .queue-chart-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .queue-selector {
    grid-area: 2 / 1;
    min-width: 0;
    max-width: none;
    margin-left: 0;
  }
}
</style>
