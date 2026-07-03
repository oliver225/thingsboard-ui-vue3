/**
 * 通知相关枚举
 * 契约参考:common/data 下 notification.NotificationType / NotificationStatus / NotificationDeliveryMethod
 */
import { $t } from '@vben/locales';

/** 通知类型(org.thingsboard.server.common.data.notification.NotificationType) */
export enum NotificationType {
  ALARM = 'ALARM',
  ALARM_ASSIGNMENT = 'ALARM_ASSIGNMENT',
  ALARM_COMMENT = 'ALARM_COMMENT',
  API_USAGE_LIMIT = 'API_USAGE_LIMIT',
  DEVICE_ACTIVITY = 'DEVICE_ACTIVITY',
  EDGE_COMMUNICATION_FAILURE = 'EDGE_COMMUNICATION_FAILURE',
  EDGE_CONNECTION = 'EDGE_CONNECTION',
  ENTITIES_LIMIT = 'ENTITIES_LIMIT',
  ENTITIES_LIMIT_INCREASE_REQUEST = 'ENTITIES_LIMIT_INCREASE_REQUEST',
  ENTITY_ACTION = 'ENTITY_ACTION',
  GENERAL = 'GENERAL',
  NEW_PLATFORM_VERSION = 'NEW_PLATFORM_VERSION',
  RATE_LIMITS = 'RATE_LIMITS',
  RESOURCES_SHORTAGE = 'RESOURCES_SHORTAGE',
  RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT = 'RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT',
  RULE_NODE = 'RULE_NODE',
  TASK_PROCESSING_FAILURE = 'TASK_PROCESSING_FAILURE',
}

/** 通知类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function notificationTypeLabelMap() {
  return {
    [NotificationType.GENERAL]: $t('tb.notification.type.GENERAL'),
    [NotificationType.ALARM]: $t('tb.notification.type.ALARM'),
    [NotificationType.DEVICE_ACTIVITY]: $t(
      'tb.notification.type.DEVICE_ACTIVITY',
    ),
    [NotificationType.ENTITY_ACTION]: $t('tb.notification.type.ENTITY_ACTION'),
    [NotificationType.ALARM_COMMENT]: $t('tb.notification.type.ALARM_COMMENT'),
    [NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT]: $t(
      'tb.notification.type.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT',
    ),
    [NotificationType.ALARM_ASSIGNMENT]: $t(
      'tb.notification.type.ALARM_ASSIGNMENT',
    ),
    [NotificationType.NEW_PLATFORM_VERSION]: $t(
      'tb.notification.type.NEW_PLATFORM_VERSION',
    ),
    [NotificationType.ENTITIES_LIMIT]: $t(
      'tb.notification.type.ENTITIES_LIMIT',
    ),
    [NotificationType.ENTITIES_LIMIT_INCREASE_REQUEST]: $t(
      'tb.notification.type.ENTITIES_LIMIT_INCREASE_REQUEST',
    ),
    [NotificationType.API_USAGE_LIMIT]: $t(
      'tb.notification.type.API_USAGE_LIMIT',
    ),
    [NotificationType.RULE_NODE]: $t('tb.notification.type.RULE_NODE'),
    [NotificationType.RATE_LIMITS]: $t('tb.notification.type.RATE_LIMITS'),
    [NotificationType.EDGE_CONNECTION]: $t(
      'tb.notification.type.EDGE_CONNECTION',
    ),
    [NotificationType.EDGE_COMMUNICATION_FAILURE]: $t(
      'tb.notification.type.EDGE_COMMUNICATION_FAILURE',
    ),
    [NotificationType.TASK_PROCESSING_FAILURE]: $t(
      'tb.notification.type.TASK_PROCESSING_FAILURE',
    ),
    [NotificationType.RESOURCES_SHORTAGE]: $t(
      'tb.notification.type.RESOURCES_SHORTAGE',
    ),
  };
}

/** 通知类型 → 显示文案(未配置的类型原样返回) */
export function notificationTypeLabel(
  value?: NotificationType | string,
): string {
  if (!value) return '';
  return notificationTypeLabelMap()[value as NotificationType] ?? value;
}

/** 通知类型下拉 / 筛选选项(label 取多语言文案) */
export function notificationTypeOptions(): Array<{
  label: string;
  value: NotificationType;
}> {
  const data = notificationTypeLabelMap();
  return (Object.keys(data) as NotificationType[]).map((value) => ({
    label: data[value],
    value,
  }));
}

/** 通知状态(NotificationStatus):SENT 即未读,READ 已读 */
export enum NotificationStatus {
  READ = 'READ',
  SENT = 'SENT',
}

/** 通知状态 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function notificationStatusLabelMap() {
  return {
    [NotificationStatus.SENT]: $t('tb.notification.status.SENT'),
    [NotificationStatus.READ]: $t('tb.notification.status.READ'),
  };
}

/** 通知状态 → 显示文案(未配置的状态原样返回) */
export function notificationStatusLabel(
  value?: NotificationStatus | string,
): string {
  if (!value) return '';
  return notificationStatusLabelMap()[value as NotificationStatus] ?? value;
}

/** 通知状态下拉 / 筛选选项(label 取多语言文案) */
export function notificationStatusOptions(): Array<{
  label: string;
  value: NotificationStatus;
}> {
  const data = notificationStatusLabelMap();
  return (Object.keys(data) as NotificationStatus[]).map((value) => ({
    label: data[value],
    value,
  }));
}

/** 通知发送请求状态(NotificationRequestStatus) */
export enum NotificationRequestStatus {
  PROCESSING = 'PROCESSING',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
}

/** 发送请求状态 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function notificationRequestStatusLabelMap() {
  return {
    [NotificationRequestStatus.SCHEDULED]: $t(
      'tb.notification.request.status.SCHEDULED',
    ),
    [NotificationRequestStatus.PROCESSING]: $t(
      'tb.notification.request.status.PROCESSING',
    ),
    [NotificationRequestStatus.SENT]: $t('tb.notification.request.status.SENT'),
  };
}

/** 发送请求状态 → 显示文案(未配置的状态原样返回) */
export function notificationRequestStatusLabel(
  value?: NotificationRequestStatus | string,
): string {
  if (!value) return '';
  return (
    notificationRequestStatusLabelMap()[value as NotificationRequestStatus] ??
    value
  );
}

/** 发送请求状态下拉 / 筛选选项(label 取多语言文案) */
export function notificationRequestStatusOptions(): Array<{
  label: string;
  value: NotificationRequestStatus;
}> {
  const data = notificationRequestStatusLabelMap();
  return (Object.keys(data) as NotificationRequestStatus[]).map((value) => ({
    label: data[value],
    value,
  }));
}

/** 收件人组类型(NotificationTargetType / configuration.type) */
export enum NotificationTargetType {
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
  PLATFORM_USERS = 'PLATFORM_USERS',
  SLACK = 'SLACK',
}

/** 收件人组类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function notificationTargetTypeLabelMap() {
  return {
    [NotificationTargetType.PLATFORM_USERS]: $t(
      'tb.notification.recipient.targetType.PLATFORM_USERS',
    ),
    [NotificationTargetType.SLACK]: $t(
      'tb.notification.recipient.targetType.SLACK',
    ),
    [NotificationTargetType.MICROSOFT_TEAMS]: $t(
      'tb.notification.recipient.targetType.MICROSOFT_TEAMS',
    ),
  };
}

/** 收件人组类型 → 显示文案(未配置的类型原样返回) */
export function notificationTargetTypeLabel(
  value?: NotificationTargetType | string,
): string {
  if (!value) return '';
  return (
    notificationTargetTypeLabelMap()[value as NotificationTargetType] ?? value
  );
}

/** 收件人组类型下拉 / 筛选选项(label 取多语言文案) */
export function notificationTargetTypeOptions(): Array<{
  label: string;
  value: NotificationTargetType;
}> {
  const data = notificationTargetTypeLabelMap();
  return (Object.keys(data) as NotificationTargetType[]).map((value) => ({
    label: data[value],
    value,
  }));
}

/** 平台用户过滤类型(NotificationTargetConfigType / usersFilter.type) */
export enum NotificationTargetConfigType {
  AFFECTED_TENANT_ADMINISTRATORS = 'AFFECTED_TENANT_ADMINISTRATORS',
  AFFECTED_USER = 'AFFECTED_USER',
  ALL_USERS = 'ALL_USERS',
  CUSTOMER_USERS = 'CUSTOMER_USERS',
  ORIGINATOR_ENTITY_OWNER_USERS = 'ORIGINATOR_ENTITY_OWNER_USERS',
  SYSTEM_ADMINISTRATORS = 'SYSTEM_ADMINISTRATORS',
  TENANT_ADMINISTRATORS = 'TENANT_ADMINISTRATORS',
  USER_LIST = 'USER_LIST',
}

/** 平台用户过滤类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function notificationTargetConfigTypeLabelMap() {
  return {
    [NotificationTargetConfigType.ALL_USERS]: $t(
      'tb.notification.recipient.filterType.ALL_USERS',
    ),
    [NotificationTargetConfigType.TENANT_ADMINISTRATORS]: $t(
      'tb.notification.recipient.filterType.TENANT_ADMINISTRATORS',
    ),
    [NotificationTargetConfigType.AFFECTED_TENANT_ADMINISTRATORS]: $t(
      'tb.notification.recipient.filterType.AFFECTED_TENANT_ADMINISTRATORS',
    ),
    [NotificationTargetConfigType.SYSTEM_ADMINISTRATORS]: $t(
      'tb.notification.recipient.filterType.SYSTEM_ADMINISTRATORS',
    ),
    [NotificationTargetConfigType.CUSTOMER_USERS]: $t(
      'tb.notification.recipient.filterType.CUSTOMER_USERS',
    ),
    [NotificationTargetConfigType.USER_LIST]: $t(
      'tb.notification.recipient.filterType.USER_LIST',
    ),
    [NotificationTargetConfigType.ORIGINATOR_ENTITY_OWNER_USERS]: $t(
      'tb.notification.recipient.filterType.ORIGINATOR_ENTITY_OWNER_USERS',
    ),
    [NotificationTargetConfigType.AFFECTED_USER]: $t(
      'tb.notification.recipient.filterType.AFFECTED_USER',
    ),
  };
}

/** 平台用户过滤类型 → 显示文案(未配置的类型原样返回) */
export function notificationTargetConfigTypeLabel(
  value?: NotificationTargetConfigType | string,
): string {
  if (!value) return '';
  return (
    notificationTargetConfigTypeLabelMap()[
      value as NotificationTargetConfigType
    ] ?? value
  );
}

/** 平台用户过滤类型下拉 / 筛选选项(label 取多语言文案) */
export function notificationTargetConfigTypeOptions(): Array<{
  label: string;
  value: NotificationTargetConfigType;
}> {
  const data = notificationTargetConfigTypeLabelMap();
  return (Object.keys(data) as NotificationTargetConfigType[]).map((value) => ({
    label: data[value],
    value,
  }));
}

/** 通知规则触发器类型(NotificationRuleTriggerType / triggerType) */
export enum NotificationRuleTriggerType {
  ALARM = 'ALARM',
  ALARM_ASSIGNMENT = 'ALARM_ASSIGNMENT',
  ALARM_COMMENT = 'ALARM_COMMENT',
  API_USAGE_LIMIT = 'API_USAGE_LIMIT',
  DEVICE_ACTIVITY = 'DEVICE_ACTIVITY',
  EDGE_COMMUNICATION_FAILURE = 'EDGE_COMMUNICATION_FAILURE',
  EDGE_CONNECTION = 'EDGE_CONNECTION',
  ENTITIES_LIMIT = 'ENTITIES_LIMIT',
  ENTITY_ACTION = 'ENTITY_ACTION',
  NEW_PLATFORM_VERSION = 'NEW_PLATFORM_VERSION',
  RATE_LIMITS = 'RATE_LIMITS',
  RESOURCES_SHORTAGE = 'RESOURCES_SHORTAGE',
  RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT = 'RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT',
  TASK_PROCESSING_FAILURE = 'TASK_PROCESSING_FAILURE',
}

/**
 * 触发器类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换)。
 * 触发器类型值是通知类型的子集,复用 tb.notification.type.* 文案。
 */
export function notificationRuleTriggerTypeLabelMap() {
  return {
    [NotificationRuleTriggerType.ALARM]: $t('tb.notification.type.ALARM'),
    [NotificationRuleTriggerType.DEVICE_ACTIVITY]: $t(
      'tb.notification.type.DEVICE_ACTIVITY',
    ),
    [NotificationRuleTriggerType.ENTITY_ACTION]: $t(
      'tb.notification.type.ENTITY_ACTION',
    ),
    [NotificationRuleTriggerType.ALARM_COMMENT]: $t(
      'tb.notification.type.ALARM_COMMENT',
    ),
    [NotificationRuleTriggerType.ALARM_ASSIGNMENT]: $t(
      'tb.notification.type.ALARM_ASSIGNMENT',
    ),
    [NotificationRuleTriggerType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT]: $t(
      'tb.notification.type.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT',
    ),
    [NotificationRuleTriggerType.ENTITIES_LIMIT]: $t(
      'tb.notification.type.ENTITIES_LIMIT',
    ),
    [NotificationRuleTriggerType.API_USAGE_LIMIT]: $t(
      'tb.notification.type.API_USAGE_LIMIT',
    ),
    [NotificationRuleTriggerType.NEW_PLATFORM_VERSION]: $t(
      'tb.notification.type.NEW_PLATFORM_VERSION',
    ),
    [NotificationRuleTriggerType.RATE_LIMITS]: $t(
      'tb.notification.type.RATE_LIMITS',
    ),
    [NotificationRuleTriggerType.EDGE_CONNECTION]: $t(
      'tb.notification.type.EDGE_CONNECTION',
    ),
    [NotificationRuleTriggerType.EDGE_COMMUNICATION_FAILURE]: $t(
      'tb.notification.type.EDGE_COMMUNICATION_FAILURE',
    ),
    [NotificationRuleTriggerType.TASK_PROCESSING_FAILURE]: $t(
      'tb.notification.type.TASK_PROCESSING_FAILURE',
    ),
    [NotificationRuleTriggerType.RESOURCES_SHORTAGE]: $t(
      'tb.notification.type.RESOURCES_SHORTAGE',
    ),
  };
}

/** 触发器类型 → 显示文案(未配置的类型原样返回) */
export function notificationRuleTriggerTypeLabel(
  value?: NotificationRuleTriggerType | string,
): string {
  if (!value) return '';
  return (
    notificationRuleTriggerTypeLabelMap()[
      value as NotificationRuleTriggerType
    ] ?? value
  );
}

/** 触发器类型下拉 / 筛选选项(label 取多语言文案) */
export function notificationRuleTriggerTypeOptions(): Array<{
  label: string;
  value: NotificationRuleTriggerType;
}> {
  const data = notificationRuleTriggerTypeLabelMap();
  return (Object.keys(data) as NotificationRuleTriggerType[]).map((value) => ({
    label: data[value],
    value,
  }));
}

/** 通知投递方式(NotificationDeliveryMethod) */
export enum NotificationDeliveryMethod {
  EMAIL = 'EMAIL',
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
  MOBILE_APP = 'MOBILE_APP',
  SLACK = 'SLACK',
  SMS = 'SMS',
  WEB = 'WEB',
}
