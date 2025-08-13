import type { AxiosProgressEvent } from '@vben/request';
import type { Recordable } from '@vben/types';

import type { BasicQuery, Page } from '../model';
import type { ResourceInfo } from './resources-library';

import { requestClient } from '#/api/request';

export const tbImagePrefix = 'tb-image;';

export function uploadImageApi(
  file: Blob | File,
  title?: string,
  imageSubType?: 'IMAGE' | 'SCADA_SYMBOL',
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  return requestClient.post<ResourceInfo>(
    '/image',
    { file, title, imageSubType },
    {
      headers: { 'Content-type': 'multipart/form-data;charset=UTF-8' },
      onUploadProgress,
    },
  );
}

export function updateImageApi(
  type: 'system' | 'tenant',
  key: string,
  file: Blob | File,
) {
  return requestClient.put<ResourceInfo>(
    `/images/${type}/${key}`,
    { file },
    { headers: { 'Content-type': 'multipart/form-data;charset=UTF-8' } },
  );
}

export function updateImageInfoApi(
  type: 'system' | 'tenant',
  key: string,
  data: any | ResourceInfo,
) {
  return requestClient.put<ResourceInfo>(`/images/${type}/${key}/info`, data);
}

export function updateImagePublicStatusApi(
  type: 'system' | 'tenant',
  key: string,
  isPublic: boolean,
) {
  return requestClient.put<ResourceInfo>(
    `/images/${type}/${key}/public/${isPublic}`,
  );
}

export function downloadImageApi(
  type: 'system' | 'tenant',
  key: string,
  etag?: string,
  acceptEncode?: string,
) {
  return requestClient.get(`/images/${type}/${key}`, {
    params: { t: Date.now() },
    headers: { Etag: etag, 'Accept-Encoding': acceptEncode },
    responseType: 'blob',
  });
}

export function downloadPublicImageApi(
  publicResourceKey: string,
  etag?: string,
  acceptEncode?: string,
) {
  return requestClient.get(`/images/public/${publicResourceKey}`, {
    params: { t: Date.now() },
    headers: { Etag: etag, 'Accept-Encoding': acceptEncode },
    responseType: 'blob',
  });
}

export function imagePreviewApi(
  type: 'system' | 'tenant',
  key: string,
  etag?: string,
  acceptEncode?: string,
) {
  return requestClient.get(`/images/${type}/${key}/preview`, {
    params: { t: Date.now() },
    headers: { Etag: `"${etag}"`, 'Accept-Encoding': acceptEncode },
    responseType: 'arraybuffer',
    responseReturn: 'raw',
  });
}

export function imageListApi(
  params: BasicQuery,
  imageSubType: 'IMAGE' | 'SCADA_SYMBOL',
  includeSystemImages = false,
) {
  return requestClient.get<Page<ResourceInfo>>('/images', {
    params: { ...params, imageSubType, includeSystemImages },
  });
}

export function getImageInfoApi(type: 'system' | 'tenant', key: string) {
  return requestClient.get<ResourceInfo>(`/images/${type}/${key}/info`);
}
export function deleteImageApi(
  type: 'system' | 'tenant',
  key: string,
  force = false,
) {
  return requestClient.delete<{
    references: Recordable<any>;
    success: boolean;
  }>(`/images/${type}/${key}?force=${force}`);
}
