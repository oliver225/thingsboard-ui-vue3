/**
 * 规则链接口(TENANT_ADMIN)
 * 契约参考:后端 RuleChainController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 规则链实体(org.thingsboard.server.common.data.rule.RuleChain) */
export interface RuleChain extends BaseData<EntityType.RULE_CHAIN> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
  };
  /** 节点与连线另存于 RuleChainMetaData,此处仅占位 */
  configuration?: Record<string, any>;
  debugMode?: boolean;
  firstRuleNodeId?: EntityId<EntityType.RULE_NODE>;
  name: string;
  root?: boolean;
  tenantId?: EntityId<EntityType.TENANT>;
  /** 规则链类型(CORE / EDGE) */
  type?: string;
}

/** 规则链分页列表(GET /api/ruleChains,type 默认 CORE) */
export function getRuleChains(
  pageLink: PageLink,
  type: 'CORE' | 'EDGE' = 'CORE',
) {
  return requestClient.get<PageData<RuleChain>>('/ruleChains', {
    params: { ...pageLink, type },
  });
}

/** 规则链详情(GET /api/ruleChain/{ruleChainId}) */
export function getRuleChainById(ruleChainId: string) {
  return requestClient.get<RuleChain>(`/ruleChain/${ruleChainId}`);
}

/** 保存规则链(POST /api/ruleChain,带 id 为更新) */
export function saveRuleChain(ruleChain: RuleChain) {
  return requestClient.post<RuleChain>('/ruleChain', ruleChain);
}

/** 删除规则链(DELETE /api/ruleChain/{ruleChainId}) */
export function deleteRuleChain(ruleChainId: string): Promise<void> {
  return requestClient.delete(`/ruleChain/${ruleChainId}`);
}

/** 设为根规则链(POST /api/ruleChain/{ruleChainId}/root) */
export function setRootRuleChain(ruleChainId: string) {
  return requestClient.post<RuleChain>(`/ruleChain/${ruleChainId}/root`);
}
