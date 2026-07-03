/**
 * ApiKeyController
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** API 密钥信息(ApiKeyInfo) */
export interface ApiKeyInfo extends BaseData<EntityType.API_KEY> {
  description?: string;
  enabled: boolean;
  expirationTime: number; // 过期时间戳;0 表示永不过期
  tenantId?: EntityId<EntityType.TENANT>;
  userId: EntityId<EntityType.USER>;
}

/** 保存接口返回的密钥(ApiKey),value 仅在创建时返回一次 */
export interface ApiKey extends ApiKeyInfo {
  value?: string;
}

/** 用户的 API 密钥分页列表(GET /api/apiKeys/{userId}) */
export function getUserApiKeys(userId: string, pageLink: PageLink) {
  return requestClient.get<PageData<ApiKeyInfo>>(`/apiKeys/${userId}`, {
    params: { ...pageLink },
  });
}

/** 创建 API 密钥(POST /api/apiKey)→ 返回含 value 的明文 token(仅此一次) */
export function saveApiKey(apiKey: ApiKeyInfo) {
  return requestClient.post<ApiKey>('/apiKey', apiKey);
}

/** 更新描述(PUT /api/apiKey/{id}/description) */
export function updateApiKeyDescription(id: string, description: string) {
  return requestClient.put<ApiKeyInfo>(
    `/apiKey/${id}/description`,
    description,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

/** 启用/禁用(PUT /api/apiKey/{id}/enabled/{enabledValue}) */
export function enableApiKey(id: string, enabled: boolean) {
  return requestClient.put<ApiKeyInfo>(`/apiKey/${id}/enabled/${enabled}`);
}

/** 删除(DELETE /api/apiKey/{id}) */
export function deleteApiKey(id: string): Promise<void> {
  return requestClient.delete(`/apiKey/${id}`);
}
