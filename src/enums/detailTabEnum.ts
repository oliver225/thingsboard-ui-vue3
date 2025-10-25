import { useI18n } from '/@/hooks/web/useI18n';

export interface DetailTabItem {
  key: string;
  label: string;
  icon: string;
}

// 使用函数而不是常量，避免在 i18n 尚未初始化时访问 t
export function getDetailTabItemEnum() {
  const { t } = useI18n('tb');
  const enumObj = {
    DETAIL: {
      key: 'DETAIL',
      label: t('tb.detailTab.detail'),
      icon: 'ant-design:appstore-outlined',
    },
    TELEMETRY: {
      key: 'TELEMETRY',
      label: t('tb.detailTab.telemetry'),
      icon: 'ant-design:line-chart-outlined',
    },
    TOPIC: {
      key: 'TOPIC',
      label: t('tb.detailTab.topic'),
      icon: 'ant-design:api-outlined',
    },
    CALCULATED: {
      key: 'CALCULATED',
      label: t('tb.detailTab.calculated'),
      icon: 'ant-design:calculator-outlined',
    },
    ALARM: {
      key: 'ALARM',
      label: t('tb.detailTab.alarm'),
      icon: 'ant-design:alert-outlined',
    },
    EVENT: {
      key: 'EVENT',
      label: t('tb.detailTab.event'),
      icon: 'ant-design:info-circle-outlined',
    },
    RELATION: {
      key: 'RELATION',
      label: t('tb.detailTab.relation'),
      icon: 'ant-design:radar-chart-outlined',
    },
    AUDIT_LOG: {
      key: 'AUDIT_LOG',
      label: t('tb.detailTab.auditLog'),
      icon: 'ant-design:bars-outlined',
    },
  } as const satisfies Record<string, DetailTabItem>;
  return enumObj;
}

// 兼容旧引用（如果外部代码仍引用 DetailTabItemEnum）
export const DetailTabItemEnum = getDetailTabItemEnum();
