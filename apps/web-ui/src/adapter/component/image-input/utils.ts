import type { TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { SYS_TENANT_ID } from '#/constants';

// 与 Angular gallery-image-input 的持久化格式一致，外链和 base64 也带此前缀。
export function removeImagePrefix(value?: null | string) {
  return (value ?? '').replace(/^tb-image;/, '');
}

export function toImageValue(value?: null | string) {
  const url = removeImagePrefix(value).trim();
  return url ? `tb-image;${url}` : null;
}

export function getImageResource(value?: null | string): null | {
  resourceKey: string;
  scope: ResourceScope;
} {
  const match = removeImagePrefix(value).match(
    /\/api\/images\/(tenant|system)\/([^?#]+)/,
  );
  const scope = match?.[1];
  const resourceKey = match?.[2];
  return (scope === 'tenant' || scope === 'system') && resourceKey
    ? { scope, resourceKey }
    : null;
}

export function getImageScope(image: TbResourceInfo): ResourceScope {
  return !image.tenantId?.id || image.tenantId.id === SYS_TENANT_ID
    ? 'system'
    : 'tenant';
}

export function getImageLink(image: TbResourceInfo) {
  return (
    image.link || `/api/images/${getImageScope(image)}/${image.resourceKey}`
  );
}
