import type { MaybeRefOrGetter } from 'vue';

import type { TsValue } from '#/api/tb/entity-query';
import type { TimeFilterValue } from '#/components/widget';
import type { WsCommand } from '#/types/ws';

import { computed, onActivated, ref, toValue, watch } from 'vue';

import { useWs } from '#/hooks/use-ws';
import { timeFilterQuery } from '#/views/tb/usage/time-filter';

export const HOUR = 3_600_000;

/** 与 master 首页使用相同的 API_USAGE_STATE 数据源，保留实时增量并按窗口裁剪。 */
export function useUsage(
  keys: MaybeRefOrGetter<string[]>,
  filter: MaybeRefOrGetter<TimeFilterValue>,
  subscribeLatest = false,
) {
  const latest = ref<Record<string, TsValue>>({});
  const timeseries = ref<Record<string, TsValue[]>>({});
  // 请求时间只在刷新时改变，接收时间用于滚动窗口，避免每次推送都重新订阅。
  const updatedAt = ref(Date.now());
  const requestedAt = ref(Date.now());
  const selectedFilter = computed(() => toValue(filter));
  const endTs = computed(() =>
    selectedFilter.value.mode === 'realtime'
      ? updatedAt.value
      : selectedFilter.value.endTs,
  );
  const startTs = computed(() =>
    selectedFilter.value.mode === 'realtime'
      ? endTs.value - selectedFilter.value.duration
      : selectedFilter.value.startTs,
  );
  const command = computed<WsCommand>(() => {
    const names = toValue(keys);
    const selection = selectedFilter.value;
    const range = timeFilterQuery(
      selection,
      Math.max(requestedAt.value, Date.now()),
    );
    return {
      type: 'ENTITY_DATA',
      query: {
        entityFilter: { type: 'apiUsageState' },
        pageLink: { page: 0, pageSize: 1 },
        latestValues: names.map((key) => ({ type: 'TIME_SERIES', key })),
      },
      // 最新资源数值始终表示当前状态，与图表选择的历史区间独立。
      ...(subscribeLatest
        ? {
            latestCmd: {
              keys: names.map((key) => ({ type: 'TIME_SERIES' as const, key })),
            },
          }
        : {}),
      ...(selection.mode === 'realtime'
        ? {
            tsCmd: {
              keys: names,
              startTs: range.startTs,
              timeWindow: selection.duration,
              interval: range.interval,
              limit: range.limit,
              agg: range.agg,
            },
          }
        : {
            historyCmd: {
              keys: names,
              ...range,
            },
          }),
    };
  });
  const ws = useWs(command);
  function refresh() {
    requestedAt.value = Date.now();
  }
  onActivated(refresh);
  watch(ws.data, (message) => {
    if (!message) {
      latest.value = {};
      timeseries.value = {};
      updatedAt.value = Date.now();
      return;
    }
    if (message.cmdUpdateType !== 'ENTITY_DATA') return;
    updatedAt.value = Date.now();
    if (message.data) {
      latest.value = {};
      timeseries.value = {};
    }
    const entity = message.data?.data[0] ?? message.update?.[0];
    if (!entity) return;
    latest.value = { ...latest.value, ...entity.latest?.TIME_SERIES };
    for (const key of toValue(keys)) {
      const points = entity.timeseries?.[key];
      if (!points) continue;
      const merged = new Map(
        (timeseries.value[key] ?? []).map((point) => [point.ts, point]),
      );
      for (const point of points) merged.set(point.ts, point);
      timeseries.value[key] = [...merged.values()]
        .filter(
          (point) =>
            point.ts >= startTs.value &&
            point.ts <= endTs.value &&
            Number.isFinite(Number(point.value)),
        )
        .toSorted((a, b) => a.ts - b.ts)
        .slice(-selectedFilter.value.limit);
    }
  });
  function getValue(key: string) {
    const raw = latest.value[key]?.value;
    if (raw === undefined || raw === null || raw === '') return;
    const number = Number(raw);
    return Number.isFinite(number) ? number : undefined;
  }
  function getPoints(key: string): [number, number][] {
    return (timeseries.value[key] ?? []).map((point) => [
      point.ts,
      Number(point.value),
    ]);
  }
  return { status: ws.status, refresh, startTs, endTs, getValue, getPoints };
}
