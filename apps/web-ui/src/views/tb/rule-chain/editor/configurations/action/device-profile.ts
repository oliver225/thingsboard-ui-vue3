import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { hint } from '../shared/form-layout';

export function createSchema(): VbenFormSchema[] {
  return [
    hint('_profileHelp', $t('rule-chain.actionUi.deviceProfileHelp')),
    {
      fieldName: 'configuration.persistAlarmRulesState',
      label: $t('rule-chain.nodeAction.persistAlarmRulesState'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.persistAlarmRulesState',
        ),
        title: $t('rule-chain.nodeAction.persistAlarmRulesState'),
      },
    },
    {
      fieldName: 'configuration.fetchAlarmRulesStateOnStart',
      label: $t('rule-chain.nodeAction.fetchAlarmRulesStateOnStart'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t(
          'rule-chain.config.descriptions.fetchAlarmRulesStateOnStart',
        ),
        title: $t('rule-chain.nodeAction.fetchAlarmRulesStateOnStart'),
      },
      dependencies: {
        triggerFields: ['configuration.persistAlarmRulesState'],
        resolve: ({ values: { configuration = {} } }) => ({
          disabled: !configuration.persistAlarmRulesState,
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
  toConfiguration(configuration) {
    return {
      ...configuration,
      fetchAlarmRulesStateOnStart:
        !!configuration.persistAlarmRulesState &&
        !!configuration.fetchAlarmRulesStateOnStart,
    };
  },
} satisfies NodeFormDefinition;
