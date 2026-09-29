import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { createGeofencingFields } from '../shared/geofencing-fields';

export function createSchema(): VbenFormSchema[] {
  return [...createGeofencingFields()];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
