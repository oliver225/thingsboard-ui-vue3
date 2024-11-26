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

