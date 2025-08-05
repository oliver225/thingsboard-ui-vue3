import { BasicQuery, Page } from '../model/baseModel';
import { ResourceInfo } from './resourceLibrary';
import { ContentTypeEnum } from '/@/enums/httpEnum';
import { defHttp } from '/@/utils/http/axios';
import { AxiosProgressEvent } from 'axios';

export const tbImagePrefix = 'tb-image;';

export function imageList(params: BasicQuery, includeSystemImages = false) {
  return defHttp.get<Page<ResourceInfo>>({
    url: '/api/images',
    params: { ...params, includeSystemImages: includeSystemImages },
  });
}

export function getImageInfo(type: 'system' | 'tenant', key: string) {
  return defHttp.get<ResourceInfo>({
    url: `/api/images/${type}/${key}/info`,
  });
}

export function getImageInfo2(link: string) {
  return defHttp.get<ResourceInfo>({
    url: `${link}/info`,
  });
}

export function updateImageInfo(data: ResourceInfo | any) {
  return defHttp.put<ResourceInfo>({
    url: `${data.link}/info`,
    data,
  });
}

export function deleteImage(link: string, force = false) {
  return defHttp.delete<{ success: boolean; references: Recordable }>(
    {
      url: `${link}?force=${force}`,
    },
    { errorMessageMode: 'none' },
  );
}

export function imagePreview(link: string, etag?: string) {
  return defHttp.get({
    url: `${link}/preview`,
    headers: { 'If-None-Match': etag },
    responseType: 'blob',
  });
}

export function downloadImage(link: string, etag?: string) {
  return defHttp.get(
    {
      url: `${link}`,
      headers: { 'If-None-Match': etag },
      responseType: 'blob',
    },
    { isReturnNativeResponse: true, joinPrefix: false },
  );
}

export function getSvg(type: string, key: string) {
  return defHttp.get<any>({
    url: `/api/images/${type}/${key}`,
  });
}

export function downloadPublicImage(publicResourceKey: string, etag?: string) {
  return defHttp.get<any>({
    url: `/api/images/public/${publicResourceKey}`,
  });
}

export function exportImage(type: string, key: string) {
  return defHttp.get<any>({
    url: `/api/images/${type}/${key}/export`,
  });
}

export function importImage() {
  return defHttp.put<any>({
    url: '/api/image/import',
  });
}

export function updateImagePublicStatus(link: string, isPublic: boolean) {
  return defHttp.put<ResourceInfo>({
    url: `${link}/public/${isPublic}`,
  });
}

export function uploadImage(
  file: File | Blob,
  title: string,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  return defHttp.post<ResourceInfo>({
    url: `/api/image`,
    data: { file: file, title: title },
    headers: { 'Content-type': ContentTypeEnum.FORM_DATA },
    onUploadProgress,
  });
}
