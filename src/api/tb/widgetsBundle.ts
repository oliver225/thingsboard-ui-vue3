import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface WidgetsBundle extends BasicModel<EntityType.WIDGETS_BUNDLE> {
  name?: string;
  alias?: string;
  title?: string;
  image?: string;
  description?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  externalId?: EntityId<EntityType.WIDGETS_BUNDLE>;
}

export function saveWidgetsBundle(data?: WidgetsBundle | any) {
  return defHttp.postJson<WidgetsBundle>({
    url: '/api/widgetsBundle',
    data,
  });
}

export function getWidgetsBundleById(widgetsBundleId: string) {
  return defHttp.get<WidgetsBundle>({
    url: `/api/widgetsBundle/${widgetsBundleId}`,
  });
}

export function deleteWidgetsBundle(widgetsBundleId: string) {
  return defHttp.delete<void>({
    url: `/api/widgetsBundle/${widgetsBundleId}`,
  });
}

export function widgetsBundles() {
  return defHttp.get<[WidgetsBundle]>({
    url: `/api/widgetsBundles`,
  });
}

export function widgetsBundleList(params: BasicQuery) {
  return defHttp.get<Page<WidgetsBundle>>({
    url: `/api/widgetsBundles`,
    params,
  });
}
