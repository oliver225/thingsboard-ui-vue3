/**
 * 实体类型(对应后端 org.thingsboard.server.common.data.EntityType)
 */
import { $t } from '@vben/locales';

export enum EntityType {
  ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  AI_MODEL = 'AI_MODEL',
  ALARM = 'ALARM',
  API_KEY = 'API_KEY',
  API_USAGE_STATE = 'API_USAGE_STATE',
  ASSET = 'ASSET',
  ASSET_PROFILE = 'ASSET_PROFILE',
  CALCULATED_FIELD = 'CALCULATED_FIELD',
  CUSTOMER = 'CUSTOMER',
  DASHBOARD = 'DASHBOARD',
  DEVICE = 'DEVICE',
  DEVICE_PROFILE = 'DEVICE_PROFILE',
  DOMAIN = 'DOMAIN',
  EDGE = 'EDGE',
  ENTITY_VIEW = 'ENTITY_VIEW',
  JOB = 'JOB',
  MOBILE_APP = 'MOBILE_APP',
  MOBILE_APP_BUNDLE = 'MOBILE_APP_BUNDLE',
  NOTIFICATION = 'NOTIFICATION',
  NOTIFICATION_REQUEST = 'NOTIFICATION_REQUEST',
  NOTIFICATION_RULE = 'NOTIFICATION_RULE',
  NOTIFICATION_TARGET = 'NOTIFICATION_TARGET',
  NOTIFICATION_TEMPLATE = 'NOTIFICATION_TEMPLATE',
  OAUTH2_CLIENT = 'OAUTH2_CLIENT',
  OTA_PACKAGE = 'OTA_PACKAGE',
  QUEUE = 'QUEUE',
  QUEUE_STATS = 'QUEUE_STATS',
  RPC = 'RPC',
  RULE_CHAIN = 'RULE_CHAIN',
  RULE_NODE = 'RULE_NODE',
  TB_RESOURCE = 'TB_RESOURCE',
  TENANT = 'TENANT',
  TENANT_PROFILE = 'TENANT_PROFILE',
  USER = 'USER',
  WIDGET_TYPE = 'WIDGET_TYPE',
  WIDGETS_BUNDLE = 'WIDGETS_BUNDLE',
}

/** 实体类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function entityTypeLabelMap() {
  return {
    [EntityType.TENANT]: $t('tb.entityType.TENANT'),
    [EntityType.CUSTOMER]: $t('tb.entityType.CUSTOMER'),
    [EntityType.USER]: $t('tb.entityType.USER'),
    [EntityType.DASHBOARD]: $t('tb.entityType.DASHBOARD'),
    [EntityType.ASSET]: $t('tb.entityType.ASSET'),
    [EntityType.DEVICE]: $t('tb.entityType.DEVICE'),
    [EntityType.ALARM]: $t('tb.entityType.ALARM'),
    [EntityType.RULE_CHAIN]: $t('tb.entityType.RULE_CHAIN'),
    [EntityType.RULE_NODE]: $t('tb.entityType.RULE_NODE'),
    [EntityType.ENTITY_VIEW]: $t('tb.entityType.ENTITY_VIEW'),
    [EntityType.WIDGET_TYPE]: $t('tb.entityType.WIDGET_TYPE'),
    [EntityType.WIDGETS_BUNDLE]: $t('tb.entityType.WIDGETS_BUNDLE'),
    [EntityType.TENANT_PROFILE]: $t('tb.entityType.TENANT_PROFILE'),
    [EntityType.ASSET_PROFILE]: $t('tb.entityType.ASSET_PROFILE'),
    [EntityType.DEVICE_PROFILE]: $t('tb.entityType.DEVICE_PROFILE'),
    [EntityType.API_USAGE_STATE]: $t('tb.entityType.API_USAGE_STATE'),
    [EntityType.TB_RESOURCE]: $t('tb.entityType.TB_RESOURCE'),
    [EntityType.OTA_PACKAGE]: $t('tb.entityType.OTA_PACKAGE'),
    [EntityType.EDGE]: $t('tb.entityType.EDGE'),
    [EntityType.RPC]: $t('tb.entityType.RPC'),
    [EntityType.QUEUE]: $t('tb.entityType.QUEUE'),
    [EntityType.NOTIFICATION_TARGET]: $t('tb.entityType.NOTIFICATION_TARGET'),
    [EntityType.NOTIFICATION_TEMPLATE]: $t(
      'tb.entityType.NOTIFICATION_TEMPLATE',
    ),
    [EntityType.NOTIFICATION_REQUEST]: $t('tb.entityType.NOTIFICATION_REQUEST'),
    [EntityType.NOTIFICATION_RULE]: $t('tb.entityType.NOTIFICATION_RULE'),
    [EntityType.NOTIFICATION]: $t('tb.entityType.NOTIFICATION'),
    [EntityType.QUEUE_STATS]: $t('tb.entityType.QUEUE_STATS'),
    [EntityType.OAUTH2_CLIENT]: $t('tb.entityType.OAUTH2_CLIENT'),
    [EntityType.DOMAIN]: $t('tb.entityType.DOMAIN'),
    [EntityType.MOBILE_APP]: $t('tb.entityType.MOBILE_APP'),
    [EntityType.MOBILE_APP_BUNDLE]: $t('tb.entityType.MOBILE_APP_BUNDLE'),
    [EntityType.CALCULATED_FIELD]: $t('tb.entityType.CALCULATED_FIELD'),
    [EntityType.JOB]: $t('tb.entityType.JOB'),
    [EntityType.ADMIN_SETTINGS]: $t('tb.entityType.ADMIN_SETTINGS'),
    [EntityType.AI_MODEL]: $t('tb.entityType.AI_MODEL'),
    [EntityType.API_KEY]: $t('tb.entityType.API_KEY'),
  };
}

/** 实体类型 → 显示文案(未配置的类型原样返回) */
export function entityTypeLabel(value?: EntityType | string): string {
  if (!value) return '';
  return entityTypeLabelMap()[value as EntityType] ?? value;
}

/** 实体类型下拉选项(label 取多语言文案) */
export function entityTypeOptions(): Array<{
  label: string;
  value: EntityType;
}> {
  const data = entityTypeLabelMap();
  return (Object.keys(data) as EntityType[]).map((value) => ({
    label: data[value],
    value,
  }));
}
