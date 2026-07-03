/**
 * 操作类型(对应后端 org.thingsboard.server.common.data.audit.ActionType)
 */
import { $t } from '@vben/locales';

export enum ActionType {
  ACTIVATED = 'ACTIVATED',
  ADDED = 'ADDED',
  ADDED_COMMENT = 'ADDED_COMMENT',
  ALARM_ACK = 'ALARM_ACK',
  ALARM_ASSIGNED = 'ALARM_ASSIGNED',
  ALARM_CLEAR = 'ALARM_CLEAR',
  ALARM_DELETE = 'ALARM_DELETE',
  ALARM_UNASSIGNED = 'ALARM_UNASSIGNED',
  ASSIGNED_FROM_TENANT = 'ASSIGNED_FROM_TENANT',
  ASSIGNED_TO_CUSTOMER = 'ASSIGNED_TO_CUSTOMER',
  ASSIGNED_TO_EDGE = 'ASSIGNED_TO_EDGE',
  ASSIGNED_TO_TENANT = 'ASSIGNED_TO_TENANT',
  ATTRIBUTES_DELETED = 'ATTRIBUTES_DELETED',
  ATTRIBUTES_READ = 'ATTRIBUTES_READ',
  ATTRIBUTES_UPDATED = 'ATTRIBUTES_UPDATED',
  CREDENTIALS_READ = 'CREDENTIALS_READ',
  CREDENTIALS_UPDATED = 'CREDENTIALS_UPDATED',
  DELETED = 'DELETED',
  DELETED_COMMENT = 'DELETED_COMMENT',
  LOCKOUT = 'LOCKOUT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PROVISION_FAILURE = 'PROVISION_FAILURE',
  PROVISION_SUCCESS = 'PROVISION_SUCCESS',
  RELATION_ADD_OR_UPDATE = 'RELATION_ADD_OR_UPDATE',
  RELATION_DELETED = 'RELATION_DELETED',
  RELATIONS_DELETED = 'RELATIONS_DELETED',
  REST_API_RULE_ENGINE_CALL = 'REST_API_RULE_ENGINE_CALL',
  RPC_CALL = 'RPC_CALL',
  SMS_SENT = 'SMS_SENT',
  SUSPENDED = 'SUSPENDED',
  TIMESERIES_DELETED = 'TIMESERIES_DELETED',
  TIMESERIES_UPDATED = 'TIMESERIES_UPDATED',
  UNASSIGNED_FROM_CUSTOMER = 'UNASSIGNED_FROM_CUSTOMER',
  UNASSIGNED_FROM_EDGE = 'UNASSIGNED_FROM_EDGE',
  UPDATED = 'UPDATED',
  UPDATED_COMMENT = 'UPDATED_COMMENT',
}

/** 操作类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function actionTypeLabelMap() {
  return {
    [ActionType.ADDED]: $t('tb.actionType.ADDED'),
    [ActionType.DELETED]: $t('tb.actionType.DELETED'),
    [ActionType.UPDATED]: $t('tb.actionType.UPDATED'),
    [ActionType.ATTRIBUTES_UPDATED]: $t('tb.actionType.ATTRIBUTES_UPDATED'),
    [ActionType.ATTRIBUTES_DELETED]: $t('tb.actionType.ATTRIBUTES_DELETED'),
    [ActionType.TIMESERIES_UPDATED]: $t('tb.actionType.TIMESERIES_UPDATED'),
    [ActionType.TIMESERIES_DELETED]: $t('tb.actionType.TIMESERIES_DELETED'),
    [ActionType.RPC_CALL]: $t('tb.actionType.RPC_CALL'),
    [ActionType.CREDENTIALS_UPDATED]: $t('tb.actionType.CREDENTIALS_UPDATED'),
    [ActionType.ASSIGNED_TO_CUSTOMER]: $t('tb.actionType.ASSIGNED_TO_CUSTOMER'),
    [ActionType.UNASSIGNED_FROM_CUSTOMER]: $t(
      'tb.actionType.UNASSIGNED_FROM_CUSTOMER',
    ),
    [ActionType.ACTIVATED]: $t('tb.actionType.ACTIVATED'),
    [ActionType.SUSPENDED]: $t('tb.actionType.SUSPENDED'),
    [ActionType.CREDENTIALS_READ]: $t('tb.actionType.CREDENTIALS_READ'),
    [ActionType.ATTRIBUTES_READ]: $t('tb.actionType.ATTRIBUTES_READ'),
    [ActionType.RELATION_ADD_OR_UPDATE]: $t(
      'tb.actionType.RELATION_ADD_OR_UPDATE',
    ),
    [ActionType.RELATION_DELETED]: $t('tb.actionType.RELATION_DELETED'),
    [ActionType.RELATIONS_DELETED]: $t('tb.actionType.RELATIONS_DELETED'),
    [ActionType.REST_API_RULE_ENGINE_CALL]: $t(
      'tb.actionType.REST_API_RULE_ENGINE_CALL',
    ),
    [ActionType.ALARM_ACK]: $t('tb.actionType.ALARM_ACK'),
    [ActionType.ALARM_CLEAR]: $t('tb.actionType.ALARM_CLEAR'),
    [ActionType.ALARM_DELETE]: $t('tb.actionType.ALARM_DELETE'),
    [ActionType.ALARM_ASSIGNED]: $t('tb.actionType.ALARM_ASSIGNED'),
    [ActionType.ALARM_UNASSIGNED]: $t('tb.actionType.ALARM_UNASSIGNED'),
    [ActionType.LOGIN]: $t('tb.actionType.LOGIN'),
    [ActionType.LOGOUT]: $t('tb.actionType.LOGOUT'),
    [ActionType.LOCKOUT]: $t('tb.actionType.LOCKOUT'),
    [ActionType.ASSIGNED_FROM_TENANT]: $t('tb.actionType.ASSIGNED_FROM_TENANT'),
    [ActionType.ASSIGNED_TO_TENANT]: $t('tb.actionType.ASSIGNED_TO_TENANT'),
    [ActionType.PROVISION_SUCCESS]: $t('tb.actionType.PROVISION_SUCCESS'),
    [ActionType.PROVISION_FAILURE]: $t('tb.actionType.PROVISION_FAILURE'),
    [ActionType.ASSIGNED_TO_EDGE]: $t('tb.actionType.ASSIGNED_TO_EDGE'),
    [ActionType.UNASSIGNED_FROM_EDGE]: $t('tb.actionType.UNASSIGNED_FROM_EDGE'),
    [ActionType.ADDED_COMMENT]: $t('tb.actionType.ADDED_COMMENT'),
    [ActionType.UPDATED_COMMENT]: $t('tb.actionType.UPDATED_COMMENT'),
    [ActionType.DELETED_COMMENT]: $t('tb.actionType.DELETED_COMMENT'),
    [ActionType.SMS_SENT]: $t('tb.actionType.SMS_SENT'),
  };
}

/** 操作类型 → 显示文案(未配置的类型原样返回) */
export function actionTypeLabel(value?: ActionType | string): string {
  if (!value) return '';
  return actionTypeLabelMap()[value as ActionType] ?? value;
}

/** 操作类型下拉选项(label 取多语言文案) */
export function actionTypeOptions(): Array<{
  label: string;
  value: ActionType;
}> {
  const data = actionTypeLabelMap();
  return (Object.keys(data) as ActionType[]).map((value) => ({
    label: data[value],
    value,
  }));
}

export enum ActionStatus {
  FAILURE = 'FAILURE',
  SUCCESS = 'SUCCESS',
}

/** 操作状态 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function actionStatusLabelMap() {
  return {
    [ActionStatus.SUCCESS]: $t('tb.actionStatus.SUCCESS'),
    [ActionStatus.FAILURE]: $t('tb.actionStatus.FAILURE'),
  };
}

/** 操作状态 → 显示文案(未配置的状态原样返回) */
export function actionStatusLabel(value?: ActionStatus | string): string {
  if (!value) return '';
  return actionStatusLabelMap()[value as ActionStatus] ?? value;
}
