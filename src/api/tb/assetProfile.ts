import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface AssetProfile extends BasicModel<EntityType.ASSET_PROFILE> {
  name?: string;
  description?: string;
  image?: string;
  default?: boolean;
  defaultQueueName?: string;
  defaultRuleChainId?: EntityId<EntityType.RULE_CHAIN>;
  defaultEdgeRuleChainId?: EntityId<EntityType.RULE_CHAIN>;
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
  tenantId?: EntityId<EntityType.TENANT>;
  externalId?: EntityId<EntityType.ASSET_PROFILE>;
}

export interface AssetProfileInfo {
  id: EntityId<EntityType.ASSET_PROFILE>;
  name?: string;
  image?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
}

export function getAssetProfileById(assetProfileId: string) {
  return defHttp.get<AssetProfile>({
    url: `/api/assetProfile/${assetProfileId}`,
  });
}

export function getAssetProfileInfoById(assetProfileId: string) {
  return defHttp.get<AssetProfileInfo>({
    url: `/api/assetProfileInfo/${assetProfileId}`,
  });
}

export function getDefaultAssetProfileInfo() {
  return defHttp.get<AssetProfileInfo>({
    url: '/api/assetProfileInfo/default',
  });
}
export function setDefaultAssetProfile(assetProfileId: string) {
  return defHttp.post<AssetProfile>({
    url: `/api/assetProfile/${assetProfileId}/default`,
  });
}

export function saveAssetProfile(data: AssetProfile | any) {
  return defHttp.postJson<AssetProfile>({
    url: '/api/assetProfile',
    data,
  });
}

export function deleteAssetProfile(assetProfileId: string) {
  return defHttp.delete<void>({
    url: `/api/assetProfile/${assetProfileId}`,
  });
}

export function assetProfileList(params: BasicQuery) {
  return defHttp.get<Page<AssetProfile>>({
    url: '/api/assetProfiles',
    params,
  });
}

export function assetProfileInfoList(params: BasicQuery) {
  return defHttp.get<Page<AssetProfileInfo>>({
    url: '/api/assetProfileInfos',
    params,
  });
}
