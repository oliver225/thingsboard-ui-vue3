/**
 * 资产接口
 * 契约参考:后端 AssetController.java / AssetProfileController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 资产实体(org.thingsboard.server.common.data.asset.Asset) */
export interface Asset extends BaseData<EntityType.ASSET> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
  };
  assetProfileId?: EntityId<EntityType.ASSET_PROFILE>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  label?: string;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
  /** @deprecated 由 assetProfile 取代,后端仍返回 */
  type?: string;
}

/** 资产信息(AssetInfo extends Asset,列表展示用) */
export interface AssetInfo extends Asset {
  assetProfileName?: string;
  customerIsPublic?: boolean;
  customerTitle?: string;
}

/** 资产配置摘要(AssetProfileInfo,下拉选择用) */
export interface AssetProfileInfo {
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
  id: EntityId<EntityType.ASSET_PROFILE>;
  image?: string;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 租户资产分页列表(GET /api/tenant/assetInfos) */
export function getTenantAssetInfos(
  pageLink: PageLink,
  params?: { assetProfileId?: string; type?: string },
) {
  return requestClient.get<PageData<AssetInfo>>('/tenant/assetInfos', {
    params: { ...pageLink, ...params },
  });
}

/** 客户资产分页列表(GET /api/customer/{customerId}/assetInfos) */
export function getCustomerAssetInfos(customerId: string, pageLink: PageLink) {
  return requestClient.get<PageData<AssetInfo>>(
    `/customer/${customerId}/assetInfos`,
    {
      params: { ...pageLink },
    },
  );
}

/** 资产详情(GET /api/asset/{assetId}) */
export function getAssetById(assetId: string) {
  return requestClient.get<Asset>(`/asset/${assetId}`);
}

/** 资产信息详情(GET /api/asset/info/{assetId}) */
export function getAssetInfoById(assetId: string) {
  return requestClient.get<AssetInfo>(`/asset/info/${assetId}`);
}

/** 保存资产(POST /api/asset,带 id 为更新) */
export function saveAsset(asset: Asset) {
  return requestClient.post<Asset>('/asset', asset);
}

/** 删除资产(DELETE /api/asset/{assetId}) */
export function deleteAsset(assetId: string): Promise<void> {
  return requestClient.delete(`/asset/${assetId}`);
}

/** 分配资产给客户(POST /api/customer/{customerId}/asset/{assetId}) */
export function assignAssetToCustomer(customerId: string, assetId: string) {
  return requestClient.post<Asset>(`/customer/${customerId}/asset/${assetId}`);
}

/** 取消分配(DELETE /api/customer/asset/{assetId}) */
export function unassignAssetFromCustomer(assetId: string) {
  return requestClient.delete<Asset>(`/customer/asset/${assetId}`);
}

/** 资产配置下拉分页(GET /api/assetProfileInfos) */
export function getAssetProfileInfos(pageLink: PageLink) {
  return requestClient.get<PageData<AssetProfileInfo>>('/assetProfileInfos', {
    params: { ...pageLink },
  });
}
