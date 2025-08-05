import { AlarmQueryParam, BasicModel, BasicQuery, Page } from '/@/api/model/baseModel';
import { ALarmShowStatus, AlarmSeverity } from '/@/enums/alarmEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface Alarm extends BasicModel<EntityType.ALARM> {
  name?: string;
  type?: string;
  status?: ALarmShowStatus;
  originator?: EntityId<any>; //发起人
  severity?: AlarmSeverity; //  严重程度
  acknowledged?: boolean; // 应答
  cleared?: boolean; //清理
  propagate?: boolean; // 传播
  propagateToOwner?: boolean; // 传播
  propagateToTenant?: boolean; // 传播
  propagateRelationTypes?: Array<string>;
  startTs?: number;
  endTs?: number;
  ackTs?: number;
  clearTs?: number;
  assignTs?: number;
  assigneeId?: EntityId<EntityType.USER>; // 受让人
  tenantId?: EntityId<EntityType.TENANT>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  details?: { data?: string };
}

export interface AlarmInfo extends Alarm {
  originatorName?: string;
  originatorLabel?: string;
  assignee?: {
    id: EntityId<EntityType.USER>;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface AlarmComment extends BasicModel<any> {
  alarmId: EntityId<EntityType.ALARM>;
  userId?: EntityId<EntityType.USER>; //
  type: 'SYSTEM' | 'OTHER';
  comment: { text?: string; subtype?: string; userId?: string };
}

export interface AlarmCommentInfo extends AlarmComment {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function getAlarmById(alarmId: string) {
  return defHttp.get<Alarm>({
    url: `/api/alarm/${alarmId}`,
  });
}

export function getAlarmInfoById(alarmId: string) {
  return defHttp.get<AlarmInfo>({
    url: `/api/alarm/info/${alarmId}`,
  });
}

export function saveAlarm(data: Alarm | any) {
  return defHttp.postJson<Alarm>({
    url: '/api/alarm',
    data,
  });
}

export function deleteAlarm(alarmId: string) {
  return defHttp.delete<void>({
    url: `/api/alarm/${alarmId}`,
  });
}

export function ackAlarm(alarmId: string) {
  return defHttp.post<AlarmInfo>({
    url: `/api/alarm/${alarmId}/ack`,
  });
}

export function clearAlarm(alarmId: string) {
  return defHttp.post<AlarmInfo>({
    url: `/api/alarm/${alarmId}/clear`,
  });
}

export function assignAlarm(alarmId: string, assigneeId: string) {
  return defHttp.post<Alarm>({
    url: `/api/alarm/${alarmId}/assign/${assigneeId}`,
  });
}

export function unAssignAlarm(alarmId: string) {
  return defHttp.delete<void>({
    url: `/api/alarm/${alarmId}/assign`,
  });
}

export function getAlarmInfoList(params: AlarmQueryParam) {
  return defHttp.get<Page<AlarmInfo>>({
    url: '/api/v2/alarms',
    params,
  });
}

export function getAlarmInfoByEntity(params: AlarmQueryParam, entityType: string, entityId: string) {
  return defHttp.get<Page<AlarmInfo>>({
    url: `/api/v2/alarm/${entityType}/${entityId}`,
    params,
  });
}

export function getHighestAlarmSeverity(
  entityType: string,
  entityId: string,
  params: { searchStatus?: string; status?: string; assigneeId?: string },
) {
  return defHttp.get<AlarmSeverity>({
    url: `/api/alarm/highestSeverity/${entityType}/${entityId}`,
    params,
  });
}

export function saveAlarmComment(data: AlarmComment | any, alarmId: string) {
  return defHttp.postJson<AlarmComment>({
    url: `/api/alarm/${alarmId}/comment`,
    data,
  });
}

export function deleteAlarmComment(commentId: string, alarmId: string) {
  return defHttp.delete<void>({
    url: `/api/alarm/${alarmId}/comment/${commentId}`,
  });
}

export function alarmCommentList(alarmId: string, params: BasicQuery) {
  return defHttp.get<Page<AlarmCommentInfo>>({
    url: `/api/alarm/${alarmId}/comment`,
    params,
  });
}
