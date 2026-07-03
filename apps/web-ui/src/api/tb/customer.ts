/**
 * 客户接口
 *  CustomerController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 客户实体(org.thingsboard.server.common.data.Customer,继承 ContactBased) */
export interface Customer extends BaseData<EntityType.CUSTOMER> {
  additionalInfo?: Record<string, any>;
  address?: string;
  address2?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  state?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  title: string;
  zip?: string;
}

/** 客户详情(GET /api/customer/{customerId}) */
export function getCustomerById(customerId: string) {
  return requestClient.get<Customer>(`/customer/${customerId}`);
}

/** 客户分页列表(GET /api/customers) */
export function getCustomers(pageLink: PageLink) {
  return requestClient.get<PageData<Customer>>('/customers', {
    params: { ...pageLink },
  });
}

/** 保存客户(POST /api/customer,带 id 为更新) */
export function saveCustomer(customer: Customer) {
  return requestClient.post<Customer>('/customer', customer);
}

/** 删除客户(DELETE /api/customer/{customerId}) */
export function deleteCustomer(customerId: string): Promise<void> {
  return requestClient.delete(`/customer/${customerId}`);
}
