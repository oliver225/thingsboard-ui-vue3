/**
 * 报警相关枚举(对应后端 org.thingsboard.server.common.data.alarm.*)
 */
import { $t } from '@vben/locales';

/** 报警严重程度(AlarmSeverity) */
export enum AlarmSeverity {
  CRITICAL = 'CRITICAL',
  INDETERMINATE = 'INDETERMINATE',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  WARNING = 'WARNING',
}

/** ui-ngx 告警级别配色，供告警配置和通知共用。 */
export const alarmSeverityColors: Record<AlarmSeverity, string> = {
  CRITICAL: '#d12730',
  MAJOR: '#f66716',
  MINOR: '#faa405',
  WARNING: '#f2da05',
  INDETERMINATE: '#9e9e9e',
};

/** 报警检索状态(AlarmSearchStatus) */
export enum AlarmSearchStatus {
  ACK = 'ACK',
  ACTIVE = 'ACTIVE',
  ANY = 'ANY',
  CLEARED = 'CLEARED',
  UNACK = 'UNACK',
}

/** 严重程度 → 显示文案 */
export function alarmSeverityLabel(value?: AlarmSeverity | string): string {
  if (!value) return '';
  return $t(`alarm.options.severity.${value}`);
}

/** 严重程度 → antd Tag 颜色 */
export function alarmSeverityColor(value?: AlarmSeverity | string): string {
  switch (value) {
    case AlarmSeverity.CRITICAL: {
      return 'red';
    }
    case AlarmSeverity.MAJOR: {
      return 'volcano';
    }
    case AlarmSeverity.MINOR: {
      return 'gold';
    }
    case AlarmSeverity.WARNING: {
      return 'orange';
    }
    default: {
      return 'default';
    }
  }
}

/** 检索状态下拉选项 */
export function alarmSearchStatusOptions(): Array<{
  label: string;
  value: AlarmSearchStatus;
}> {
  return [
    AlarmSearchStatus.ANY,
    AlarmSearchStatus.ACTIVE,
    AlarmSearchStatus.CLEARED,
    AlarmSearchStatus.ACK,
    AlarmSearchStatus.UNACK,
  ].map((value) => ({
    label: $t(`alarm.options.searchStatus.${value}`),
    value,
  }));
}

/** 由 acknowledged/cleared 推导报警状态显示文案 */
export function alarmStatusLabel(row: {
  acknowledged?: boolean;
  cleared?: boolean;
}): string {
  const active = row.cleared ? 'CLEARED' : 'ACTIVE';
  const ack = row.acknowledged ? 'ACK' : 'UNACK';
  return $t(`alarm.options.status.${active}_${ack}`);
}
