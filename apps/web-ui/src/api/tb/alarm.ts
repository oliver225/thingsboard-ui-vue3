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
  originatorLabel?: string;
  originatorName?: string;
}

interface AlarmQueryParams {
  startTime?: number;
  endTime?: number;
  fetchOriginator?: boolean;
  searchStatus?: string;
}

/** 全部报警分页(GET /api/alarms,租户/客户范围) */
export function getAllAlarms(pageLink: PageLink, params?: AlarmQueryParams) {
  return requestClient.get<PageData<AlarmInfo>>('/alarms', {
    params: { ...pageLink, ...params },
  });
}

/** 指定实体报警分页(GET /api/alarm/{entityType}/{entityId}) */
export function getAlarmsByEntity(
  entityType: EntityType | string,
  entityId: string,
  pageLink: PageLink,
  params?: AlarmQueryParams,
) {
  return requestClient.get<PageData<AlarmInfo>>(
    `/alarm/${entityType}/${entityId}`,
    {
      params: { ...pageLink, ...params },
    },
  );
}

/** 报警详情(GET /api/alarm/{alarmId}) */
export function getAlarmById(alarmId: string) {
  return requestClient.get<Alarm>(`/alarm/${alarmId}`);
}

/** 报警信息详情(GET /api/alarm/info/{alarmId}) */
export function getAlarmInfoById(alarmId: string) {
  return requestClient.get<AlarmInfo>(`/alarm/info/${alarmId}`);
}

export function assignAlarm(alarmId: string, userId: string): Promise<void> {
  return requestClient.post(`/alarm/${alarmId}/assign/${userId}`);
}

export function unassignAlarm(alarmId: string): Promise<void> {
  return requestClient.delete(`/alarm/${alarmId}/assign`);
}

/** AlarmCommentInfo；评论 ID 不属于通用实体类型。 */
export interface AlarmCommentInfo {
  id?: { id: string };
  createdTime?: number;
  alarmId?: EntityId<EntityType.ALARM>;
  userId?: EntityId<EntityType.USER>;
  firstName?: string;
  lastName?: string;
  email?: string;
  type: 'OTHER' | 'SYSTEM';
  comment: {
    text: string;
    subtype?: string;
    userName?: string;
    assigneeName?: string;
    oldSeverity?: AlarmSeverity;
    newSeverity?: AlarmSeverity;
    edited?: boolean;
    editedOn?: number;
  };
}

export function getAlarmComments(alarmId: string, pageLink: PageLink) {
  return requestClient.get<PageData<AlarmCommentInfo>>(
    `/alarm/${alarmId}/comment`,
    {
      params: { ...pageLink },
    },
  );
}

export function saveAlarmComment(alarmId: string, comment: AlarmCommentInfo) {
  return requestClient.post<AlarmCommentInfo>(
    `/alarm/${alarmId}/comment`,
    comment,
  );
}

export function deleteAlarmComment(
  alarmId: string,
  commentId: string,
): Promise<void> {
  return requestClient.delete(`/alarm/${alarmId}/comment/${commentId}`);
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

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteAlarms(alarmIds: string[]) {
  const ids = [...new Set(alarmIds)];
  const results = await Promise.allSettled(ids.map((id) => deleteAlarm(id)));
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const id = ids[index];
    if (!id) return;
    (result.status === 'fulfilled' ? deletedIds : failedIds).push(id);
  });
  return { deletedIds, failedIds };
}
