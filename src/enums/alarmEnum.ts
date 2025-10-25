import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

export enum ALarmShowStatus {
  ACTIVE_UNACK = 'ACTIVE_UNACK',
  ACTIVE_ACK = 'ACTIVE_ACK',
  CLEARED_UNACK = 'CLEARED_UNACK',
  CLEARED_ACK = 'CLEARED_ACK',
}

export enum AlarmStatus {
  ACTIVE = 'ACTIVE',
  CLEARED = 'CLEARED',
  ACK = 'ACK',
  UNACK = 'UNACK',
}

export enum AlarmSearchStatus {
  ANY = 'ANY',
  ACTIVE = 'ACTIVE',
  CLEARED = 'CLEARED',
  ACK = 'ACK',
  UNACK = 'UNACK',
}

// 报警等级
export enum AlarmSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  WARNING = 'WARNING',
  INDETERMINATE = 'INDETERMINATE',
}

export const ALARM_SHOW_STATUS_OPTIONS = [
  { value: ALarmShowStatus.ACTIVE_UNACK, label: t('tb.alarm.enums.showStatus.activeUnack') },
  { value: ALarmShowStatus.ACTIVE_ACK, label: t('tb.alarm.enums.showStatus.activeAck') },
  { value: ALarmShowStatus.CLEARED_UNACK, label: t('tb.alarm.enums.showStatus.clearedUnack') },
  { value: ALarmShowStatus.CLEARED_ACK, label: t('tb.alarm.enums.showStatus.clearedAck') },
];

export const ALARM_STATUS_OPTIONS = [
  { value: AlarmStatus.ACTIVE, label: t('tb.alarm.enums.status.active') },
  { value: AlarmStatus.CLEARED, label: t('tb.alarm.enums.status.cleared') },
  { value: AlarmStatus.ACK, label: t('tb.alarm.enums.status.ack') },
  { value: AlarmStatus.UNACK, label: t('tb.alarm.enums.status.unack') },
];

export const ALARM_SEVERITY_OPTIONS = [
  { value: AlarmSeverity.CRITICAL, label: t('tb.alarm.enums.severity.critical'), color: '#FF0000' }, // 红色
  { value: AlarmSeverity.MAJOR, label: t('tb.alarm.enums.severity.major'), color: '#E37318' }, // 橙色
  { value: AlarmSeverity.MINOR, label: t('tb.alarm.enums.severity.minor'), color: '#FFA000' }, // 黄色
  { value: AlarmSeverity.WARNING, label: t('tb.alarm.enums.severity.warning'), color: '#FFCA3D' }, //蓝色
  { value: AlarmSeverity.INDETERMINATE, label: t('tb.alarm.enums.severity.indeterminate') }, //灰色
];

export enum AlarmConditionKeyType {
  ATTRIBUTE = 'ATTRIBUTE',
  TIME_SERIES = 'TIME_SERIES',
  CONSTANT = 'CONSTANT',
}

export const ALARM_CONDITION_KEY_TYPE_OPTIONS = [
  { value: AlarmConditionKeyType.ATTRIBUTE, label: t('tb.alarm.enums.conditionKeyType.attribute') },
  { value: AlarmConditionKeyType.TIME_SERIES, label: t('tb.alarm.enums.conditionKeyType.timeSeries') },
  { value: AlarmConditionKeyType.CONSTANT, label: t('tb.alarm.enums.conditionKeyType.constant') },
];

export enum AlarmConditionValueType {
  STRING = 'STRING',
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',
  DATE_TIME = 'DATE_TIME',
}

export const ALARM_CONDITION_VALUE_TYPE_OPTIONS = [
  { value: AlarmConditionValueType.STRING, label: t('tb.alarm.enums.conditionValueType.string') },
  { value: AlarmConditionValueType.NUMERIC, label: t('tb.alarm.enums.conditionValueType.numeric') },
  { value: AlarmConditionValueType.BOOLEAN, label: t('tb.alarm.enums.conditionValueType.boolean') },
  { value: AlarmConditionValueType.DATE_TIME, label: t('tb.alarm.enums.conditionValueType.dateTime') },
];

export enum PredicateOperation {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  LESS = 'LESS',
  GREATER = 'GREATER',
  GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
  LESS_OR_EQUAL = 'LESS_OR_EQUAL',
}

export const PREDICATE_OPERATION_OPTIONS = [
  { value: PredicateOperation.EQUAL, label: t('tb.alarm.enums.predicateOperation.equal') },
  { value: PredicateOperation.NOT_EQUAL, label: t('tb.alarm.enums.predicateOperation.notEqual') },
  { value: PredicateOperation.STARTS_WITH, label: t('tb.alarm.enums.predicateOperation.startsWith') },
  { value: PredicateOperation.ENDS_WITH, label: t('tb.alarm.enums.predicateOperation.endsWith') },
  { value: PredicateOperation.CONTAINS, label: t('tb.alarm.enums.predicateOperation.contains') },
  { value: PredicateOperation.NOT_CONTAINS, label: t('tb.alarm.enums.predicateOperation.notContains') },
  { value: PredicateOperation.IN, label: t('tb.alarm.enums.predicateOperation.in') },
  { value: PredicateOperation.NOT_IN, label: t('tb.alarm.enums.predicateOperation.notIn') },
  { value: PredicateOperation.LESS, label: t('tb.alarm.enums.predicateOperation.less') },
  { value: PredicateOperation.GREATER, label: t('tb.alarm.enums.predicateOperation.greater') },
  { value: PredicateOperation.GREATER_OR_EQUAL, label: t('tb.alarm.enums.predicateOperation.greaterOrEqual') },
  { value: PredicateOperation.LESS_OR_EQUAL, label: t('tb.alarm.enums.predicateOperation.lessOrEqual') },
];
