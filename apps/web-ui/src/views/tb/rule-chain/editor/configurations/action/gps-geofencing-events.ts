import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { hint, section } from '../shared/form-layout';
import { createGeofencingFields } from '../shared/geofencing-fields';
import PresenceStrategy from '../shared/presence-strategy.vue';

export function createSchema(): VbenFormSchema[] {
  return [
    section('_coordinates', $t('rule-chain.actionUi.coordinateFields'), [
      ...createGeofencingFields().slice(0, 3),
    ]),
    section('_geofence', $t('rule-chain.actionUi.geofence'), [
      ...createGeofencingFields().slice(3),
    ]),
    section('_presence', $t('rule-chain.actionUi.presenceStrategy'), [
      {
        fieldName: 'configuration.reportPresenceStatusOnEachMessage',
        hideLabel: true,
        formItemClass: 'sm:col-span-2',
        component: PresenceStrategy,
        modelPropName: 'modelValue',
      },
      {
        ...hint('_presenceHelp', ''),
        dependencies: {
          triggerFields: ['configuration.reportPresenceStatusOnEachMessage'],
          resolve: ({ values: { configuration = {} } }) => ({
            componentProps: {
              message: $t(
                configuration.reportPresenceStatusOnEachMessage
                  ? 'rule-chain.config.descriptions.presenceOnEachMessage'
                  : 'rule-chain.config.descriptions.presenceOnFirstMessage',
              ),
            },
          }),
        },
      },
      {
        fieldName: 'configuration.minInsideDuration',
        label: $t('rule-chain.nodeAction.minInsideDuration'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(1).max(2_147_483_647),
        componentProps: { min: 1, max: 2_147_483_647, precision: 0, step: 1 },
        dependencies: {
          triggerFields: ['configuration.reportPresenceStatusOnEachMessage'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: !configuration.reportPresenceStatusOnEachMessage,
          }),
        },
      },
      {
        fieldName: 'configuration.minInsideDurationTimeUnit',
        label: $t('rule-chain.nodeAction.minInsideDurationTimeUnit'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: ['MILLISECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS'].map(
            (value) => ({
              value,
              label: $t(`rule-chain.config.options.${value}`),
            }),
          ),
        },
        dependencies: {
          triggerFields: ['configuration.reportPresenceStatusOnEachMessage'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: !configuration.reportPresenceStatusOnEachMessage,
          }),
        },
      },
      {
        fieldName: 'configuration.minOutsideDuration',
        label: $t('rule-chain.nodeAction.minOutsideDuration'),
        formItemClass: 'sm:col-span-1',
        component: 'InputNumber',
        rules: z.number().int().min(1).max(2_147_483_647),
        componentProps: { min: 1, max: 2_147_483_647, precision: 0, step: 1 },
        dependencies: {
          triggerFields: ['configuration.reportPresenceStatusOnEachMessage'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: !configuration.reportPresenceStatusOnEachMessage,
          }),
        },
      },
      {
        fieldName: 'configuration.minOutsideDurationTimeUnit',
        label: $t('rule-chain.nodeAction.minOutsideDurationTimeUnit'),
        formItemClass: 'sm:col-span-1',
        component: 'VbenSelect',
        modelPropName: 'modelValue',
        rules: 'selectRequired',
        componentProps: {
          options: ['MILLISECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS'].map(
            (value) => ({
              value,
              label: $t(`rule-chain.config.options.${value}`),
            }),
          ),
        },
        dependencies: {
          triggerFields: ['configuration.reportPresenceStatusOnEachMessage'],
          resolve: ({ values: { configuration = {} } }) => ({
            if: !configuration.reportPresenceStatusOnEachMessage,
          }),
        },
      },
    ]),
  ];
}

export const definition = {
  createSchema,
} satisfies NodeFormDefinition;
