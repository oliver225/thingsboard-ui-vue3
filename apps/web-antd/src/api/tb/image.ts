import type { AxiosProgressEvent } from '@vben/request';
import type { Recordable } from '@vben/types';

import type { ResourceApi } from './resources-library';

import type { BasicQuery, Page } from '#/api/model';

import { requestClient } from '#/api/request';

export const tbImagePrefix = 'tb-image;';

export function uploadImageApi(
  file: Blob | File,
  title?: string,
  imageSubType?: 'IMAGE' | 'SCADA_SYMBOL',
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  return requestClient.post<ResourceApi.ResourceInfo>(
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
  return requestClient.put<ResourceApi.ResourceInfo>(
    `/images/${type}/${key}`,
    { file },
    { headers: { 'Content-type': 'multipart/form-data;charset=UTF-8' } },
  );
}

export function updateImageInfoApi(
  type: 'system' | 'tenant',
  key: string,
  data: any | ResourceApi.ResourceInfo,
) {
  return requestClient.put<ResourceApi.ResourceInfo>(
    `/images/${type}/${key}/info`,
    {
      request: data,
    },
  );
}

export function updateImagePublicStatusApi(
  type: 'system' | 'tenant',
  key: string,
  isPublic: boolean,
) {
  return requestClient.put<ResourceApi.ResourceInfo>(
    `/images/${type}/${key}/public/${isPublic}`,
  );
}

export function downloadImageApi(
  type: 'system' | 'tenant',
  key: string,
  etag?: string,
  acceptEncode?: string,
) {
  return requestClient.get(
    `/images/${type}/${key}`,
    { t: Date.now() },
    {
      headers: { Etag: etag, 'Accept-Encoding': acceptEncode },
      responseType: 'blob',
    },
  );
}

export function downloadPublicImageApi(
  publicResourceKey: string,
  etag?: string,
  acceptEncode?: string,
) {
  return requestClient.get(
    `/images/public/${publicResourceKey}`,
    { t: Date.now() },
    {
      headers: { Etag: etag, 'Accept-Encoding': acceptEncode },
      responseType: 'blob',
    },
  );
}

export function imagePreviewApi(
  type: 'system' | 'tenant',
  key: string,
  etag?: string,
  acceptEncode?: string,
) {
  return requestClient.get(
    `/images/${type}/${key}/preview`,
    { t: Date.now() },
    {
      headers: {
        Etag: `"${etag}"`,
        'Accept-Encoding': acceptEncode,
      },
      responseType: 'arraybuffer',
      responseReturn: 'raw',
    },
  );
}

export function imageListApi(
  params: BasicQuery,
  imageSubType: 'IMAGE' | 'SCADA_SYMBOL',
  includeSystemImages = false,
) {
  return requestClient.get<Page<ResourceApi.ResourceInfo>>('/images', {
    ...params,
    imageSubType,
    includeSystemImages,
  });
}

export function getImageInfoApi(type: 'system' | 'tenant', key: string) {
  return requestClient.get<ResourceApi.ResourceInfo>(
    `/images/${type}/${key}/info`,
  );
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
