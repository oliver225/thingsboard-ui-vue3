export interface TimeFilterValue {
  mode: 'history' | 'realtime';
  duration: number;
  startTs: number;
  endTs: number;
  agg: (typeof aggregations)[number];
  /** Aggregation interval in milliseconds; zero is only valid without aggregation. */
  interval: number;
  limit: number;
}

// Keep nested controls above the chart's fullscreen dialog.
export const timeFilterLayers = {
  panel: 'calc(var(--popup-z-index, 2000) + 100)',
  select: 'calc(var(--popup-z-index, 2000) + 200)',
  calendar: 'calc(var(--popup-z-index, 2000) + 300)',
} as const;

export const timeFilterLimits = { min: 1, max: 25_000 } as const;

export const timeDurations = [
  3_600_000,
  6 * 3_600_000,
  86_400_000,
  7 * 86_400_000,
  30 * 86_400_000,
  365 * 86_400_000,
];
export const defaultAggregationInterval = 60_000;
export const aggregationIntervals = [60_000, 300_000, 3_600_000, 86_400_000];
export const intervalUnits = [
  { value: 86_400_000, label: 'day' },
  { value: 3_600_000, label: 'hour' },
  { value: 60_000, label: 'minute' },
  { value: 1000, label: 'second' },
  { value: 1, label: 'millisecond' },
] as const;
export const aggregations = [
  'NONE',
  'AVG',
  'SUM',
  'MIN',
  'MAX',
  'COUNT',
] as const;

export function timeFilterError(
  filter: TimeFilterValue,
): 'interval' | 'limit' | 'range' | undefined {
  if (
    !Number.isInteger(filter.limit) ||
    filter.limit < timeFilterLimits.min ||
    filter.limit > timeFilterLimits.max
  )
    return 'limit';
  if (
    !Number.isSafeInteger(filter.interval) ||
    filter.interval < 0 ||
    (filter.agg !== 'NONE' && filter.interval === 0)
  )
    return 'interval';
  if (filter.mode === 'realtime') {
    return Number.isFinite(filter.duration) && filter.duration > 0
      ? undefined
      : 'range';
  }
  if (
    !Number.isFinite(filter.startTs) ||
    !Number.isFinite(filter.endTs) ||
    filter.startTs >= filter.endTs
  )
    return 'range';
}
