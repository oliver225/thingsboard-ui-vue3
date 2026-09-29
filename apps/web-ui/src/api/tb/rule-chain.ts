/**
 * 规则链接口(TENANT_ADMIN)
 * 契约参考:后端 RuleChainController.java
 */
import type { EntityType } from '#/enums';
import type {
  BaseData,
  EntityDebugSettings,
  EntityId,
  PageData,
  PageLink,
} from '#/types/tb';

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

export type RuleNodeCategory =
  | 'ACTION'
  | 'ENRICHMENT'
  | 'EXTERNAL'
  | 'FILTER'
  | 'FLOW'
  | 'TRANSFORMATION';

export interface RuleNodeDescriptor {
  clazz: string;
  name: string;
  type: RuleNodeCategory;
  configurationVersion: number;
  clusteringMode?: 'ENABLED' | 'SINGLETON' | 'USER_PREFERENCE';
  configurationDescriptor: {
    nodeDefinition: {
      defaultConfiguration: Record<string, any>;
      description?: string;
      details?: string;
      icon?: string;
      iconUrl?: string;
      inEnabled: boolean;
      outEnabled: boolean;
      customRelations: boolean;
      relationTypes: string[];
      deprecated?: boolean;
      ruleChainNode?: boolean;
    };
  };
}

export interface RuleNode extends BaseData<EntityType.RULE_NODE> {
  name: string;
  type: string;
  ruleChainId?: EntityId<EntityType.RULE_CHAIN>;
  configuration: Record<string, any>;
  configurationVersion: number;
  debugMode?: boolean;
  debugSettings?: EntityDebugSettings | null;
  singletonMode?: boolean;
  queueName?: string;
  additionalInfo?: {
    [key: string]: any;
    description?: string;
    layoutX?: number;
    layoutY?: number;
  };
}

export interface RuleNodeConnection {
  fromIndex: number;
  toIndex: number;
  type: string;
}

export interface RuleChainConnection {
  fromIndex: number;
  targetRuleChainId: EntityId<EntityType.RULE_CHAIN>;
  type: string;
  additionalInfo?: Record<string, any>;
}

export interface RuleChainMetaData {
  ruleChainId: EntityId<EntityType.RULE_CHAIN>;
  version?: number;
  firstNodeIndex: null | number;
  nodes: RuleNode[];
  connections: null | RuleNodeConnection[];
  ruleChainConnections: null | RuleChainConnection[];
}

export function getRuleChainMetaData(id: string) {
  return requestClient.get<RuleChainMetaData>(`/ruleChain/${id}/metadata`);
}

export function saveRuleChainMetaData(
  metadata: RuleChainMetaData,
  updateRelated = true,
) {
  return requestClient.post<RuleChainMetaData>(
    '/ruleChain/metadata',
    metadata,
    { params: { updateRelated } },
  );
}

export function getRuleNodeDescriptors(ruleChainType: 'CORE' | 'EDGE') {
  return requestClient.get<RuleNodeDescriptor[]>('/components', {
    params: {
      componentTypes: 'FILTER,ENRICHMENT,TRANSFORMATION,ACTION,EXTERNAL,FLOW',
      ruleChainType,
    },
  });
}

export function testRuleNodeScript(
  body: {
    script: string;
    scriptType: string;
    argNames: string[];
    msg: string;
    metadata: Record<string, string>;
    msgType: string;
  },
  scriptLang: 'JS' | 'TBEL',
  signal?: AbortSignal,
) {
  const config = { params: { scriptLang }, signal, skipErrorHandler: !!signal };
  return requestClient.post<{ error?: string; output?: string }>(
    '/ruleChain/testScript',
    body,
    config,
  );
}

export function getRuleNodeDebugInput(id: string, signal?: AbortSignal) {
  const config = { signal, skipErrorHandler: !!signal };
  return requestClient.get<null | {
    data?: string;
    metadata?: string;
    msgType?: string;
  }>(`/ruleNode/${id}/debugIn`, config);
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

/** Edge 根规则链模板：仅用于新建 Edge，不修改 CORE 根规则链。 */
export function setEdgeTemplateRootRuleChain(ruleChainId: string) {
  return requestClient.post<RuleChain>(
    `/ruleChain/${ruleChainId}/edgeTemplateRoot`,
  );
}

export function getAutoAssignToEdgeRuleChains() {
  return requestClient.get<RuleChain[]>(
    '/ruleChain/autoAssignToEdgeRuleChains',
  );
}

export function setAutoAssignToEdgeRuleChain(ruleChainId: string) {
  return requestClient.post<RuleChain>(
    `/ruleChain/${ruleChainId}/autoAssignToEdge`,
  );
}

export function unsetAutoAssignToEdgeRuleChain(ruleChainId: string) {
  return requestClient.delete<RuleChain>(
    `/ruleChain/${ruleChainId}/autoAssignToEdge`,
  );
}

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteRuleChains(ruleChainIds: string[]) {
  const ids = [...new Set(ruleChainIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteRuleChain(id)),
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
