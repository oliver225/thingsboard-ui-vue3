import { BasicModel, BasicQuery, Page } from "../model/baseModel";
import { EntityId } from "/#/store";
import { EntityType } from "/@/enums/entityTypeEnum";
import { defHttp } from "/@/utils/http/axios";

export interface TbVisual extends BasicModel<EntityType.TB_VISUAL> {
  tenantId?: EntityId<EntityType.TENANT>;
  title?: string;
  name?: string;
  image?: string;
  published?: boolean;
  assignedCustomers?: [{ customerId?: EntityId<EntityType.CUSTOMER>, title?: string, public?: boolean }];
  additionalInfo?: Recordable;
}

export interface TbVisualInfo extends TbVisual {
  credentials?: string;
  content?: string;
}


export function getTbVisualInfoById(tbVisualId: string) {
  return defHttp.get<TbVisualInfo>({
    url: `/api/visual/info/${tbVisualId}`,
  });
}

export function getTbVisualById(tbVisualId: string) {
  return defHttp.get<TbVisual>({
    url: `/api/visual/${tbVisualId}`,
  });
}

export function createTbVisual(data: TbVisual | any) {
  return defHttp.postJson<TbVisual>({
    url: `/api/visual/create`,
    data,
  });
}

export function saveTbVisual(data: TbVisualInfo | any) {
  return defHttp.postJson<TbVisualInfo>({
    url: `/api/visual/info`,
    data,
  });
}

export function deleteTbVisual(tbVisualId: string) {
  return defHttp.delete<TbVisualInfo>({
    url: `/api/visual/${tbVisualId}`,
  });
}

export function currentTenantVisualList(params: BasicQuery) {
  return defHttp.get<Page<TbVisual>>({
    url: '/api/tenant/visuals',
    params
  });
}

export function tenantVisualList(params: BasicQuery, tenantId: string) {
  return defHttp.get<Page<TbVisual>>({
    url: `/api/tenant/${tenantId}/visuals`,
    params
  });
}
export function customerVisualList(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<TbVisual>>({
    url: `/api/customer/${customerId}/visuals`,
    params
  });
}

export function assignTbVisualToCustomer(customerId: string, tbVisualId: string) {
  return defHttp.post<TbVisual>({
    url: `/api/customer/${customerId}/visual/${tbVisualId}`,
  });
}


export function unAssignTbVisualFromCustomer(customerId: string,tbVisualId: string) {
  return defHttp.delete<void>({
    url: `/api/customer/${customerId}/visual/${tbVisualId}`,
  });
}

export function updateTbVisualCustomers(tbVisualId: string, strCustomerIds?: [string],) {
  return defHttp.postJson<TbVisual>({
    url: `/api/visual/${tbVisualId}/customers`,
    data: strCustomerIds,
  });
}

export function addTbVisualCustomers(tbVisualId: string, strCustomerIds?: [string],) {
  return defHttp.postJson<TbVisual>({
    url: `/api/visual/${tbVisualId}/customers/add`,
    data: strCustomerIds,
  });
}

export function removeTbVisualCustomers(tbVisualId: string, strCustomerIds?: [string],) {
  return defHttp.postJson<TbVisual>({
    url: `/api/visual/${tbVisualId}/customers/remove`,
    data: strCustomerIds,
  });
}

export function assignTbVisualToPublicCustomer(tbVisualId: string) {
  return defHttp.post<TbVisual>({
    url: `/api/customer/public/visual/${tbVisualId}`,
  });
}

export function unAssignTbVisualFromPublicCustomer(tbVisualId: string) {
  return defHttp.delete<TbVisual>({
    url: `/api/customer/public/visual/${tbVisualId}`,
  });
}
