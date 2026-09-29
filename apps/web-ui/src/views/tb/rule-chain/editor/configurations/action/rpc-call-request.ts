import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.timeoutInSeconds',
      label: $t('rule-chain.config.timeoutInSeconds'),
      formItemClass: 'sm:col-span-2',
      component: 'SecondsInput',
      rules: z.number().int().min(0),
      componentProps: { min: 0 },
    },
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
