import type { VbenFormSchema } from '#/adapter/form';
import type { RuleNode, RuleNodeDescriptor } from '#/api/tb/rule-chain';
import type { EntityType } from '#/enums';
import type { FormValidationIssue } from '#/types/form';
import type { EntityId } from '#/types/tb';

export interface NodeFormData {
  nodeId: string;
  descriptor: RuleNodeDescriptor;
  data?: RuleNode;
  ruleChainId: EntityId<EntityType.RULE_CHAIN>;
  ruleChainType?: 'CORE' | 'EDGE';
}

export interface NodeFormDefinition {
  hasQueue?: boolean;
  title?: string;
  createSchema?: (context: NodeFormData) => VbenFormSchema[];
  getValues?: (
    configuration: RuleNode['configuration'],
  ) => RuleNode['configuration'];
  validate?: (
    configuration: RuleNode['configuration'],
  ) => FormValidationIssue[];
  toConfiguration?: (
    configuration: RuleNode['configuration'],
  ) => RuleNode['configuration'];
}

export interface NodeFormValues {
  queueName?: string;
  _configuration?: undefined;
  name: string;
  description: string;
  debugSettings: RuleNode['debugSettings'];
  singletonMode: boolean;
  configuration: RuleNode['configuration'];
}
