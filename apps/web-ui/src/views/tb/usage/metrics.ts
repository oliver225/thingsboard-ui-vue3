import type { TsData } from '#/api/tb/telemetry';

export const usageMetrics = [
  {
    key: 'transportMsg',
    count: 'transportMsgCount',
    limit: 'transportMsgLimit',
    state: 'transportApiState',
    icon: 'lucide:arrow-left-right',
  },
  {
    key: 'transportDataPoints',
    count: 'transportDataPointsCount',
    limit: 'transportDataPointsLimit',
    state: 'transportApiState',
    icon: 'lucide:database',
  },
  {
    key: 'ruleEngineExecution',
    count: 'ruleEngineExecutionCount',
    limit: 'ruleEngineExecutionLimit',
    state: 'ruleEngineApiState',
    icon: 'lucide:workflow',
  },
  {
    key: 'jsExecution',
    count: 'jsExecutionCount',
    limit: 'jsExecutionLimit',
    state: 'jsExecutionApiState',
    icon: 'lucide:code',
  },
  {
    key: 'tbelExecution',
    count: 'tbelExecutionCount',
    limit: 'tbelExecutionLimit',
    state: 'tbelExecutionApiState',
    icon: 'lucide:braces',
  },
  {
    key: 'storageDataPoints',
    count: 'storageDataPointsCount',
    limit: 'storageDataPointsLimit',
    state: 'dbApiState',
    icon: 'lucide:hard-drive',
  },
  {
    key: 'createdAlarms',
    count: 'createdAlarmsCount',
    limit: 'createdAlarmsLimit',
    state: 'alarmApiState',
    icon: 'lucide:bell-ring',
  },
  {
    key: 'email',
    count: 'emailCount',
    limit: 'emailLimit',
    state: 'emailApiState',
    icon: 'lucide:mail',
  },
  {
    key: 'sms',
    count: 'smsCount',
    limit: 'smsLimit',
    state: 'smsApiState',
    icon: 'lucide:message-square',
  },
] as const;

export type UsagePeriod = 'day' | 'hour' | 'month';
export type UsageMetric = (typeof usageMetrics)[number];
export type UsageMetricKey = UsageMetric['key'];

/** The four charts in ui-ngx's default API usage dashboard. */
export const defaultUsageMetrics: UsageMetricKey[] = [
  'transportMsg',
  'transportDataPoints',
  'ruleEngineExecution',
  'storageDataPoints',
];

export const usageColors: Record<UsageMetricKey, string> = {
  transportMsg: '#2196f3',
  transportDataPoints: '#673ab7',
  ruleEngineExecution: '#f44336',
  jsExecution: '#ff9900',
  tbelExecution: '#4caf50',
  storageDataPoints: '#1039ee',
  createdAlarms: '#d35a00',
  email: '#d35a00',
  sms: '#f36021',
};

export function telemetryPoints(values: TsData[]): [number, number][] {
  return values
    .flatMap((point): [number, number][] => {
      const value = numericValue(point.value);
      return value === undefined || !Number.isFinite(point.ts)
        ? []
        : [[point.ts, value]];
    })
    .toSorted(([a], [b]) => a - b);
}

export function numericValue(value: unknown): number | undefined {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim()))
    return;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
