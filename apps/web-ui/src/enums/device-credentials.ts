/**
 * 设备凭证类型(对应后端 org.thingsboard.server.common.data.security.DeviceCredentialsType)
 */
import { $t } from '@vben/locales';

export enum DeviceCredentialsType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  LWM2M_CREDENTIALS = 'LWM2M_CREDENTIALS',
  MQTT_BASIC = 'MQTT_BASIC',
  X509_CERTIFICATE = 'X509_CERTIFICATE',
}

/** 凭证类型 → 显示文案 */
export function deviceCredentialsTypeLabel(
  value?: DeviceCredentialsType | string,
): string {
  if (!value) return '';
  return $t(`tb.device.credentials.type.${value}`);
}

/** 凭证类型下拉选项(LwM2M 需专门配置,这里仅常用三种) */
export function deviceCredentialsTypeOptions(): Array<{
  label: string;
  value: DeviceCredentialsType;
}> {
  return [
    DeviceCredentialsType.ACCESS_TOKEN,
    DeviceCredentialsType.X509_CERTIFICATE,
    DeviceCredentialsType.MQTT_BASIC,
  ].map((value) => ({
    label: deviceCredentialsTypeLabel(value),
    value,
  }));
}
