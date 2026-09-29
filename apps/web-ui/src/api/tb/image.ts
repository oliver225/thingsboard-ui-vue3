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
import { getResourceInfoById } from '#/api/tb/resource';
import { SYS_TENANT_ID } from '#/constants';
import { $t } from '#/locales';

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

/** 通过资源 ID 获取图片作用域和资源键，再执行普通删除。 */
export async function deleteImageById(imageId: string): Promise<void> {
  const resource = await getResourceInfoById(imageId);
  const scope =
    !resource.tenantId?.id || resource.tenantId.id === SYS_TENANT_ID
      ? 'system'
      : 'tenant';
  try {
    const result = await deleteImage(scope, resource.resourceKey);
    if (result?.success === false) {
      throw new Error($t('tb.common.messages.delete.resourceReferenced'));
    }
  } catch (error: any) {
    const result = (error?.response?.data ?? error) as
      | TbResourceDeleteResult
      | undefined;
    if (result?.success === false) {
      throw new Error($t('tb.common.messages.delete.resourceReferenced'), {
        cause: error,
      });
    }
    throw error;
  }
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

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteImages(imageIds: string[]) {
  const ids = [...new Set(imageIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteImageById(id)),
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
