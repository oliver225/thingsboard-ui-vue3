import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { createFetchToField } from '../shared/fetch-to-field';

export function createSchema(): VbenFormSchema[] {
  return [createFetchToField($t('rule-chain.nodeAction.fetchCredentialsTo'))];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
