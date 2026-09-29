import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { createAttributeFields } from '../shared/attribute-fields';

export function createSchema(): VbenFormSchema[] {
  return createAttributeFields(
    $t('rule-chain.nodeAction.addOriginatorAttributesTo'),
  );
}

export const definition = {
  get title() {
    return $t('rule-chain.nodeAction.originatorAttributes');
  },
  createSchema,
  validate(configuration) {
    return [
      'clientAttributeNames',
      'sharedAttributeNames',
      'serverAttributeNames',
      'latestTsKeyNames',
    ].some((key) => configuration[key]?.length)
      ? []
      : [
          {
            fieldName: 'configuration.clientAttributeNames',
            message: $t('rule-chain.config.atLeastOneField'),
          },
        ];
  },
} satisfies NodeFormDefinition;
