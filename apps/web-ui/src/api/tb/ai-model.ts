/**
 * AI 模型接口(TENANT_ADMIN)
 * 契约参考:后端 AiModelController.java(/api/ai/model)
 */
import type { AiProvider, EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export type AiModelParameter =
  | 'contextLength'
  | 'frequencyPenalty'
  | 'maxOutputTokens'
  | 'presencePenalty'
  | 'temperature'
  | 'topK'
  | 'topP';

export interface AiProviderConfig {
  apiKey?: string;
  personalAccessToken?: string;
  endpoint?: string;
  serviceVersion?: string;
  projectId?: string;
  location?: string;
  serviceAccountKey?: string;
  fileName?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  baseUrl?: string;
  auth?: {
    type: 'BASIC' | 'NONE' | 'TOKEN';
    username?: string;
    password?: string;
    token?: string;
  };
}

/** AI 模型配置，与 ui-ngx 的供应商字段和模型参数保持一致。 */
export interface AiModelConfig extends Partial<
  Record<AiModelParameter, null | number>
> {
  [key: string]: unknown;
  /** 技术模型标识,如 gpt-4o */
  modelId?: string;
  modelType?: string;
  provider?: AiProvider;
  /** 供应商配置(apiKey 等敏感信息) */
  providerConfig?: AiProviderConfig;
}

/** AI 模型实体(org.thingsboard.server.common.data.ai.AiModel) */
export interface AiModel extends BaseData<EntityType.AI_MODEL> {
  modelType: 'CHAT';
  configuration?: AiModelConfig;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** AI 模型分页列表(GET /api/ai/model) */
export function getAiModels(pageLink: PageLink) {
  return requestClient.get<PageData<AiModel>>('/ai/model', {
    params: { ...pageLink },
  });
}

/** AI 模型详情(GET /api/ai/model/{modelId}) */
export function getAiModelById(aiModelId: string) {
  return requestClient.get<AiModel>(`/ai/model/${aiModelId}`);
}

/** 保存 AI 模型(POST /api/ai/model,带 id 为更新) */
export function saveAiModel(model: AiModel) {
  return requestClient.post<AiModel>('/ai/model', model);
}

/** 删除 AI 模型(DELETE /api/ai/model/{modelId}) */
export function deleteAiModel(aiModelId: string): Promise<boolean> {
  return requestClient.delete<boolean>(`/ai/model/${aiModelId}`);
}

/** 批量删除后返回失败 ID，供列表保留选中状态并重试。 */
export async function deleteAiModels(aiModelIds: string[]) {
  const ids = [...new Set(aiModelIds)];
  const results = await Promise.allSettled(ids.map((id) => deleteAiModel(id)));
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const id = ids[index];
    if (!id) return;
    (result.status === 'fulfilled' ? deletedIds : failedIds).push(id);
  });
  return { deletedIds, failedIds };
}

export function checkAiModelConnectivity(model: AiModel) {
  return requestClient.post<{ errorDetails?: string; status: string }>(
    '/ai/model/chat',
    {
      userMessage: { contents: [{ contentType: 'TEXT', text: 'Hello' }] },
      chatModelConfig: {
        ...model.configuration,
        modelType: 'CHAT',
        maxRetries: 0,
        timeoutSeconds: 20,
      },
    },
  );
}
