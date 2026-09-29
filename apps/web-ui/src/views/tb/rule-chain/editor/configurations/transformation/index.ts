import type { NodeFormDefinition } from '../../types';

import { definition as nodeChangeOriginator } from './change-originator';
import { definition as nodeCopyKeyValuePairs } from './copy-key-value-pairs';
import { definition as nodeDeduplication } from './deduplication';
import { definition as nodeDeleteKeyValuePairs } from './delete-key-value-pairs';
import { definition as nodeJsonPath } from './json-path';
import { definition as nodeRenameKeys } from './rename-keys';
import { definition as nodeToEmail } from './to-email';
import { definition as nodeTransformScript } from './transform-script';

export const transformationNodeForms: Record<string, NodeFormDefinition> = {
  'copy-key-value-pairs': nodeCopyKeyValuePairs,
  'delete-key-value-pairs': nodeDeleteKeyValuePairs,
  'json-path': nodeJsonPath,
  deduplication: nodeDeduplication,
  'change-originator': nodeChangeOriginator,
  'transform-script': nodeTransformScript,
  'rename-keys': nodeRenameKeys,
  'split-array-msg': {},
  'to-email': nodeToEmail,
};
