export enum Scope {
  SERVER_SCOPE = 'SERVER_SCOPE',
  CLIENT_SCOPE = 'CLIENT_SCOPE',
  SHARED_SCOPE = 'SHARED_SCOPE',
  // LATEST_TELEMETRY = 'LATEST_TELEMETRY',
}

export enum OrderBy {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

export enum Aggregation {
  NONE = 'NONE',
  MIN = 'MIN',
  MAX = 'MAX',
  AVG = 'AVG',
  SUM = 'SUM',
  COUNT = 'COUNT',
}

export enum TimeUnit {
  MILLISECONDS = 'MILLISECONDS',
  SECONDS = 'SECONDS',
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}

export const TIME_UNIT_OPTIONS = [
  { value: TimeUnit.MILLISECONDS, label: '毫秒' },
  { value: TimeUnit.SECONDS, label: '秒' },
  { value: TimeUnit.MINUTES, label: '分钟' },
  { value: TimeUnit.HOURS, label: '小时' },
  { value: TimeUnit.DAYS, label: '天' },
];

export const AGGREGATION_OPTIONS = [
  { value: Aggregation.NONE, label: '无' },
  { value: Aggregation.MIN, label: '最小值' },
  { value: Aggregation.MAX, label: '最大值' },
  { value: Aggregation.AVG, label: '平均值' },
  { value: Aggregation.SUM, label: '求和' },
  { value: Aggregation.COUNT, label: '计数' },
];

export const SCOPE_OPTIONS = [
  { value: Scope.CLIENT_SCOPE, label: '客户端属性' },
  { value: Scope.SERVER_SCOPE, label: '服务端属性' },
  { value: Scope.SHARED_SCOPE, label: '共享属性' },
  { value: 'LATEST_TELEMETRY', label: '遥测数据' },
];

export const SCOPE_OPTIONS_SIMPLE = [
  { value: Scope.CLIENT_SCOPE, label: '客户端属性' },
  { value: Scope.SERVER_SCOPE, label: '服务端属性' },
  { value: Scope.SHARED_SCOPE, label: '共享属性' },
];
