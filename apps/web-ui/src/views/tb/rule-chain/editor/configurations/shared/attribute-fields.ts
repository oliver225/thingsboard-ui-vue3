import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { createFetchToField } from './fetch-to-field';

export function createAttributeFields(
  destinationTitle = $t('rule-chain.nodeAction.addSelectedAttributesTo'),
): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.clientAttributeNames',
      label: $t('rule-chain.config.clientAttributeNames'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      componentProps: { mode: 'tags' },
    },
    {
      fieldName: 'configuration.sharedAttributeNames',
      label: $t('rule-chain.config.sharedAttributeNames'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      componentProps: { mode: 'tags' },
    },
    {
      fieldName: 'configuration.serverAttributeNames',
      label: $t('rule-chain.config.serverAttributeNames'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      componentProps: { mode: 'tags' },
    },
    {
      fieldName: 'configuration.latestTsKeyNames',
      label: $t('rule-chain.config.latestTsKeyNames'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      componentProps: { mode: 'tags' },
    },
    {
      fieldName: 'configuration.getLatestValueWithTs',
      label: $t('rule-chain.nodeAction.getLatestValueWithTs'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        title: $t('rule-chain.nodeAction.getLatestValueWithTs'),
      },
      dependencies: {
        triggerFields: ['configuration.latestTsKeyNames'],
        resolve: ({ values: { configuration } }) => ({
          componentProps: {
            description: $t(
              'rule-chain.config.descriptions.getLatestValueWithTs',
              {
                latestTsKeyName:
                  configuration.latestTsKeyNames?.[0] || 'temperature',
                example: '{"ts":1574329385897, "value":42}',
              },
            ),
          },
          if: configuration.latestTsKeyNames?.length > 0,
        }),
      },
    },

    createFetchToField(destinationTitle, 'selectRequired'),
    {
      fieldName: 'configuration.tellFailureIfAbsent',
      label: $t('rule-chain.nodeAction.tellFailureIfAbsent'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.tellFailureIfAbsent'),
        title: $t('rule-chain.nodeAction.tellFailureIfAbsent'),
      },
    },
  ];
}
