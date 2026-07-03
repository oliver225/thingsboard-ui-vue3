/**
 * OTA 包类型(对应后端 org.thingsboard.server.common.data.ota.OtaPackageType)
 */
import { $t } from '@vben/locales';

export enum OtaPackageType {
  FIRMWARE = 'FIRMWARE',
  SOFTWARE = 'SOFTWARE',
}

/** OTA 包类型 → 显示文案 */
export function otaPackageTypeLabel(value?: OtaPackageType | string): string {
  if (!value) return '';
  const map: Record<OtaPackageType, string> = {
    [OtaPackageType.FIRMWARE]: $t('tb.otaPackage.type.FIRMWARE'),
    [OtaPackageType.SOFTWARE]: $t('tb.otaPackage.type.SOFTWARE'),
  };
  return map[value as OtaPackageType] ?? value;
}

/** OTA 包类型下拉选项 */
export function otaPackageTypeOptions(): Array<{
  label: string;
  value: OtaPackageType;
}> {
  return [OtaPackageType.FIRMWARE, OtaPackageType.SOFTWARE].map((value) => ({
    label: otaPackageTypeLabel(value),
    value,
  }));
}
