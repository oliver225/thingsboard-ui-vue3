import { BasicModel, BasicQuery, EntitySubtype, Page, RelationsSearchParameters } from '../model/baseModel';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface Asset extends BasicModel<EntityType.ASSET> {
  name?: string;
  type?: string;
  label?: string;
  assetProfileId?: EntityId<EntityType.ASSET_PROFILE>;
  externalId?: EntityId<EntityType.ASSET>;

  tenantId?: EntityId<EntityType.TENANT>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  additionalInfo?: { description: string };
}

export interface AssetInfo extends Asset {
  customerTitle?: string;
  customerIsPublic?: boolean;
  assetProfileName?: string;
}

export interface AssetSearchQuery {
  parameters?: RelationsSearchParameters;
  relationType?: string;
  assetTypes?: Array<string>;
}

export function getAssetById(assetId: string) {
  return defHttp.get<Asset>({
    url: `/api/asset/${assetId}`,
  });
}

export function getAssetInfoById(assetId: string) {
  return defHttp.get<AssetInfo>({
    url: `/api/asset/info/${assetId}`,
  });
}

export function getTenantAssetByName(assetName: string) {
  return defHttp.get<Asset>({
    url: '/api/tenant/assets',
    params: { assetName: assetName },
  });
}

export function saveAsset(data: Asset | any) {
  return defHttp.postJson<Asset>({
    url: '/api/asset',
    data,
  });
}

export function deleteAsset(assetId: string) {
  return defHttp.delete<void>({
    url: `/api/asset/${assetId}`,
  });
}

export function assignAssetToCustomer(customerId: string, assetId: string) {
  return defHttp.post<Asset>({
    url: `/api/customer/${customerId}/asset/${assetId}`,
  });
}

export function assignAssetToPublicCustomer(assetId: string) {
  return defHttp.post<Asset>({
    url: `/api/customer/public/asset/${assetId}`,
  });
}

export function unAssignAssetFromCustomer(assetId: string) {
  return defHttp.delete<void>({
    url: `/api/customer/asset/${assetId}`,
  });
}

export function getTenantAssetList(params: BasicQuery) {
  return defHttp.get<Page<Asset>>({
    url: '/api/tenant/assets',
    params,
  });
}

export function getEdgeAssetList(params: BasicQuery, edgeId: string) {
  return defHttp.get<Page<Asset>>({
    url: `/api/edge/${edgeId}/assets`,
    params,
  });
}

export function getCustomerAssetList(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<Asset>>({
    url: `/api/customer/${customerId}/assets`,
    params,
  });
}

export function getTenantAssetInfoList(params: BasicQuery) {
  return defHttp.get<Page<AssetInfo>>({
    url: '/api/tenant/assetInfos',
    params,
  });
}

export function getCustomerAssetInfoList(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<AssetInfo>>({
    url: `/api/customer/${customerId}/assetInfos`,
    params,
  });
}

export function getAssetsByIds(assetIds: string[]) {
  return defHttp.get<Array<Asset>>({
    url: '/api/assets',
    params: { assetIds: assetIds },
  });
}

export function getAssetListByQuery(data: AssetSearchQuery | any) {
  return defHttp.postJson<Array<Asset>>({
    url: '/api/assets',
    data,
  });
}

export function getAssetTypes() {
  return defHttp.get<Array<EntitySubtype>>({
    url: '/api/asset/types',
  });
}

export function assignAssetToEdge(edgeId: string, assetId: string) {
  return defHttp.post<Asset>({
    url: `/api/edge/${edgeId}/asset/${assetId}`,
  });
}

export function unAssignAssetFromEdge(edgeId: string, assetId: string) {
  return defHttp.delete<void>({
    url: `/api/edge/${edgeId}/asset/${assetId}`,
  });
}

//TODO 没有写
export function processAssetsBulkImport() {}
