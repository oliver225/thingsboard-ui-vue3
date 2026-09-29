<script setup lang="ts">
import type { TimeFilterValue } from '#/components/widget';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Col, Flex, Row } from 'antdv-next';

import { TrendChart } from '#/components/trend-chart';
import { TimeFilter } from '#/components/widget';
import { $t } from '#/locales';

import { HOUR, useUsage } from '../use-usage';
import HomeCard from './home-card.vue';

const now = Date.now();
const filter = ref<TimeFilterValue>({
  mode: 'realtime',
  duration: HOUR,
  startTs: now - HOUR,
  endTs: now,
  agg: 'AVG',
  interval: 10_000,
  limit: 360,
});
const { getValue, getPoints, status, startTs, endTs, refresh } = useUsage(
  [
    'cpuUsage',
    'cpuCount',
    'memoryUsage',
    'totalMemory',
    'discUsage',
    'totalDiscSpace',
  ],
  filter,
  true,
);
function formatGigabytes(size: number | undefined) {
  if (size === undefined) return '—';
  return `${(size / 1024 ** 3).toLocaleString(undefined, { maximumFractionDigits: 1 })} GB`;
}
const resources = computed(() => [
  {
    key: 'cpuUsage',
    title: 'CPU',
    icon: 'lucide:cpu',
    detail: `${getValue('cpuCount') ?? '—'} cores`,
    color: '#385b8c',
  },
  {
    key: 'memoryUsage',
    title: 'RAM',
    icon: 'lucide:memory-stick',
    detail: formatGigabytes(getValue('totalMemory')),
    color: '#ac3bcb',
  },
  {
    key: 'discUsage',
    title: $t('home.disk'),
    icon: 'lucide:hard-drive',
    detail: formatGigabytes(getValue('totalDiscSpace')),
    color: '#3bc9a6',
  },
]);
const series = computed(() =>
  resources.value.map((item) => ({
    name: item.title,
    color: item.color,
    data: getPoints(item.key),
  })),
);
</script>

<template>
  <Flex class="system-resources" vertical :gap="12">
    <Row class="resource-metrics" :gutter="10" :wrap="false">
      <Col v-for="resource in resources" :key="resource.key" :span="8">
        <div class="resource-metric bg-card h-full rounded-xl border shadow-sm">
          <div class="mb-2 flex items-center gap-2">
            <IconifyIcon
              :icon="resource.icon"
              class="size-4 shrink-0"
              :style="{ color: resource.color }"
            />
            <span class="text-muted-foreground text-xs font-medium">
              {{ resource.title }}
            </span>
            <IconifyIcon
              v-if="getValue(resource.key) !== undefined"
              :icon="
                getValue(resource.key)! >= 80
                  ? 'lucide:triangle-alert'
                  : 'lucide:check'
              "
              :class="
                getValue(resource.key)! >= 80
                  ? 'text-amber-500'
                  : 'text-emerald-600'
              "
              class="ml-auto size-3.5 shrink-0"
            />
          </div>
          <div class="flex flex-wrap items-baseline gap-x-1">
            <span class="text-xl font-semibold tabular-nums">
              {{ getValue(resource.key)?.toFixed(0) ?? '—' }}
              <span v-if="getValue(resource.key) !== undefined" class="text-sm">
                %
              </span>
            </span>
            <span class="text-muted-foreground text-xs">
              | {{ resource.detail }}
            </span>
          </div>
        </div>
      </Col>
    </Row>
    <HomeCard class="resource-chart" :title="$t('home.systemResources')" fill>
      <template #extra>
        <TimeFilter v-model="filter" :title="$t('home.systemResources')" />
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
        :start-ts="startTs"
        :end-ts="endTs"
        height="100%"
        unit="%"
        class="min-h-0 flex-1"
        :empty-message="
          $t(status === 'loading' ? 'home.loading' : 'home.noTelemetry')
        "
      />
    </HomeCard>
  </Flex>
</template>

<style scoped>
.system-resources {
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.resource-metrics {
  flex: 0 0 88px;
  min-height: 0;
}

.resource-chart {
  flex: 1 1 0;
}

.resource-metric {
  min-width: 0;
  padding: 12px;
}
</style>
