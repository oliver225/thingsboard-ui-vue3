import type { NodeFormDefinition } from '../types';

import { actionNodeForms } from './action';
import { enrichmentNodeForms } from './enrichment';
import { externalNodeForms } from './external';
import { filterNodeForms } from './filter';
import { flowNodeForms } from './flow';
import { transformationNodeForms } from './transformation';

export const nodeForms: Record<string, NodeFormDefinition> = {
  ...filterNodeForms,
  ...enrichmentNodeForms,
  ...transformationNodeForms,
  ...actionNodeForms,
  ...externalNodeForms,
  ...flowNodeForms,
};
