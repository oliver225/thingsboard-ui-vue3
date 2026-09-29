import type { NodeFormDefinition } from '../../types';

import { definition as nodeOutput } from './output';
import { definition as nodeRuleChain } from './rule-chain';

export const flowNodeForms: Record<string, NodeFormDefinition> = {
  // ui-ngx 的 acknowledge 使用空配置，仅展示通用节点字段。
  acknowledge: {},
  checkpoint: { hasQueue: true },
  output: nodeOutput,
  'rule-chain': nodeRuleChain,
};
