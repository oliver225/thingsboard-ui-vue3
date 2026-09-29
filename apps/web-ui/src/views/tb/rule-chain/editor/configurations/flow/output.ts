import type { NodeFormDefinition } from '../../types';

import { $t } from '#/locales';

import { hint } from '../shared/form-layout';

export const definition = {
  createSchema: () => [
    hint('_outputNodeHint', $t('rule-chain.nodeAction.outputNodeHelp')),
  ],
} satisfies NodeFormDefinition;
