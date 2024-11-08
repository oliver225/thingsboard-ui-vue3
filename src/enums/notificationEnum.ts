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
}
export const NOTIFICATION_TYPE_OPTIONS = [
  { value: NotificationType.GENERAL, label: '通用' },
  { value: NotificationType.ALARM, label: '告警' },
  { value: NotificationType.DEVICE_ACTIVITY, label: '设备活动' },
  { value: NotificationType.ENTITY_ACTION, label: '实体操作' },
  { value: NotificationType.ALARM_COMMENT, label: '告警评论' },
  { value: NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT, label: '规则引擎生命周期事件' },
  { value: NotificationType.ALARM_ASSIGNMENT, label: '告警分配' },
  { value: NotificationType.NEW_PLATFORM_VERSION, label: '平台新版本' },
  { value: NotificationType.ENTITIES_LIMIT, label: '实体限制' },
  { value: NotificationType.API_USAGE_LIMIT, label: 'API限制' },
  { value: NotificationType.RULE_NODE, label: '规则节点' },
  { value: NotificationType.RATE_LIMITS, label: '超过速率限制' },
  { value: NotificationType.EDGE_CONNECTION, label: 'Edge 连接' },
  { value: NotificationType.EDGE_COMMUNICATION_FAILURE, label: 'Edge 连接失败' },
  { value: NotificationType.TASK_PROCESSING_FAILURE, label: '任务处理失败' },
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
  { value: NotificationRequestStatus.PROCESSING, label: '处理中' },
  { value: NotificationRequestStatus.SENT, label: '已发送' },
  { value: NotificationRequestStatus.SCHEDULED, label: '定时中' },
];

export enum NotificationRecipientType {
  PLATFORM_USERS = 'PLATFORM_USERS',
  SLACK = 'SLACK',
}

export const NOTIFICATION_RECIPIENT_TYPE_OPTIONS = [
  { value: NotificationRecipientType.PLATFORM_USERS, label: '平台用户' },
  { value: NotificationRecipientType.SLACK, label: 'Slack用户' },
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
  { value: NotificationRecipientUsersFilter.ALL_USERS, label: '所有用户' },
  { value: NotificationRecipientUsersFilter.USER_LIST, label: '用户列表' },
  { value: NotificationRecipientUsersFilter.CUSTOMER_USERS, label: '客户' },
  { value: NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS, label: '租户管理员' },
  { value: NotificationRecipientUsersFilter.SYSTEM_ADMINISTRATORS, label: '系统管理员' },
  { value: NotificationRecipientUsersFilter.AFFECTED_USER, label: '受影响的用户' },
  {
    value: NotificationRecipientUsersFilter.AFFECTED_TENANT_ADMINISTRATORS,
    label: '受影响的租户管理员',
  },
  { value: NotificationRecipientUsersFilter.ORIGINATOR_ENTITY_OWNER_USERS, label: '实体所属用户' },
];
