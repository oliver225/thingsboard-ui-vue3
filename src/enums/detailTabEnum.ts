export interface DetailTabItem {
  key: string;
  label: string;
  icon: string;
}

export const DetailTabItemEnum = {
  DETAIL: {
    key: 'DETAIL',
    label: '详情',
    icon: 'ant-design:appstore-outlined',
  },
  TELEMETRY: {
    key: 'TELEMETRY',
    label: '数据',
    icon: 'ant-design:line-chart-outlined',
  },
  TGINGMODEL: {
    key: 'TGINGMODEL',
    label: '物模型',
    icon: 'ant-design:project-outlined',
  },
  TOPIC: {
    key: 'TOPIC',
    label: '连接API',
    icon: 'ant-design:api-outlined',
  },
  CALCULATED: {
    key: 'CALCULATED',
    label: '计算属性',
    icon: 'ant-design:calculator-outlined',
  },
  ALARM: {
    key: 'ALARM',
    label: '告警',
    icon: 'ant-design:alert-outlined',
  },
  EVENT: {
    key: 'EVENT',
    label: '事件',
    icon: 'ant-design:info-circle-outlined',
  },
  RELATION: {
    key: 'RELATION',
    label: '关联',
    icon: 'ant-design:radar-chart-outlined',
  },
  AUDIT_LOG: {
    key: 'AUDIT_LOG',
    label: '审计日志',
    icon: 'ant-design:bars-outlined',
  },
} as const satisfies Record<string, DetailTabItem>;
