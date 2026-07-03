/**
 * 租户配置接口(SYS_ADMIN)
 * 契约参考:后端 TenantProfileController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityInfo, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 租户配置实体(org.thingsboard.server.common.data.TenantProfile) */
export interface TenantProfile extends BaseData<EntityType.TENANT_PROFILE> {
  default?: boolean;
  description?: string;
  isolatedTbRuleEngine?: boolean;
  name: string;
  // TODO: TenantProfileData 实体映射
  /**  API 限额/速率限制等复杂配置,详见 TenantProfileData */
  profileData?: Record<string, any>;
}

/** 租户配置详情(GET /api/tenantProfile/{tenantProfileId}) */
export function getTenantProfileById(tenantProfileId: string) {
  return requestClient.get<TenantProfile>(`/tenantProfile/${tenantProfileId}`);
}

/** 租户配置摘要(GET /api/tenantProfileInfo/{tenantProfileId}) */
export function getTenantProfileInfoById(tenantProfileId: string) {
  return requestClient.get<EntityInfo>(`/tenantProfileInfo/${tenantProfileId}`);
}

/** 默认租户配置摘要(GET /api/tenantProfileInfo/default) */
export function getDefaultTenantProfileInfo() {
  return requestClient.get<EntityInfo>('/tenantProfileInfo/default');
}

/** 保存租户配置(POST /api/tenantProfile,带 id 为更新) */
export function saveTenantProfile(tenantProfile: TenantProfile) {
  return requestClient.post<TenantProfile>('/tenantProfile', tenantProfile);
}

/** 删除租户配置(DELETE /api/tenantProfile/{tenantProfileId}) */
export function deleteTenantProfile(tenantProfileId: string): Promise<void> {
  return requestClient.delete(`/tenantProfile/${tenantProfileId}`);
}

/** 设为默认租户配置(POST /api/tenantProfile/{tenantProfileId}/default) */
export function setDefaultTenantProfile(tenantProfileId: string) {
  return requestClient.post<TenantProfile>(
    `/tenantProfile/${tenantProfileId}/default`,
  );
}

/** 租户配置分页列表(GET /api/tenantProfiles) */
export function getTenantProfiles(pageLink: PageLink) {
  return requestClient.get<PageData<TenantProfile>>('/tenantProfiles', {
    params: { ...pageLink },
  });
}

/** 租户配置摘要分页(下拉选择用,GET /api/tenantProfileInfos) */
export function getTenantProfileInfos(pageLink: PageLink) {
  return requestClient.get<PageData<EntityInfo>>('/tenantProfileInfos', {
    params: { ...pageLink },
  });
}
/**
 * 按 id 批量获取租户配置(GET /api/tenantProfiles/list?ids=a,b)
 */
export function getTenantProfileList(ids: string[]) {
  return requestClient.get<TenantProfile[]>('/tenantProfiles/list', {
    params: { ids: ids.join(',') },
  });
}
