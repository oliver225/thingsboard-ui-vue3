export enum EntityType {
  TENANT = 'TENANT',
  CUSTOMER = 'CUSTOMER',
  USER = 'USER',
  DASHBOARD = 'DASHBOARD',
  TB_VISUAL = 'TB_VISUAL',
  ASSET = 'ASSET',
  DEVICE = 'DEVICE',
  ALARM = 'ALARM',
  RULE_CHAIN = 'RULE_CHAIN',
  RULE_NODE = 'RULE_NODE',
  ENTITY_VIEW = 'ENTITY_VIEW',
  WIDGETS_BUNDLE = 'WIDGETS_BUNDLE',
  WIDGET_TYPE = 'WIDGET_TYPE',
  TENANT_PROFILE = 'TENANT_PROFILE',
  DEVICE_PROFILE = 'DEVICE_PROFILE',
  ASSET_PROFILE = 'ASSET_PROFILE',
  API_USAGE_STATE = 'API_USAGE_STATE',
  TB_RESOURCE = 'TB_RESOURCE',
  OTA_PACKAGE = 'OTA_PACKAGE',
  EDGE = 'EDGE',
  RPC = 'RPC',
  QUEUE = 'QUEUE',
  NOTIFICATION_TARGET = 'NOTIFICATION_TARGET',
  NOTIFICATION_TEMPLATE = 'NOTIFICATION_TEMPLATE',
  NOTIFICATION_REQUEST = 'NOTIFICATION_REQUEST',
  NOTIFICATION = 'NOTIFICATION',
  NOTIFICATION_RULE = 'NOTIFICATION_RULE',
}

export const ENTITY_TYPE_OPTIONS = [
  { value: EntityType.TENANT, label: '租户' },
  { value: EntityType.CUSTOMER, label: '客户' },
  { value: EntityType.USER, label: '用户' },
  { value: EntityType.DASHBOARD, label: '仪表盘' },
  { value: EntityType.TB_VISUAL, label: '数据大屏' },
  { value: EntityType.ASSET, label: '资产' },
  { value: EntityType.DEVICE, label: '设备' },
  { value: EntityType.ALARM, label: '报警' },
  { value: EntityType.RULE_CHAIN, label: '规则链' },
  { value: EntityType.RULE_NODE, label: '规则节点' },
  { value: EntityType.ENTITY_VIEW, label: '实体视图' },
  { value: EntityType.WIDGETS_BUNDLE, label: '部件包' },
  { value: EntityType.WIDGET_TYPE, label: '部件类型' },
  { value: EntityType.TENANT_PROFILE, label: '租户配置' },
  { value: EntityType.DEVICE_PROFILE, label: '设备配置' },
  { value: EntityType.ASSET_PROFILE, label: '资产配置' },
  { value: EntityType.API_USAGE_STATE, label: 'API统计' },
  { value: EntityType.TB_RESOURCE, label: '资源库' },
  { value: EntityType.OTA_PACKAGE, label: 'OTA包' },
  { value: EntityType.EDGE, label: '边缘' },
  { value: EntityType.RPC, label: 'PRC' },
  { value: EntityType.QUEUE, label: '队列' },
  { value: EntityType.NOTIFICATION_TARGET, label: '通知接收组' },
  { value: EntityType.NOTIFICATION_TEMPLATE, label: '通知模板' },
  { value: EntityType.NOTIFICATION_REQUEST, label: '通知记录' },
  { value: EntityType.NOTIFICATION, label: '通知' },
  { value: EntityType.NOTIFICATION_RULE, label: '通知规则' },
];

export enum ActionType {
  ADDED = 'ADDED', // log entity
  DELETED = 'DELETED', // log string id
  UPDATED = 'UPDATED', // log entity
  ATTRIBUTES_UPDATED = 'ATTRIBUTES_UPDATED', // log attributes/values
  ATTRIBUTES_DELETED = 'ATTRIBUTES_DELETED', // log attributes
  TIMESERIES_UPDATED = 'TIMESERIES_UPDATED', // log timeseries update
  TIMESERIES_DELETED = 'TIMESERIES_DELETED', // log timeseries
  RPC_CALL = 'RPC_CALL', // log method and params
  CREDENTIALS_UPDATED = 'CREDENTIALS_UPDATED', // log new credentials
  ASSIGNED_TO_CUSTOMER = 'ASSIGNED_TO_CUSTOMER', // log customer name
  UNASSIGNED_FROM_CUSTOMER = 'UNASSIGNED_FROM_CUSTOMER', // log customer name
  ACTIVATED = 'ACTIVATED', // log string id
  SUSPENDED = 'SUSPENDED', // log string id
  CREDENTIALS_READ = 'CREDENTIALS_READ', // log device id
  ATTRIBUTES_READ = 'ATTRIBUTES_READ', // log attributes
  RELATION_ADD_OR_UPDATE = 'RELATION_ADD_OR_UPDATE',
  RELATION_DELETED = 'RELATION_DELETED',
  RELATIONS_DELETED = 'RELATIONS_DELETED',
  ALARM_ACK = 'ALARM_ACK',
  ALARM_CLEAR = 'ALARM_CLEAR',
  ALARM_DELETE = 'ALARM_DELETE',
  ALARM_ASSIGNED = 'ALARM_ASSIGNED',
  ALARM_UNASSIGNED = 'ALARM_UNASSIGNED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOCKOUT = 'LOCKOUT',
  ASSIGNED_FROM_TENANT = 'ASSIGNED_FROM_TENANT',
  ASSIGNED_TO_TENANT = 'ASSIGNED_TO_TENANT',
  PROVISION_SUCCESS = 'PROVISION_SUCCESS',
  PROVISION_FAILURE = 'PROVISION_FAILURE',
  ASSIGNED_TO_EDGE = 'ASSIGNED_TO_EDGE', // log edge name
  UNASSIGNED_FROM_EDGE = 'UNASSIGNED_FROM_EDGE',
  ADDED_COMMENT = 'ADDED_COMMENT',
  UPDATED_COMMENT = 'UPDATED_COMMENT',
  DELETED_COMMENT = 'DELETED_COMMENT',
}

export const ACTION_TYPE_OPTIONS = [
  { value: ActionType.ADDED, label: '新增' },
  { value: ActionType.DELETED, label: '删除' },
  { value: ActionType.UPDATED, label: '更新' },
  { value: ActionType.LOGIN, label: '登录' },
  { value: ActionType.LOGOUT, label: '注销' },
  { value: ActionType.LOCKOUT, label: '锁定' },
  { value: ActionType.ATTRIBUTES_UPDATED, label: '更新属性' },
  { value: ActionType.ATTRIBUTES_DELETED, label: '删除属性' },
  { value: ActionType.TIMESERIES_UPDATED, label: '更新遥测数据' },
  { value: ActionType.TIMESERIES_DELETED, label: '删除遥测数据' },
  { value: ActionType.RPC_CALL, label: 'RCP 调用' },
  { value: ActionType.CREDENTIALS_UPDATED, label: '更新凭证' },
  { value: ActionType.ASSIGNED_TO_CUSTOMER, label: '委给客户' },
  { value: ActionType.UNASSIGNED_FROM_CUSTOMER, label: '取消分委客户' },
  { value: ActionType.ACTIVATED, label: '上线' },
  { value: ActionType.SUSPENDED, label: '暂停' },
  { value: ActionType.CREDENTIALS_READ, label: '凭证已读' },
  { value: ActionType.ATTRIBUTES_READ, label: '属性已读' },
  { value: ActionType.RELATION_ADD_OR_UPDATE, label: '更新关联' },
  { value: ActionType.RELATION_DELETED, label: '删除关联' },
  { value: ActionType.RELATIONS_DELETED, label: '删除所有关联' },
  { value: ActionType.ALARM_ACK, label: '告警确认' },
  { value: ActionType.ALARM_CLEAR, label: '告警清理' },
  { value: ActionType.ALARM_DELETE, label: '告警删除' },
  { value: ActionType.ALARM_ASSIGNED, label: '告警委托' },
  { value: ActionType.ALARM_UNASSIGNED, label: '取消告警委托' },
  { value: ActionType.ASSIGNED_FROM_TENANT, label: '从租户委托' },
  { value: ActionType.ASSIGNED_TO_TENANT, label: '委托给租户' },
  { value: ActionType.PROVISION_SUCCESS, label: ActionType.PROVISION_SUCCESS },
  { value: ActionType.PROVISION_FAILURE, label: ActionType.PROVISION_FAILURE },
  { value: ActionType.ASSIGNED_TO_EDGE, label: '委托给Edge' },
  { value: ActionType.UNASSIGNED_FROM_EDGE, label: '取消委托给Edge' },
  { value: ActionType.ADDED_COMMENT, label: '添加评论' },
  { value: ActionType.UPDATED_COMMENT, label: '更新评论' },
  { value: ActionType.DELETED_COMMENT, label: '删除评论' },
];

export enum OriginatorSource {
  CUSTOMER = 'CUSTOMER',
  TENANT = 'TENANT',
  RELATED = 'RELATED',
  ALARM_ORIGINATOR = 'ALARM_ORIGINATOR',
  ENTITY = 'ENTITY',
}
