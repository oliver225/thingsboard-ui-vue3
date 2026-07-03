/**
 * 资产配置接口(TENANT_ADMIN)
 * 契约参考:后端 AssetProfileController.java
 * 注:资产配置下拉摘要(AssetProfileInfo/getAssetProfileInfos)在 api/tb/asset.ts。
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 资产配置实体(org.thingsboard.server.common.data.asset.AssetProfile) */
export interface AssetProfile extends BaseData<EntityType.ASSET_PROFILE> {
  default?: boolean;
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
  defaultQueueName?: string;
  defaultRuleChainId?: EntityId<EntityType.RULE_CHAIN>;
  description?: string;
  image?: string;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 资产配置分页列表(GET /api/assetProfiles) */
export function getAssetProfiles(pageLink: PageLink) {
  return requestClient.get<PageData<AssetProfile>>('/assetProfiles', {
    params: { ...pageLink },
  });
}

/** 资产配置详情(GET /api/assetProfile/{assetProfileId}) */
export function getAssetProfileById(assetProfileId: string) {
  return requestClient.get<AssetProfile>(`/assetProfile/${assetProfileId}`);
}

/** 保存资产配置(POST /api/assetProfile,带 id 为更新) */
export function saveAssetProfile(assetProfile: AssetProfile) {
  return requestClient.post<AssetProfile>('/assetProfile', assetProfile);
}

/** 删除资产配置(DELETE /api/assetProfile/{assetProfileId}) */
export function deleteAssetProfile(assetProfileId: string): Promise<void> {
  return requestClient.delete(`/assetProfile/${assetProfileId}`);
}

/** 设为默认资产配置(POST /api/assetProfile/{assetProfileId}/default) */
export function setDefaultAssetProfile(assetProfileId: string) {
  return requestClient.post<AssetProfile>(
    `/assetProfile/${assetProfileId}/default`,
  );
}
