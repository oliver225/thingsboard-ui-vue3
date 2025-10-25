import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

/**
 * 计算字段参数实体类型
 */
export enum ArgumentEntityType {
  CURRENT_ENTITY = 'CURRENT_ENTITY',
  DEVICE = 'DEVICE',
  ASSET = 'ASSET',
  CUSTOMER = 'CUSTOMER',
  CURRENT_TENANT = 'CURRENT_TENANT',
}

/**
 * 计算字段参数类型
 */
export enum ArgumentType {
  TS_LATEST = 'TS_LATEST',
  ATTRIBUTE = 'ATTRIBUTE',
}

/**
 * 实体类型显示映射（国际化 key）
 */
export const ARGUMENT_ENTITY_TYPE_MAP: Record<ArgumentEntityType, string> = {
  [ArgumentEntityType.CURRENT_ENTITY]: t('tb.calculatedField.enums.entityType.currentEntity'),
  [ArgumentEntityType.DEVICE]: t('tb.calculatedField.enums.entityType.device'),
  [ArgumentEntityType.ASSET]: t('tb.calculatedField.enums.entityType.asset'),
  [ArgumentEntityType.CUSTOMER]: t('tb.calculatedField.enums.entityType.customer'),
  [ArgumentEntityType.CURRENT_TENANT]: t('tb.calculatedField.enums.entityType.currentTenant'),
};

/**
 * 参数类型显示映射（国际化 key）
 */
export const ARGUMENT_TYPE_MAP: Record<ArgumentType, string> = {
  [ArgumentType.TS_LATEST]: t('tb.calculatedField.enums.argumentType.latestTelemetry'),
  [ArgumentType.ATTRIBUTE]: t('tb.calculatedField.enums.argumentType.attribute'),
};

/**
 * 实体类型选项（用于 Select）
 */
export const ARGUMENT_ENTITY_TYPE_OPTIONS = [
  { value: ArgumentEntityType.CURRENT_ENTITY, label: t('tb.calculatedField.enums.entityType.currentEntity') },
  { value: ArgumentEntityType.DEVICE, label: t('tb.calculatedField.enums.entityType.device') },
  { value: ArgumentEntityType.ASSET, label: t('tb.calculatedField.enums.entityType.asset') },
  { value: ArgumentEntityType.CUSTOMER, label: t('tb.calculatedField.enums.entityType.customer') },
  { value: ArgumentEntityType.CURRENT_TENANT, label: t('tb.calculatedField.enums.entityType.currentTenant') },
];

/**
 * 参数类型选项（用于 Select）
 */
export const ARGUMENT_TYPE_OPTIONS = [
  { value: ArgumentType.TS_LATEST, label: t('tb.calculatedField.enums.argumentType.latestTelemetry') },
  { value: ArgumentType.ATTRIBUTE, label: t('tb.calculatedField.enums.argumentType.attribute') },
];
