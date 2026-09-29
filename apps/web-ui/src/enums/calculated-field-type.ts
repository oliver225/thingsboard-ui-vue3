/**
 * 计算字段类型(对应后端 org.thingsboard.server.common.data.cf.CalculatedFieldType)
 */
import { $t } from '@vben/locales';

export enum CalculatedFieldType {
  ALARM = 'ALARM',
  ENTITY_AGGREGATION = 'ENTITY_AGGREGATION',
  GEOFENCING = 'GEOFENCING',
  PROPAGATION = 'PROPAGATION',
  RELATED_ENTITIES_AGGREGATION = 'RELATED_ENTITIES_AGGREGATION',
  SCRIPT = 'SCRIPT',
  SIMPLE = 'SIMPLE',
}

/** 计算字段类型 → 显示文案(每次调用重新取 $t,以跟随语言切换) */
export function calculatedFieldTypeLabel(
  value?: CalculatedFieldType | string,
): string {
  if (!value) return '';
  const map: Record<CalculatedFieldType, string> = {
    [CalculatedFieldType.ALARM]: $t('calculated-fields.options.type.ALARM'),
    [CalculatedFieldType.ENTITY_AGGREGATION]: $t(
      'calculated-fields.options.type.ENTITY_AGGREGATION',
    ),
    [CalculatedFieldType.GEOFENCING]: $t(
      'calculated-fields.options.type.GEOFENCING',
    ),
    [CalculatedFieldType.PROPAGATION]: $t(
      'calculated-fields.options.type.PROPAGATION',
    ),
    [CalculatedFieldType.RELATED_ENTITIES_AGGREGATION]: $t(
      'calculated-fields.options.type.RELATED_ENTITIES_AGGREGATION',
    ),
    [CalculatedFieldType.SCRIPT]: $t('calculated-fields.options.type.SCRIPT'),
    [CalculatedFieldType.SIMPLE]: $t('calculated-fields.options.type.SIMPLE'),
  };
  return map[value as CalculatedFieldType] ?? value;
}
