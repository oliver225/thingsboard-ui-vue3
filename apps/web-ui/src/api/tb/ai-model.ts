/**
 * AI 模型接口(TENANT_ADMIN)
 * 契约参考:后端 AiModelController.java(/api/ai/model)
 */
import type { AiProvider, EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** AI 模型配置(多态,按 provider 区分;此处只取列表/通用展示需要的字段) */
export interface AiModelConfig {
  [key: string]: any;
  /** 技术模型标识,如 gpt-4o */
  modelId?: string;
  modelType?: string;
  provider?: AiProvider;
  /** 供应商配置(apiKey 等敏感信息) */
  providerConfig?: Record<string, any>;
}

/** AI 模型实体(org.thingsboard.server.common.data.ai.AiModel) */
export interface AiModel extends BaseData<EntityType.AI_MODEL> {
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
export function getAiModelById(modelId: string) {
  return requestClient.get<AiModel>(`/ai/model/${modelId}`);
}

/** 保存 AI 模型(POST /api/ai/model,带 id 为更新) */
export function saveAiModel(model: AiModel) {
  return requestClient.post<AiModel>('/ai/model', model);
}

/** 删除 AI 模型(DELETE /api/ai/model/{modelId}) */
export function deleteAiModel(modelId: string): Promise<boolean> {
  return requestClient.delete<boolean>(`/ai/model/${modelId}`);
}
