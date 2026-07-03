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
    [CalculatedFieldType.ALARM]: $t('tb.calculatedField.type.ALARM'),
    [CalculatedFieldType.ENTITY_AGGREGATION]: $t(
      'tb.calculatedField.type.ENTITY_AGGREGATION',
    ),
    [CalculatedFieldType.GEOFENCING]: $t('tb.calculatedField.type.GEOFENCING'),
    [CalculatedFieldType.PROPAGATION]: $t(
      'tb.calculatedField.type.PROPAGATION',
    ),
    [CalculatedFieldType.RELATED_ENTITIES_AGGREGATION]: $t(
      'tb.calculatedField.type.RELATED_ENTITIES_AGGREGATION',
    ),
    [CalculatedFieldType.SCRIPT]: $t('tb.calculatedField.type.SCRIPT'),
    [CalculatedFieldType.SIMPLE]: $t('tb.calculatedField.type.SIMPLE'),
  };
  return map[value as CalculatedFieldType] ?? value;
}
