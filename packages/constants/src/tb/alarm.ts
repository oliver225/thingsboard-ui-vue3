export enum ALarmShowStatus {
  ACTIVE_ACK = 'ACTIVE_ACK',
  ACTIVE_UNACK = 'ACTIVE_UNACK',
  CLEARED_ACK = 'CLEARED_ACK',
  CLEARED_UNACK = 'CLEARED_UNACK',
}

export enum AlarmStatus {
  ACK = 'ACK',
  ACTIVE = 'ACTIVE',
  CLEARED = 'CLEARED',
  UNACK = 'UNACK',
}

// 报警等级
export enum AlarmSeverity {
  CRITICAL = 'CRITICAL',
  INDETERMINATE = 'INDETERMINATE',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  WARNING = 'WARNING',
}

export const ALARM_SHOW_STATUS_OPTIONS = [
  { value: ALarmShowStatus.ACTIVE_UNACK, label: '激活未确认' },
  { value: ALarmShowStatus.ACTIVE_ACK, label: '激活已确认' },
  { value: ALarmShowStatus.CLEARED_UNACK, label: '清理未确认' },
  { value: ALarmShowStatus.CLEARED_ACK, label: '清理已确认' },
];

export const ALARM_STATUS_OPTIONS = [
  { value: AlarmStatus.ACTIVE, label: '已激活' },
  { value: AlarmStatus.CLEARED, label: '已清理' },
  { value: AlarmStatus.ACK, label: '已确认' },
  { value: AlarmStatus.UNACK, label: '未确认' },
];

export const ALARM_SEVERITY_OPTIONS = [
  { value: AlarmSeverity.CRITICAL, label: '危险', color: '#FF0000' }, // 红色
  { value: AlarmSeverity.MAJOR, label: '重要', color: '#E37318' }, // 橙色
  { value: AlarmSeverity.MINOR, label: '次要', color: '#FFA000' }, // 黄色
  { value: AlarmSeverity.WARNING, label: '警告', color: '#FFCA3D' }, // 蓝色
  { value: AlarmSeverity.INDETERMINATE, label: '不确定' }, // 灰色
];

export enum AlarmConditionKeyType {
  ATTRIBUTE = 'ATTRIBUTE',
  CONSTANT = 'CONSTANT',
  TIME_SERIES = 'TIME_SERIES',
}

export const ALARM_CONDITION_KEY_TYPE_OPTIONS = [
  { value: AlarmConditionKeyType.ATTRIBUTE, label: '属性' },
  { value: AlarmConditionKeyType.TIME_SERIES, label: '遥测数据' },
  { value: AlarmConditionKeyType.CONSTANT, label: '常量' },
];

export enum AlarmConditionValueType {
  BOOLEAN = 'BOOLEAN',
  DATE_TIME = 'DATE_TIME',
  NUMERIC = 'NUMERIC',
  STRING = 'STRING',
}

export const ALARM_CONDITION_VALUE_TYPE_OPTIONS = [
  { value: AlarmConditionValueType.STRING, label: '字符串' },
  { value: AlarmConditionValueType.NUMERIC, label: '数字' },
  { value: AlarmConditionValueType.BOOLEAN, label: '布尔值' },
  { value: AlarmConditionValueType.DATE_TIME, label: '日期时间' },
];

export enum PredicateOperation {
  CONTAINS = 'CONTAINS',
  ENDS_WITH = 'ENDS_WITH',
  EQUAL = 'EQUAL',
  GREATER = 'GREATER',
  GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
  IN = 'IN',
  LESS = 'LESS',
  LESS_OR_EQUAL = 'LESS_OR_EQUAL',
  NOT_CONTAINS = 'NOT_CONTAINS',
  NOT_EQUAL = 'NOT_EQUAL',
  NOT_IN = 'NOT_IN',
  STARTS_WITH = 'STARTS_WITH',
}

export const PREDICATE_OPERATION_OPTIONS = [
  { value: PredicateOperation.EQUAL, label: '等于' },
  { value: PredicateOperation.NOT_EQUAL, label: '不等于' },
  { value: PredicateOperation.STARTS_WITH, label: '开始于' },
  { value: PredicateOperation.ENDS_WITH, label: '结束于' },
  { value: PredicateOperation.CONTAINS, label: '包含' },
  { value: PredicateOperation.NOT_CONTAINS, label: '不包含' },
  { value: PredicateOperation.IN, label: '匹配' },
  { value: PredicateOperation.NOT_IN, label: '不匹配' },
  { value: PredicateOperation.LESS, label: '小于' },
  { value: PredicateOperation.GREATER, label: '大于' },
  { value: PredicateOperation.GREATER_OR_EQUAL, label: '大于等于' },
  { value: PredicateOperation.LESS_OR_EQUAL, label: '小于等于' },
];
