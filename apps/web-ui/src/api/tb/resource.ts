/**
 * 资源库接口(SYS_ADMIN / TENANT_ADMIN)
 *
 * TbResource 是 ThingsBoard 所有资源的基础实体(resourceType:LWM2M_MODEL / JKS /
 * PKCS_12 / JS_MODULE / IMAGE / DASHBOARD ...)。图片库(image.ts)与 SCADA 符号库
 * (scada-symbol.ts)只是 resourceType=IMAGE 的特例,故资源实体类型集中定义于此,
 */
import type { RequestClientConfig } from '@vben/request';

import type { EntityType, ResourceSubType, ResourceType } from '#/enums';
import type { BaseData, EntityId, PageData } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 资源信息(org.thingsboard.server.common.data.TbResourceInfo) */
export interface TbResourceInfo extends BaseData<EntityType.TB_RESOURCE> {
  descriptor?: any;
  etag?: string;
  externalId?: EntityId<EntityType.TB_RESOURCE>;
  fileName?: string;
  /** 资源访问链接,如 /api/resource/lwm2m_model/tenant/19_1.0(只读) */
  link?: string;
  /** 与 title 相同(只读) */
  name?: string;
  /** 是否公开(Jackson 将 isPublic 序列化为 public) */
  public?: boolean;
  /** 公共访问链接,仅图片且 public=true 时非空(只读) */
  publicLink?: string;
  publicResourceKey?: string;
  resourceKey: string;
  resourceSubType?: ResourceSubType;
  resourceType?: ResourceType;
  searchText?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  title?: string;
}

/** 资源完整实体(含 base64 数据,仅 deprecated 的 saveResource 用) */
export interface TbResource extends TbResourceInfo {
  data?: string;
}

/** 资源导出数据(org.thingsboard.server.common.data.ResourceExportData) */
export interface ResourceExportData {
  data?: string;
  fileName?: string;
  link?: string;
  mediaType?: string;
  public?: boolean;
  publicResourceKey?: string;
  resourceKey?: string;
  subType?: ResourceSubType;
  title?: string;
  type?: string;
}

/** 删除结果(org.thingsboard.server.common.data.TbResourceDeleteResult) */
export interface TbResourceDeleteResult {
  /** 阻止删除的引用实体,按实体类型分组 */
  references?: Record<string, { name?: string }[]>;
  success: boolean;
}

/** 资源分页查询参数 */
export interface ResourceQuery {
  page: number;
  pageSize: number;
  /** 资源子类型(EXTENSION / MODULE,配合 JS_MODULE 使用) */
  resourceSubType?: ResourceSubType;
  /** 资源类型;为空时后端返回除 JS_MODULE/IMAGE/DASHBOARD 外的全部 */
  resourceType?: ResourceType;
  sortOrder?: 'ASC' | 'DESC';
  sortProperty?: string;
  textSearch?: string;
}

/**
 * 资源分页列表(GET /api/resource)。
 * SYS_ADMIN 仅返回系统级资源;TENANT_ADMIN 返回租户级 + 系统级资源。
 */
export function getResources(params: ResourceQuery) {
  return requestClient.get<PageData<TbResourceInfo>>('/resource', { params });
}

/** 资源信息(GET /api/resource/info/{resourceId}) */
export function getResourceInfoById(resourceId: string) {
  return requestClient.get<TbResourceInfo>(`/resource/info/${resourceId}`);
}

/**
 * 资源完整实体含 base64 数据(GET /api/resource/{resourceId})。
 */
export function getResourceById(resourceId: string) {
  return requestClient.get<TbResource>(`/resource/${resourceId}`);
}

/** 上传新资源(POST /api/resource/upload,multipart) */
export function uploadResource(params: {
  file: Blob | File;
  resourceSubType?: ResourceSubType;
  resourceType: ResourceType;
  title?: string;
}) {
  return requestClient.upload<TbResourceInfo>('/resource/upload', {
    file: params.file,
    resourceSubType: params.resourceSubType,
    resourceType: params.resourceType,
    title: params.title,
  });
}

/** 替换资源文件(PUT /api/resource/{id}/data,multipart) */
export function updateResourceData(id: string, file: Blob | File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.put<TbResourceInfo>(`/resource/${id}/data`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** 更新资源信息/标题(PUT /api/resource/{id}/info) */
export function updateResourceInfo(id: string, data: TbResourceInfo) {
  return requestClient.put<TbResourceInfo>(`/resource/${id}/info`, data);
}

/** 下载资源原始文件为 Blob(GET /api/resource/{resourceId}/download) */
export function downloadResource(resourceId: string) {
  return requestClient.download<Blob>(`/resource/${resourceId}/download`);
}

/**
 * 删除资源(DELETE /api/resource/{resourceId})。
 * 资源被引用时后端返回 400 + references,需自行处理(强制删除),故跳过全局错误提示。
 */
export function deleteResource(resourceId: string, force = false) {
  return requestClient.delete<TbResourceDeleteResult>(
    `/resource/${resourceId}`,
    {
      params: { force },
      skipErrorHandler: true,
    } as RequestClientConfig,
  );
}
