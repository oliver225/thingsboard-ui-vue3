import { BasicQuery, Page } from "../model/baseModel";
import { ResourceInfo } from "./resourceLibrary";
import { defHttp } from "/@/utils/http/axios";





export function imageList(params: BasicQuery, includeSystemImages = false) {
  return defHttp.get<Page<ResourceInfo>>({
    url: '/api/images',
    params: { ...params, includeSystemImages: includeSystemImages }
  });
}


export function getImageInfo(type: string, key: string) {
  return defHttp.get<ResourceInfo>({
    url: `/api/images/${type}/${key}/info`,
  });
}

export function deleteImage(link: string, force = false) {
  return defHttp.delete<{ success: boolean, references: Recordable }>({
    url: `${link}?force=${force}`,
  }, { errorMessageMode: 'none' });
}

export function imagePreview(link: string, etag?: string) {
  return defHttp.get({
    url: `${link}/preview`,
    headers: { 'If-None-Match': etag },
    responseType: 'blob'
  });
}

export function downloadImage(link: string, etag?: string) {
  return defHttp.get({
    url: `${link}`,
    headers: { 'If-None-Match': etag },
    responseType: 'blob'
  }, { isReturnNativeResponse: true, joinPrefix: false });
}

export function downloadPublicImage(publicResourceKey: string, etag?: string) {
  return defHttp.get<any>({
    url: `/api/images/public/${publicResourceKey}`,
  });
}


export function exportImage(type: string, key: string,) {
  return defHttp.get<any>({
    url: `/api/images/${type}/${key}/export`,
  });
}

export function importImage() {
  return defHttp.put<any>({
    url: '/api/image/import',
  });
}
