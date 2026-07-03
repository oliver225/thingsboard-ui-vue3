/**
 * 批量导入列类型(对应后端 BulkImportColumnType / 设备导入)
 */
import { $t } from '@vben/locales';

export enum BulkImportColumnType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  DESCRIPTION = 'DESCRIPTION',
  IS_GATEWAY = 'IS_GATEWAY',
  LABEL = 'LABEL',
  MQTT_CLIENT_ID = 'MQTT_CLIENT_ID',
  MQTT_PASSWORD = 'MQTT_PASSWORD',
  MQTT_USER_NAME = 'MQTT_USER_NAME',
  NAME = 'NAME',
  SERVER_ATTRIBUTE = 'SERVER_ATTRIBUTE',
  SHARED_ATTRIBUTE = 'SHARED_ATTRIBUTE',
  TIME_SERIES = 'TIME_SERIES',
  TYPE = 'TYPE',
}

/** 需要填写「属性/遥测键」的列类型 */
export function bulkImportColumnRequiresKey(
  type: BulkImportColumnType | string,
): boolean {
  return [
    BulkImportColumnType.SERVER_ATTRIBUTE,
    BulkImportColumnType.SHARED_ATTRIBUTE,
    BulkImportColumnType.TIME_SERIES,
  ].includes(type as BulkImportColumnType);
}

/** 列类型下拉选项(label 走 i18n,跟随语言) */
export function bulkImportColumnTypeOptions(): Array<{
  label: string;
  value: BulkImportColumnType;
}> {
  return [
    BulkImportColumnType.NAME,
    BulkImportColumnType.TYPE,
    BulkImportColumnType.LABEL,
    BulkImportColumnType.DESCRIPTION,
    BulkImportColumnType.SHARED_ATTRIBUTE,
    BulkImportColumnType.SERVER_ATTRIBUTE,
    BulkImportColumnType.TIME_SERIES,
    BulkImportColumnType.ACCESS_TOKEN,
    BulkImportColumnType.MQTT_CLIENT_ID,
    BulkImportColumnType.MQTT_USER_NAME,
    BulkImportColumnType.MQTT_PASSWORD,
    BulkImportColumnType.IS_GATEWAY,
  ].map((value) => ({
    label: $t(`tb.device.import.columnType.${value}`),
    value,
  }));
}
