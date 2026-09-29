import type { TimeFilterValue } from '#/components/widget';

import { defaultAggregationInterval } from '#/components/widget';

export function defaultTimeFilter(
  period: 'day' | 'hour' | 'month' | 'queue',
  now = Date.now(),
): TimeFilterValue {
  const duration = {
    hour: 86_400_000,
    day: 30 * 86_400_000,
    month: 365 * 86_400_000,
    queue: 3_600_000,
  }[period];
  return {
    mode: period === 'hour' || period === 'queue' ? 'realtime' : 'history',
    duration,
    startTs: now - duration,
    endTs: now,
    agg: period === 'day' ? 'SUM' : 'NONE',
    interval: period === 'day' ? 86_400_000 : defaultAggregationInterval,
    limit: 25_000,
  };
}

export function timeFilterQuery(filter: TimeFilterValue, now = Date.now()) {
  const endTs = filter.mode === 'realtime' ? now : filter.endTs;
  const startTs =
    filter.mode === 'realtime' ? endTs - filter.duration : filter.startTs;
  const duration = endTs - startTs;
  // The backend ignores limit for aggregated queries: bound the bucket count via interval too.
  const interval =
    filter.agg === 'NONE'
      ? 0
      : Math.max(
          filter.interval || defaultAggregationInterval,
          Math.ceil(duration / filter.limit),
        );
  return {
    startTs,
    endTs,
    agg: filter.agg,
    interval,
    limit: filter.limit,
  };
}
