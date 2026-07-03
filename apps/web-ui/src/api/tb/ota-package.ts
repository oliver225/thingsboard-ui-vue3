/**
 * OTA 升级包接口(TENANT_ADMIN)
 * 契约参考:后端 OtaPackageController.java
 */
import type { EntityType, OtaPackageType } from '#/enums';
import type { EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/**
 * OTA 升级包信息(org.thingsboard.server.common.data.OtaPackageInfo)
 * 注:`version` 是 OTA 包的版本号字符串(非乐观锁 version),故不复用 BaseData。
 */
export interface OtaPackageInfo {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
  };
  checksum?: string;
  checksumAlgorithm?: string;
  contentType?: string;
  createdTime?: number;
  dataSize?: number;
  deviceProfileId?: EntityId<EntityType.DEVICE_PROFILE>;
  fileName?: string;
  /** 是否已有数据(上传文件或填了 url 即为 true) */
  hasData?: boolean;
  id?: EntityId<EntityType.OTA_PACKAGE>;
  tag?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  title: string;
  type: OtaPackageType;
  url?: string;
  /** 保存时标记:使用外部 url(true)还是上传二进制数据(false) */
  usesUrl?: boolean;
  version: string;
}

/** OTA 升级包分页列表(GET /api/otaPackages) */
export function getOtaPackages(pageLink: PageLink) {
  return requestClient.get<PageData<OtaPackageInfo>>('/otaPackages', {
    params: { ...pageLink },
  });
}

/** OTA 升级包信息详情(GET /api/otaPackage/info/{otaPackageId}) */
export function getOtaPackageInfoById(otaPackageId: string) {
  return requestClient.get<OtaPackageInfo>(`/otaPackage/info/${otaPackageId}`);
}

/** 保存 OTA 升级包信息(POST /api/otaPackage,SaveOtaPackageInfoRequest) */
export function saveOtaPackageInfo(otaPackage: OtaPackageInfo) {
  return requestClient.post<OtaPackageInfo>('/otaPackage', otaPackage);
}

/**
 * 上传 OTA 升级包二进制数据(POST /api/otaPackage/{otaPackageId},multipart)
 * checksumAlgorithm 必填(后端据此校验/计算);checksum 留空则由后端计算。
 */
export function uploadOtaPackageData(
  otaPackageId: string,
  file: Blob | File,
  checksumAlgorithm = 'SHA256',
) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<OtaPackageInfo>(
    `/otaPackage/${otaPackageId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { checksumAlgorithm },
    },
  );
}

/** 下载 OTA 升级包文件为 Blob(GET /api/otaPackage/{otaPackageId}/download) */
export function downloadOtaPackage(otaPackageId: string) {
  return requestClient.download<Blob>(`/otaPackage/${otaPackageId}/download`);
}

/** 删除 OTA 升级包(DELETE /api/otaPackage/{otaPackageId}) */
export function deleteOtaPackage(otaPackageId: string): Promise<void> {
  return requestClient.delete(`/otaPackage/${otaPackageId}`);
}
