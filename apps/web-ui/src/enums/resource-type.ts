/**
 * 资源类型 / 子类型(对应后端 org.thingsboard.server.common.data.ResourceType / ResourceSubType)
 */
import { $t } from '@vben/locales';

/** 资源作用域:tenant=租户级,system=系统级 */
export type ResourceScope = 'system' | 'tenant';

export enum ResourceType {
  DASHBOARD = 'DASHBOARD',
  GENERAL = 'GENERAL',
  IMAGE = 'IMAGE',
  JKS = 'JKS',
  JS_MODULE = 'JS_MODULE',
  LWM2M_MODEL = 'LWM2M_MODEL',
  PKCS_12 = 'PKCS_12',
}

export enum ResourceSubType {
  EXTENSION = 'EXTENSION',
  IMAGE = 'IMAGE',
  MODULE = 'MODULE',
  SCADA_SYMBOL = 'SCADA_SYMBOL',
}

/**
 * 资源类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换)。
 * 仅含资源库可上传 / 筛选的类型;JS_MODULE 归 JavaScript 库、IMAGE 归图片/SCADA 符号库,故不在此列。
 */
export function resourceTypeLabelMap(): Partial<Record<ResourceType, string>> {
  return {
    [ResourceType.LWM2M_MODEL]: $t('tb.resourceLibrary.types.lwm2mModel'),
    [ResourceType.PKCS_12]: $t('tb.resourceLibrary.types.pkcs12'),
    [ResourceType.JKS]: $t('tb.resourceLibrary.types.jks'),
    [ResourceType.GENERAL]: $t('tb.resourceLibrary.types.general'),
  };
}

/** 资源类型 → 显示文案(未配置的类型原样返回) */
export function resourceTypeLabel(value?: ResourceType | string): string {
  if (!value) return '';
  return resourceTypeLabelMap()[value as ResourceType] ?? value;
}

/** 资源库下拉 / 筛选选项(label 取多语言文案) */
export function resourceTypeOptions(): Array<{
  label: string;
  value: ResourceType;
}> {
  const data = resourceTypeLabelMap();
  return (Object.keys(data) as ResourceType[]).map((value) => ({
    label: data[value] ?? value,
    value,
  }));
}

/**
 * 资源子类型 → 显示文案映射(每次调用重新取 $t,以跟随语言切换)。
 * 仅含 JavaScript 库支持的子类型(拓展 / 模块)。
 */
export function resourceSubTypeLabelMap(): Partial<
  Record<ResourceSubType, string>
> {
  return {
    [ResourceSubType.EXTENSION]: $t('tb.javascriptLibrary.subTypes.extension'),
    [ResourceSubType.MODULE]: $t('tb.javascriptLibrary.subTypes.module'),
  };
}

/** 资源子类型 → 显示文案(未配置的子类型原样返回) */
export function resourceSubTypeLabel(value?: ResourceSubType | string): string {
  if (!value) return '';
  return resourceSubTypeLabelMap()[value as ResourceSubType] ?? value;
}

/** JavaScript 库下拉 / 筛选选项(label 取多语言文案) */
export function resourceSubTypeOptions(): Array<{
  label: string;
  value: ResourceSubType;
}> {
  const data = resourceSubTypeLabelMap();
  return (Object.keys(data) as ResourceSubType[]).map((value) => ({
    label: data[value] ?? value,
    value,
  }));
}
