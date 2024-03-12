export enum EventType {
  ERROR = 'ERROR',
  LC_EVENT = 'LC_EVENT',
  STATS = 'STATS',
  DEBUG_RULE_NODE = 'DEBUG_RULE_NODE',
  DEBUG_RULE_CHAIN = 'DEBUG_RULE_CHAIN',
}

export const EVENT_TYPE_OPTIONS = [
  { value: EventType.ERROR, label: '错误' },
  { value: EventType.LC_EVENT, label: '生命周期事件' },
  { value: EventType.STATS, label: '类型统计' },
  { value: EventType.DEBUG_RULE_NODE, label: '调试' },
  { value: EventType.DEBUG_RULE_CHAIN, label: '调试' },
];