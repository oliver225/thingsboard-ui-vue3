/**
 * 图片库接口(SYS_ADMIN / TENANT_ADMIN)
 * 契约参考:后端 ImageController.java
 *
 * 图片本质是 resourceType=IMAGE 的资源,资源实体类型集中定义于 resource.ts,
 * 作用域统一用 #/enums 的 ResourceScope;此处仅以图片语义再导出删除结果。
 */
import type { RequestClientConfig } from '@vben/request';

import type {
  ResourceExportData,
  TbResourceDeleteResult,
  TbResourceInfo,
} from '#/api/tb/resource';
import type { ResourceScope } from '#/enums';
import type { PageData } from '#/types/tb';

import { requestClient } from '#/api/request';

export type {
  ResourceExportData,
  TbResourceDeleteResult,
  TbResourceInfo,
} from '#/api/tb/resource';

/** 图片子类型(资源子类型中与图片相关的两种) */
export type ImageSubType = 'IMAGE' | 'SCADA_SYMBOL';

/** 图片描述符(org.thingsboard.server.common.data.ImageDescriptor) */
export interface ImageDescriptor {
  etag?: string;
  height?: number;
  mediaType?: string;
  previewDescriptor?: ImageDescriptor;
  size?: number;
  width?: number;
}

/** 图片分页查询参数 */
export interface ImageQuery {
  includeSystemImages?: boolean;
  imageSubType?: ImageSubType;
  page: number;
  pageSize: number;
  sortOrder?: 'ASC' | 'DESC';
  sortProperty?: string;
  textSearch?: string;
}

/** 图片分页列表(GET /api/images) */
export function getImages(params: ImageQuery) {
  return requestClient.get<PageData<TbResourceInfo>>('/images', { params });
}

/** 图片信息(GET /api/images/{type}/{resourceKey}/info) */
export function getImageInfo(type: ResourceScope, resourceKey: string) {
  return requestClient.get<TbResourceInfo>(
    `/images/${type}/${resourceKey}/info`,
  );
}

/** 上传新图片(POST /api/image,multipart) */
export function uploadImage(
  file: Blob | File,
  title?: string,
  imageSubType: ImageSubType = 'IMAGE',
) {
  return requestClient.upload<TbResourceInfo>('/image', {
    file,
    imageSubType,
    title,
  });
}

/** 替换图片文件(PUT /api/images/{type}/{resourceKey},multipart) */
export function updateImage(
  type: ResourceScope,
  resourceKey: string,
  file: Blob | File,
) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.put<TbResourceInfo>(
    `/images/${type}/${resourceKey}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

/** 更新图片信息/标题(PUT /api/images/{type}/{resourceKey}/info) */
export function updateImageInfo(
  type: ResourceScope,
  resourceKey: string,
  data: TbResourceInfo,
) {
  return requestClient.put<TbResourceInfo>(
    `/images/${type}/${resourceKey}/info`,
    data,
  );
}

/** 切换图片公共状态(PUT /api/images/{type}/{resourceKey}/public/{isPublic}) */
export function updateImagePublicStatus(
  type: ResourceScope,
  resourceKey: string,
  isPublic: boolean,
) {
  return requestClient.put<TbResourceInfo>(
    `/images/${type}/${resourceKey}/public/${isPublic}`,
  );
}

/**
 * 删除图片(DELETE /api/images/{type}/{key})。
 * 图片被引用时后端返回 400 + references,需自行处理(强制删除),故跳过全局错误提示。
 */
export function deleteImage(
  type: ResourceScope,
  resourceKey: string,
  force = false,
) {
  // skipErrorHandler 由全局错误拦截器识别(运行期透传),此处用断言绕过配置类型校验
  return requestClient.delete<TbResourceDeleteResult>(
    `/images/${type}/${resourceKey}`,
    {
      params: { force },
      skipErrorHandler: true,
    } as RequestClientConfig,
  );
}

/** 导出图片为 JSON(GET /api/images/{type}/{resourceKey}/export) */
export function exportImage(type: ResourceScope, resourceKey: string) {
  return requestClient.get<ResourceExportData>(
    `/images/${type}/${resourceKey}/export`,
  );
}

/** 导入图片(PUT /api/image/import) */
export function importImage(data: ResourceExportData) {
  return requestClient.put<TbResourceInfo>('/image/import', data);
}

/** 下载图片原图为 Blob(GET /api/images/{type}/{resourceKey}) */
export function downloadImage(type: ResourceScope, resourceKey: string) {
  return requestClient.download<Blob>(`/images/${type}/${resourceKey}`);
}

/** 下载图片预览为 Blob(GET /api/images/{type}/{resourceKey}/preview) */
export function downloadImagePreview(type: ResourceScope, resourceKey: string) {
  return requestClient.download<Blob>(`/images/${type}/${resourceKey}/preview`);
}
