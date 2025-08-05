import { BasicModel, WidgetTypeQueryParam, Page } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface WidgetType extends BasicModel<EntityType.WIDGET_TYPE> {
  name?: string;
  image: string;
  fqn?: string;
  tags: Array<string>;
  widgetType: string;
  description: string;
  deprecated?: boolean;
  tenantId?: EntityId<EntityType.TENANT>;
  descriptor?: Recordable;
  externalId?: EntityId<EntityType.WIDGET_TYPE>;
}

export function getWidgetTypeById(widgetTypeId: string, inlineImages?: boolean) {
  return defHttp.get<WidgetType>({
    url: `/api/widgetType/${widgetTypeId}`,
    params: { inlineImages: inlineImages },
  });
}

export function getWidgetTypeInfoById(widgetTypeId: string) {
  return defHttp.get<WidgetType>({
    url: `/api/widgetTypeInfo/${widgetTypeId}`,
  });
}

export function saveWidgetType(data: WidgetType | any, updateExistingByFqn?: boolean) {
  return defHttp.postJson<WidgetType>({
    url: '/api/widgetType/',
    data,
    params: { updateExistingByFqn: updateExistingByFqn },
  });
}

export function deleteWidgetType(widgetTypeId: string) {
  return defHttp.delete<void>({
    url: `/api/widgetType/${widgetTypeId}`,
  });
}

export function getWidgetTypeList(params: WidgetTypeQueryParam) {
  return defHttp.get<Page<WidgetType>>({
    url: '/api/widgetTypes',
    params,
  });
}

export function getBundleWidgetTypeListByBundleAlias(params: { isSystem: boolean; bundleAlias: string }) {
  return defHttp.get<Array<WidgetType>>({
    url: '/api/widgetTypes',
    params,
  });
}

export function getBundleWidgetTypesDetailListByBundleAlias(params: { isSystem: boolean; bundleAlias: string }) {
  return defHttp.get<Array<WidgetType>>({
    url: '/api/widgetTypesDetails',
    params,
  });
}

export function getBundleWidgetTypes(widgetsBundleId: string) {
  return defHttp.get<Array<WidgetType>>({
    url: '/api/widgetTypes',
    params: { widgetsBundleId: widgetsBundleId },
  });
}

export function getBundleWidgetTypesDetails(widgetsBundleId: string, inlineImages?: boolean) {
  return defHttp.get<Array<WidgetType>>({
    url: '/api/widgetTypesDetails',
    params: { widgetsBundleId: widgetsBundleId, inlineImages: inlineImages },
  });
}
export function getBundleWidgetTypeFqns(widgetsBundleId: string) {
  return defHttp.get<Array<string>>({
    url: '/api/widgetTypeFqns',
    params: { widgetsBundleId: widgetsBundleId },
  });
}

export function getBundleWidgetTypesInfosByBundleAlias(params: { isSystem: boolean; bundleAlias: string }) {
  return defHttp.get<Array<WidgetType>>({
    url: '/api/widgetTypesInfos',
    params,
  });
}

export function getBundleWidgetTypesInfos(params: WidgetTypeQueryParam) {
  return defHttp.get<Page<WidgetType>>({
    url: '/api/widgetTypesInfos',
    params,
  });
}

export function getWidgetTypeByBundleAliasAndTypeAlias(params: {
  isSystem: boolean;
  bundleAlias: string;
  alias: string;
}) {
  return defHttp.get<WidgetType>({
    url: '/api/widgetType',
    params,
  });
}

export function getWidgetType(fqn: string) {
  return defHttp.get<WidgetType>({
    url: '/api/widgetType',
    params: { fqn: fqn },
  });
}
