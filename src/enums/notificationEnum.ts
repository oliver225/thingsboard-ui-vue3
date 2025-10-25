import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

export enum NotificationType {
  GENERAL = 'GENERAL',
  ALARM = 'ALARM',
  DEVICE_ACTIVITY = 'DEVICE_ACTIVITY',
  ENTITY_ACTION = 'ENTITY_ACTION',
  ALARM_COMMENT = 'ALARM_COMMENT',
  RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT = 'RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT',
  ALARM_ASSIGNMENT = 'ALARM_ASSIGNMENT',
  NEW_PLATFORM_VERSION = 'NEW_PLATFORM_VERSION',
  ENTITIES_LIMIT = 'ENTITIES_LIMIT',
  API_USAGE_LIMIT = 'API_USAGE_LIMIT',
  RULE_NODE = 'RULE_NODE',
  RATE_LIMITS = 'RATE_LIMITS',
  EDGE_CONNECTION = 'EDGE_CONNECTION',
  EDGE_COMMUNICATION_FAILURE = 'EDGE_COMMUNICATION_FAILURE',
  TASK_PROCESSING_FAILURE = 'TASK_PROCESSING_FAILURE',
  RESOURCES_SHORTAGE = 'RESOURCES_SHORTAGE',
}
// 说明：label 现在存放的是国际化 key，使用时请调用 t(item.label)
export const NOTIFICATION_TYPE_OPTIONS = [
  { value: NotificationType.GENERAL, label: t('tb.notification.type.GENERAL') },
  { value: NotificationType.ALARM, label: t('tb.notification.type.ALARM') },
  { value: NotificationType.DEVICE_ACTIVITY, label: t('tb.notification.type.DEVICE_ACTIVITY') },
  { value: NotificationType.ENTITY_ACTION, label: t('tb.notification.type.ENTITY_ACTION') },
  { value: NotificationType.ALARM_COMMENT, label: t('tb.notification.type.ALARM_COMMENT') },
  {
    value: NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT,
    label: t('tb.notification.type.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT'),
  },
  { value: NotificationType.ALARM_ASSIGNMENT, label: t('tb.notification.type.ALARM_ASSIGNMENT') },
  { value: NotificationType.NEW_PLATFORM_VERSION, label: t('tb.notification.type.NEW_PLATFORM_VERSION') },
  { value: NotificationType.ENTITIES_LIMIT, label: t('tb.notification.type.ENTITIES_LIMIT') },
  { value: NotificationType.API_USAGE_LIMIT, label: t('tb.notification.type.API_USAGE_LIMIT') },
  { value: NotificationType.RULE_NODE, label: t('tb.notification.type.RULE_NODE') },
  { value: NotificationType.RATE_LIMITS, label: t('tb.notification.type.RATE_LIMITS') },
  { value: NotificationType.EDGE_CONNECTION, label: t('tb.notification.type.EDGE_CONNECTION') },
  { value: NotificationType.EDGE_COMMUNICATION_FAILURE, label: t('tb.notification.type.EDGE_COMMUNICATION_FAILURE') },
  { value: NotificationType.TASK_PROCESSING_FAILURE, label: t('tb.notification.type.TASK_PROCESSING_FAILURE') },
  { value: NotificationType.RESOURCES_SHORTAGE, label: t('tb.notification.type.RESOURCES_SHORTAGE') },
];

export enum NotificationStatus {
  SENT = 'SENT',
  READ = 'READ',
}
export enum NotificationRequestStatus {
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  SCHEDULED = 'SCHEDULED',
}

export const NOTIFICATION_REQUEST_STATUS_OPTIONS = [
  { value: NotificationRequestStatus.PROCESSING, label: t('tb.notification.requestStatus.PROCESSING') },
  { value: NotificationRequestStatus.SENT, label: t('tb.notification.requestStatus.SENT') },
  { value: NotificationRequestStatus.SCHEDULED, label: t('tb.notification.requestStatus.SCHEDULED') },
];

export enum NotificationRecipientType {
  PLATFORM_USERS = 'PLATFORM_USERS',
  SLACK = 'SLACK',
}

export const NOTIFICATION_RECIPIENT_TYPE_OPTIONS = [
  { value: NotificationRecipientType.PLATFORM_USERS, label: t('tb.notification.recipientType.PLATFORM_USERS') },
  { value: NotificationRecipientType.SLACK, label: t('tb.notification.recipientType.SLACK') },
];

export enum NotificationRecipientUsersFilter {
  ALL_USERS = 'ALL_USERS',
  USER_LIST = 'USER_LIST',
  AFFECTED_USER = 'AFFECTED_USER',
  CUSTOMER_USERS = 'CUSTOMER_USERS',
  TENANT_ADMINISTRATORS = 'TENANT_ADMINISTRATORS',
  SYSTEM_ADMINISTRATORS = 'SYSTEM_ADMINISTRATORS',
  AFFECTED_TENANT_ADMINISTRATORS = 'AFFECTED_TENANT_ADMINISTRATORS',
  ORIGINATOR_ENTITY_OWNER_USERS = 'ORIGINATOR_ENTITY_OWNER_USERS',
}

export const NOTIFICATION_RECIPIENT_USER_FILTER_OPTIONS = [
  { value: NotificationRecipientUsersFilter.ALL_USERS, label: t('tb.notification.recipientUsersFilter.ALL_USERS') },
  { value: NotificationRecipientUsersFilter.USER_LIST, label: t('tb.notification.recipientUsersFilter.USER_LIST') },
  {
    value: NotificationRecipientUsersFilter.CUSTOMER_USERS,
    label: t('tb.notification.recipientUsersFilter.CUSTOMER_USERS'),
  },
  {
    value: NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS,
    label: t('tb.notification.recipientUsersFilter.TENANT_ADMINISTRATORS'),
  },
  {
    value: NotificationRecipientUsersFilter.SYSTEM_ADMINISTRATORS,
    label: t('tb.notification.recipientUsersFilter.SYSTEM_ADMINISTRATORS'),
  },
  {
    value: NotificationRecipientUsersFilter.AFFECTED_USER,
    label: t('tb.notification.recipientUsersFilter.AFFECTED_USER'),
  },
  {
    value: NotificationRecipientUsersFilter.AFFECTED_TENANT_ADMINISTRATORS,
    label: t('tb.notification.recipientUsersFilter.AFFECTED_TENANT_ADMINISTRATORS'),
  },
  {
    value: NotificationRecipientUsersFilter.ORIGINATOR_ENTITY_OWNER_USERS,
    label: t('tb.notification.recipientUsersFilter.ORIGINATOR_ENTITY_OWNER_USERS'),
  },
];
