import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

export enum EventType {
  ERROR = 'ERROR',
  LC_EVENT = 'LC_EVENT',
  STATS = 'STATS',
  DEBUG_RULE_NODE = 'DEBUG_RULE_NODE',
  DEBUG_RULE_CHAIN = 'DEBUG_RULE_CHAIN',
  DEBUG_CALCULATED_FIELD = 'DEBUG_CALCULATED_FIELD',
}

export const EVENT_TYPE_OPTIONS = [
  { value: EventType.ERROR, label: t('tb.event.eventType.ERROR') },
  { value: EventType.LC_EVENT, label: t('tb.event.eventType.LC_EVENT') },
  { value: EventType.STATS, label: t('tb.event.eventType.STATS') },
];

export const RULE_NODE_EVENT_TYPE_OPTIONS = [
  { value: EventType.ERROR, label: t('tb.event.eventType.ERROR') },
  { value: EventType.LC_EVENT, label: t('tb.event.eventType.LC_EVENT') },
  { value: EventType.STATS, label: t('tb.event.eventType.STATS') },
  { value: EventType.DEBUG_RULE_NODE, label: t('tb.event.eventType.DEBUG_RULE_NODE') },
];

export const RULE_CHAIN_EVENT_TYPE_OPTIONS = [
  { value: EventType.ERROR, label: t('tb.event.eventType.ERROR') },
  { value: EventType.LC_EVENT, label: t('tb.event.eventType.LC_EVENT') },
  { value: EventType.STATS, label: t('tb.event.eventType.STATS') },
  { value: EventType.DEBUG_RULE_CHAIN, label: t('tb.event.eventType.DEBUG_RULE_CHAIN') },
];

export const CALCULATED_FIELD_EVENT_TYPE_OPTIONS = [{ value: EventType.DEBUG_CALCULATED_FIELD, label: t('调试') }];
