import type { NodeFormData, NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

export function createSchema(context: NodeFormData): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.forwardMsgToDefaultRuleChain',
      label: $t('rule-chain.config.forwardMsgToDefaultRuleChain'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      defaultValue: false,
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.forwardMsgToDefaultRuleChain',
        ),
        title: $t('rule-chain.config.forwardMsgToDefaultRuleChain'),
      },
    },
    {
      fieldName: 'configuration.ruleChainId',
      label: $t('rule-chain.config.ruleChainId'),
      formItemClass: 'sm:col-span-2',
      component: 'EntityInput',
      componentProps: {
        entityType: 'RULE_CHAIN',
        excludeId: context.ruleChainId.id,
        params: { type: context.ruleChainType },
      },
      rules: 'selectRequired',
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
