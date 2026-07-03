/**
 * 部件类别(对应 widget descriptor 的 type 字段)
 * 对齐 ui-ngx widget.models.ts 的 widgetType 枚举与 widgetTypesData
 */
import { $t } from '@vben/locales';

export enum WidgetCategory {
  ALARM = 'alarm',
  LATEST = 'latest',
  RPC = 'rpc',
  STATIC = 'static',
  TIMESERIES = 'timeseries',
}

/** 部件类别 → 显示文案映射(每次调用重新取 $t,以跟随语言切换) */
export function widgetCategoryLabelMap() {
  return {
    [WidgetCategory.ALARM]: $t('tb.widgetType.types.alarm'),
    [WidgetCategory.LATEST]: $t('tb.widgetType.types.latest'),
    [WidgetCategory.RPC]: $t('tb.widgetType.types.rpc'),
    [WidgetCategory.STATIC]: $t('tb.widgetType.types.static'),
    [WidgetCategory.TIMESERIES]: $t('tb.widgetType.types.timeseries'),
  };
}

/** 部件类别 → 显示文案(未配置的类别原样返回) */
export function widgetCategoryLabel(value?: string | WidgetCategory): string {
  if (!value) return '';
  return widgetCategoryLabelMap()[value as WidgetCategory] ?? value;
}

/** 部件类别下拉 / 筛选选项(label 取多语言文案) */
export function widgetCategoryOptions(): Array<{
  label: string;
  value: WidgetCategory;
}> {
  const data = widgetCategoryLabelMap();
  return (Object.keys(data) as WidgetCategory[]).map((value) => ({
    label: data[value],
    value,
  }));
}
