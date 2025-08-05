import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { DashboardInfo } from './dashboard';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface Customer extends BasicModel<EntityType.CUSTOMER> {
  title?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  externalId?: EntityId<EntityType.CUSTOMER>;

  country?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
  zip?: string;
  phone?: string;
  email?: string;
  additionalInfo?: {
    isPublic?: boolean;
    description?: string;
    homeDashboardId?: DashboardInfo;
    homeDashboardHideToolbar: boolean;
  };
}

export interface CustomerShortInfo {
  title?: string;
  isPublic?: boolean;
}

export function saveCustomer(data?: Customer | any) {
  return defHttp.postJson<Customer>({
    url: '/api/customer',
    data,
  });
}

export function getCustomerById(customerId: string) {
  return defHttp.get<Customer>({
    url: `/api/customer/${customerId}`,
  });
}
export function getCustomerTitleById(customerId: string) {
  return defHttp.get<string>({
    url: `/api/customer/${customerId}/title`,
  });
}

export function getCustomerShortInfoById(customerId: string) {
  return defHttp.get<CustomerShortInfo>({
    url: `/api/customer/${customerId}/shortInfo`,
  });
}

export function getTenantCustomer(customerTitle: string) {
  return defHttp.get<Customer>({
    url: `/api/tenant/customers`,
    params: { customerTitle: customerTitle },
  });
}

export function customerList(params: BasicQuery) {
  return defHttp.get<Page<Customer>>({
    url: `/api/customers`,
    params,
  });
}

export function deleteCustomer(customerId: string) {
  return defHttp.delete<void>({
    url: `/api/customer/${customerId}`,
  });
}
