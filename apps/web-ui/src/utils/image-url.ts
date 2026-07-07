/**
 * ThingsBoard 图片引用 URL 工具。
 *
 * TB 把图片引用以 `tb-image;` 前缀存储(后端据此解析);图片 URL 可能是:
 * - 资源图片:`/api/images/{tenant|system}/{key}`(需鉴权下载)
 * - 内嵌图片:`data:image/...;base64,...`
 * - 外部链接:任意其它 URL
 *
 * 逻辑对齐 ui-ngx `shared/models/resource.models.ts`。
 */
import type { TbResourceInfo } from '#/api/tb/resource';
import type { ResourceScope } from '#/enums';

import { SYS_TENANT_ID } from '#/constants';

export const TB_IMAGE_PREFIX = 'tb-image;';
export const IMAGES_URL_REGEXP = /\/api\/images\/(tenant|system)\/(.*)/;
export const IMAGE_BASE64_URL_PREFIX = 'data:image/';

export type ImageLinkType = 'base64' | 'external' | 'none' | 'resource';

/** 去除 `tb-image;` 前缀 */
export function removeTbImagePrefix(url?: string): string {
  return url ? url.replace(TB_IMAGE_PREFIX, '') : '';
}

/** 追加 `tb-image;` 前缀(空值返回 undefined) */
export function prependTbImagePrefix(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  return url.startsWith(TB_IMAGE_PREFIX) ? url : TB_IMAGE_PREFIX + url;
}

export function isImageResourceUrl(url?: string): boolean {
  return !!url && IMAGES_URL_REGEXP.test(url);
}

export function isBase64DataImageUrl(url?: string): boolean {
  return !!url && url.startsWith(IMAGE_BASE64_URL_PREFIX);
}

/** 从资源图片 URL 解析出作用域与资源键 */
export function extractParamsFromImageResourceUrl(
  url: string,
): null | { key: string; type: ResourceScope } {
  const res = url.match(IMAGES_URL_REGEXP);
  const type = res?.[1];
  const key = res?.[2];
  if (type && key) {
    return { key, type: type as ResourceScope };
  }
  return null;
}

/** 判定图片 URL 的链接类型 */
export function detectImageLinkType(url?: string): ImageLinkType {
  if (!url) {
    return 'none';
  }
  if (isImageResourceUrl(url)) {
    return 'resource';
  }
  if (isBase64DataImageUrl(url)) {
    return 'base64';
  }
  return 'external';
}

/** 由资源信息推断作用域(系统级 / 租户级) */
export function imageResourceScope(info: TbResourceInfo): ResourceScope {
  return !info.tenantId?.id || info.tenantId.id === SYS_TENANT_ID
    ? 'system'
    : 'tenant';
}

/** 构造图片资源访问链接 `/api/images/{scope}/{key}` */
export function buildImageResourceLink(info: TbResourceInfo): string {
  return `/api/images/${imageResourceScope(info)}/${info.resourceKey}`;
}
