import type { EntityType, OtaPackageType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export interface OtaPackageInfo extends Omit<
  BaseData<EntityType.OTA_PACKAGE>,
  'version'
> {
  title: string;
  version: string;
  type: OtaPackageType;
  tag?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  deviceProfileId?: EntityId<EntityType.DEVICE_PROFILE>;
  hasData?: boolean;
  url?: string;
  fileName?: string;
  dataSize?: number;
  contentType?: string;
  checksumAlgorithm?: string;
  checksum?: string;
  additionalInfo?: { [key: string]: unknown; description?: string };
}

export const checksumAlgorithms = [
  'MD5',
  'SHA256',
  'SHA384',
  'SHA512',
  'CRC32',
  'MURMUR3_32',
  'MURMUR3_128',
];

export function getOtaPackages(params: PageLink) {
  return requestClient.get<PageData<OtaPackageInfo>>('/otaPackages', {
    params,
  });
}

export function getOtaPackageInfo(id: string) {
  return requestClient.get<OtaPackageInfo>(`/otaPackage/info/${id}`);
}

export function saveOtaPackageInfo(data: OtaPackageInfo) {
  return requestClient.post<OtaPackageInfo>('/otaPackage', data);
}

export function uploadOtaPackageFile(
  id: string,
  file: File,
  checksumAlgorithm: string,
  checksum?: string,
) {
  return requestClient.upload<OtaPackageInfo>(
    `/otaPackage/${id}`,
    { file },
    {
      params: { checksumAlgorithm, ...(checksum ? { checksum } : {}) },
    },
  );
}

export function downloadOtaPackage(id: string) {
  return requestClient.download<Blob>(`/otaPackage/${id}/download`);
}

export function deleteOtaPackage(id: string): Promise<void> {
  return requestClient.delete(`/otaPackage/${id}`);
}

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteOtaPackages(otaPackageIds: string[]) {
  const ids = [...new Set(otaPackageIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteOtaPackage(id)),
  );
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const id = ids[index];
    if (!id) return;
    (result.status === 'fulfilled' ? deletedIds : failedIds).push(id);
  });
  return { deletedIds, failedIds };
}
