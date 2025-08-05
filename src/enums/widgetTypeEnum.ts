export enum WidgetType {
  TIME_SERIES = 'timeseries',
  LATEST = 'latest',
  RPC = 'rpc',
  STATIC = 'static',
  ALARM = 'alarm',
}

export const WIDGET_TYPE_OPTIONS = [
  { value: WidgetType.TIME_SERIES, label: '时间序列' },
  { value: WidgetType.LATEST, label: '最新数据' },
  { value: WidgetType.RPC, label: '控制部件' },
  { value: WidgetType.STATIC, label: '静态部件' },
  { value: WidgetType.ALARM, label: '告警部件' },
];
