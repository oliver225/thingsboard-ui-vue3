/**
 * 报警接口
 * 契约参考:后端 AlarmController.java
 */
import type { AlarmSeverity, EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 报警受理人(AlarmAssignee) */
export interface AlarmAssignee {
  email?: string;
  firstName?: string;
  id?: EntityId<EntityType.USER>;
  lastName?: string;
}

/** 报警实体(org.thingsboard.server.common.data.alarm.Alarm) */
export interface Alarm extends BaseData<EntityType.ALARM> {
  ackTs?: number;
  acknowledged?: boolean;
  assigneeId?: EntityId<EntityType.USER>;
  cleared?: boolean;
  clearTs?: number;
  customerId?: EntityId<EntityType.CUSTOMER>;
  details?: Record<string, any>;
  endTs?: number;
  originator?: EntityId;
  propagate?: boolean;
  severity: AlarmSeverity;
  startTs?: number;
  tenantId?: EntityId<EntityType.TENANT>;
  type: string;
}

/** 报警信息(AlarmInfo,列表展示用) */
export interface AlarmInfo extends Alarm {
  assignee?: AlarmAssignee;
  originatorlabel?: string;
  originatorName?: string;
}

/** 全部报警分页(GET /api/alarms,租户/客户范围) */
export function getAllAlarms(
  pageLink: PageLink,
  params?: { searchStatus?: string },
) {
  return requestClient.get<PageData<AlarmInfo>>('/alarms', {
    params: { ...pageLink, ...params },
  });
}

/** 报警详情(GET /api/alarm/{alarmId}) */
export function getAlarmById(alarmId: string) {
  return requestClient.get<Alarm>(`/alarm/${alarmId}`);
}

/** 报警信息详情(GET /api/alarm/info/{alarmId}) */
export function getAlarmInfoById(alarmId: string) {
  return requestClient.get<AlarmInfo>(`/alarm/info/${alarmId}`);
}

/** 确认报警(POST /api/alarm/{alarmId}/ack) */
export function ackAlarm(alarmId: string) {
  return requestClient.post<AlarmInfo>(`/alarm/${alarmId}/ack`);
}

/** 清除报警(POST /api/alarm/{alarmId}/clear) */
export function clearAlarm(alarmId: string) {
  return requestClient.post<AlarmInfo>(`/alarm/${alarmId}/clear`);
}

/** 删除报警(DELETE /api/alarm/{alarmId}) */
export function deleteAlarm(alarmId: string): Promise<boolean> {
  return requestClient.delete<boolean>(`/alarm/${alarmId}`);
}
