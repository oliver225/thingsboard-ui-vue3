import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

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
  QUEUE_STATS = 'QUEUE_STATS',
  OAUTH2_CLIENT = 'OAUTH2_CLIENT',
  DOMAIN = 'DOMAIN',
  MOBILE_APP = 'MOBILE_APP',
  MOBILE_APP_BUNDLE = 'MOBILE_APP_BUNDLE',
  CALCULATED_FIELD = 'CALCULATED_FIELD',
  CALCULATED_FIELD_LINK = 'CALCULATED_FIELD_LINK',
  JOB = 'JOB',
  ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  AI_MODEL = 'AI_MODEL',
}

export const ENTITY_TYPE_OPTIONS = [
  { value: EntityType.TENANT, label: t('tb.entityType.TENANT') },
  { value: EntityType.CUSTOMER, label: t('tb.entityType.CUSTOMER') },
  { value: EntityType.USER, label: t('tb.entityType.USER') },
  { value: EntityType.DASHBOARD, label: t('tb.entityType.DASHBOARD') },
  { value: EntityType.TB_VISUAL, label: t('tb.entityType.TB_VISUAL') },
  { value: EntityType.ASSET, label: t('tb.entityType.ASSET') },
  { value: EntityType.DEVICE, label: t('tb.entityType.DEVICE') },
  { value: EntityType.ALARM, label: t('tb.entityType.ALARM') },
  { value: EntityType.RULE_CHAIN, label: t('tb.entityType.RULE_CHAIN') },
  { value: EntityType.RULE_NODE, label: t('tb.entityType.RULE_NODE') },
  { value: EntityType.ENTITY_VIEW, label: t('tb.entityType.ENTITY_VIEW') },
  { value: EntityType.WIDGETS_BUNDLE, label: t('tb.entityType.WIDGETS_BUNDLE') },
  { value: EntityType.WIDGET_TYPE, label: t('tb.entityType.WIDGET_TYPE') },
  { value: EntityType.TENANT_PROFILE, label: t('tb.entityType.TENANT_PROFILE') },
  { value: EntityType.DEVICE_PROFILE, label: t('tb.entityType.DEVICE_PROFILE') },
  { value: EntityType.ASSET_PROFILE, label: t('tb.entityType.ASSET_PROFILE') },
  { value: EntityType.API_USAGE_STATE, label: t('tb.entityType.API_USAGE_STATE') },
  { value: EntityType.TB_RESOURCE, label: t('tb.entityType.TB_RESOURCE') },
  { value: EntityType.OTA_PACKAGE, label: t('tb.entityType.OTA_PACKAGE') },
  { value: EntityType.EDGE, label: t('tb.entityType.EDGE') },
  { value: EntityType.RPC, label: t('tb.entityType.RPC') },
  { value: EntityType.QUEUE, label: t('tb.entityType.QUEUE') },
  { value: EntityType.NOTIFICATION_TARGET, label: t('tb.entityType.NOTIFICATION_TARGET') },
  { value: EntityType.NOTIFICATION_TEMPLATE, label: t('tb.entityType.NOTIFICATION_TEMPLATE') },
  { value: EntityType.NOTIFICATION_REQUEST, label: t('tb.entityType.NOTIFICATION_REQUEST') },
  { value: EntityType.NOTIFICATION, label: t('tb.entityType.NOTIFICATION') },
  { value: EntityType.NOTIFICATION_RULE, label: t('tb.entityType.NOTIFICATION_RULE') },
  { value: EntityType.CALCULATED_FIELD, label: t('tb.entityType.CALCULATED_FIELD') },
  { value: EntityType.OAUTH2_CLIENT, label: t('tb.entityType.OAUTH2_CLIENT') },
  { value: EntityType.DOMAIN, label: t('tb.entityType.DOMAIN') },
  { value: EntityType.AI_MODEL, label: t('tb.entityType.AI_MODEL') },
  { value: EntityType.MOBILE_APP, label: t('tb.entityType.MOBILE_APP') },
  { value: EntityType.MOBILE_APP_BUNDLE, label: t('tb.entityType.MOBILE_APP_BUNDLE') },
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
  REST_API_RULE_ENGINE_CALL = 'REST_API_RULE_ENGINE_CALL',
  SMS_SENT = 'SMS_SENT',
}

export const ACTION_TYPE_OPTIONS = [
  { value: ActionType.ADDED, label: t('tb.actionType.ADDED') },
  { value: ActionType.DELETED, label: t('tb.actionType.DELETED') },
  { value: ActionType.UPDATED, label: t('tb.actionType.UPDATED') },
  { value: ActionType.LOGIN, label: t('tb.actionType.LOGIN') },
  { value: ActionType.LOGOUT, label: t('tb.actionType.LOGOUT') },
  { value: ActionType.LOCKOUT, label: t('tb.actionType.LOCKOUT') },
  { value: ActionType.ATTRIBUTES_UPDATED, label: t('tb.actionType.ATTRIBUTES_UPDATED') },
  { value: ActionType.ATTRIBUTES_DELETED, label: t('tb.actionType.ATTRIBUTES_DELETED') },
  { value: ActionType.TIMESERIES_UPDATED, label: t('tb.actionType.TIMESERIES_UPDATED') },
  { value: ActionType.TIMESERIES_DELETED, label: t('tb.actionType.TIMESERIES_DELETED') },
  { value: ActionType.RPC_CALL, label: t('tb.actionType.RPC_CALL') },
  { value: ActionType.CREDENTIALS_UPDATED, label: t('tb.actionType.CREDENTIALS_UPDATED') },
  { value: ActionType.ASSIGNED_TO_CUSTOMER, label: t('tb.actionType.ASSIGNED_TO_CUSTOMER') },
  { value: ActionType.UNASSIGNED_FROM_CUSTOMER, label: t('tb.actionType.UNASSIGNED_FROM_CUSTOMER') },
  { value: ActionType.ACTIVATED, label: t('tb.actionType.ACTIVATED') },
  { value: ActionType.SUSPENDED, label: t('tb.actionType.SUSPENDED') },
  { value: ActionType.CREDENTIALS_READ, label: t('tb.actionType.CREDENTIALS_READ') },
  { value: ActionType.ATTRIBUTES_READ, label: t('tb.actionType.ATTRIBUTES_READ') },
  { value: ActionType.RELATION_ADD_OR_UPDATE, label: t('tb.actionType.RELATION_ADD_OR_UPDATE') },
  { value: ActionType.RELATION_DELETED, label: t('tb.actionType.RELATION_DELETED') },
  { value: ActionType.RELATIONS_DELETED, label: t('tb.actionType.RELATIONS_DELETED') },
  { value: ActionType.ALARM_ACK, label: t('tb.actionType.ALARM_ACK') },
  { value: ActionType.ALARM_CLEAR, label: t('tb.actionType.ALARM_CLEAR') },
  { value: ActionType.ALARM_DELETE, label: t('tb.actionType.ALARM_DELETE') },
  { value: ActionType.ALARM_ASSIGNED, label: t('tb.actionType.ALARM_ASSIGNED') },
  { value: ActionType.ALARM_UNASSIGNED, label: t('tb.actionType.ALARM_UNASSIGNED') },
  { value: ActionType.ASSIGNED_FROM_TENANT, label: t('tb.actionType.ASSIGNED_FROM_TENANT') },
  { value: ActionType.ASSIGNED_TO_TENANT, label: t('tb.actionType.ASSIGNED_TO_TENANT') },
  { value: ActionType.PROVISION_SUCCESS, label: t('tb.actionType.PROVISION_SUCCESS') },
  { value: ActionType.PROVISION_FAILURE, label: t('tb.actionType.PROVISION_FAILURE') },
  { value: ActionType.ASSIGNED_TO_EDGE, label: t('tb.actionType.ASSIGNED_TO_EDGE') },
  { value: ActionType.UNASSIGNED_FROM_EDGE, label: t('tb.actionType.UNASSIGNED_FROM_EDGE') },
  { value: ActionType.ADDED_COMMENT, label: t('tb.actionType.ADDED_COMMENT') },
  { value: ActionType.UPDATED_COMMENT, label: t('tb.actionType.UPDATED_COMMENT') },
  { value: ActionType.DELETED_COMMENT, label: t('tb.actionType.DELETED_COMMENT') },
  { value: ActionType.REST_API_RULE_ENGINE_CALL, label: t('tb.actionType.REST_API_RULE_ENGINE_CALL') },
  { value: ActionType.SMS_SENT, label: t('tb.actionType.SMS_SENT') },
];

export enum OriginatorSource {
  CUSTOMER = 'CUSTOMER',
  TENANT = 'TENANT',
  RELATED = 'RELATED',
  ALARM_ORIGINATOR = 'ALARM_ORIGINATOR',
  ENTITY = 'ENTITY',
}
