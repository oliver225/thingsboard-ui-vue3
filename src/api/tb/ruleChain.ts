import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface RuleChain extends BasicModel<EntityType.RULE_CHAIN> {
  tenantId?: EntityId<EntityType.TENANT>;
  name?: string;
  type?: 'CORE' | 'EDGE';
  root?: boolean;
  debugMode?: boolean;
  firstRuleNodeId?: EntityId<EntityType.RULE_NODE>;
  configuration: Recordable;
  externalId?: EntityId<EntityType.RULE_CHAIN>;
  additionalInfo?: Recordable;
}

export interface RuleNode extends BasicModel<EntityType.RULE_NODE> {
  ruleChainId?: EntityId<EntityType.RULE_CHAIN>;
  name: string;
  debugMode: boolean;
  singletonMode: boolean;
  type: string;
  configuration: Recordable;
  additionalInfo: Recordable;
}

export interface RuleChainMetaData {
  ruleChainId?: EntityId<EntityType.RULE_CHAIN>;
  firstNodeIndex?: number;
  nodes?: [RuleNode];
  connections?: [{ fromIndex: number; toIndex: number; type: string }];
  ruleChainConnections?: [
    { fromIndex: number; type: string; targetRuleChainId: EntityId<EntityType.RULE_CHAIN>; additionalInfo: Recordable },
  ];
}

export interface RuleChainOutputLabelsUsage {
  ruleChainId?: EntityId<EntityType.RULE_CHAIN>;
  ruleNodeId?: EntityId<EntityType.RULE_NODE>;
  ruleChainName?: string;
  ruleNodeName?: string;
  labels?: [string];
}
export function ruleChainList(params: BasicQuery, type?: 'CORE' | 'EDGE') {
  return defHttp.get<Page<RuleChain>>({
    url: '/api/ruleChains',
    params: { type: type, ...params },
  });
}

export function getRuleChainById(ruleChainId: string) {
  return defHttp.get<RuleChain>({
    url: `/api/ruleChain/${ruleChainId}`,
  });
}

export function saveRuleChain(data: RuleChain | any) {
  return defHttp.postJson<RuleChain>({
    url: '/api/ruleChain',
    data,
  });
}

export function setDefaultRuleChain(name: string) {
  return defHttp.postJson<RuleChain>({
    url: '/api/ruleChain/device/default',
    params: { name: name },
  });
}

export function setRootRuleChain(ruleChainId: string) {
  return defHttp.post<RuleChain>({
    url: `/api/ruleChain/${ruleChainId}/root`,
  });
}

export function deleteRuleChain(ruleChainId: string) {
  return defHttp.delete<void>({
    url: `/api/ruleChain/${ruleChainId}`,
  });
}

export function getRuleChainOutputLabels(ruleChainId: string) {
  return defHttp.get<[string]>({
    url: `/api/ruleChain/${ruleChainId}/output/labels`,
  });
}

export function getRuleChainOutputLabelsUsage(ruleChainId: string) {
  return defHttp.get<[RuleChainOutputLabelsUsage]>({
    url: `/api/ruleChain/${ruleChainId}/output/labels/usage`,
  });
}

export function getRuleChainMetaData(ruleChainId: string) {
  return defHttp.get<RuleChainMetaData>({
    url: `/api/ruleChain/${ruleChainId}/metadata`,
  });
}

export function saveRuleChainMetaData(data: RuleChainMetaData | any, updateRelated = true) {
  return defHttp.postJson<RuleChainMetaData>({
    url: '/api/ruleChain/metadata',
    data,
    params: { updateRelated: updateRelated },
  });
}
