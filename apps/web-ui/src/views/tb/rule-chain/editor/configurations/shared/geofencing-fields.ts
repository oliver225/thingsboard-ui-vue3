import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { Alert } from 'antdv-next';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function createGeofencingFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.latitudeKeyName',
      label: $t('rule-chain.nodeAction.latitudeKeyName'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.latitudeKeyName'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.latitudeKeyName'),
          ]),
        ),
    },
    {
      fieldName: 'configuration.longitudeKeyName',
      label: $t('rule-chain.nodeAction.longitudeKeyName'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.longitudeKeyName'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.longitudeKeyName'),
          ]),
        ),
    },
    {
      fieldName: '_coordinateFieldsHelp',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      component: () =>
        h(Alert, {
          type: 'warning',
          showIcon: true,
          message: $t('rule-chain.nodeAction.coordinateFieldsHelp'),
        }),
    },
    {
      fieldName: 'configuration.perimeterType',
      label: $t('rule-chain.nodeAction.perimeterType'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['CIRCLE', 'POLYGON'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
    },
    {
      fieldName: 'configuration.fetchPerimeterInfoFromMessageMetadata',
      label: $t('rule-chain.config.fetchPerimeterInfoFromMessageMetadata'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        title: $t('rule-chain.config.fetchPerimeterInfoFromMessageMetadata'),
      },
      dependencies: {
        triggerFields: [
          'configuration.perimeterType',
          'configuration.perimeterKeyName',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          componentProps: {
            description: $t(
              configuration.perimeterType === 'CIRCLE'
                ? 'rule-chain.config.descriptions.circlePerimeter'
                : 'rule-chain.config.descriptions.polygonPerimeter',
              {
                perimeterKeyName:
                  configuration.perimeterKeyName || 'ss_perimeter',
                example:
                  '{"latitude":48.196, "longitude":24.6532, "radius":100.0, "radiusUnit":"METER"}',
              },
            ),
          },
        }),
      },
    },
    {
      fieldName: 'configuration.perimeterKeyName',
      label: $t('rule-chain.nodeAction.perimeterKeyName'),
      help: $t('rule-chain.nodeAction.perimeterKeyNameHelp'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.perimeterKeyName'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.nodeAction.perimeterKeyName'),
          ]),
        ),
      dependencies: {
        triggerFields: ['configuration.fetchPerimeterInfoFromMessageMetadata'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: configuration.fetchPerimeterInfoFromMessageMetadata === true,
        }),
      },
    },
    {
      fieldName: 'configuration.polygonsDefinition',
      label: $t('rule-chain.nodeAction.polygonsDefinition'),
      help: $t('rule-chain.nodeAction.polygonsDefinitionHelp'),
      formItemClass: 'sm:col-span-2',
      component: 'JsonEditor',
      componentProps: { height: 160 },
      rules: 'jsonArrayRequired',
      dependencies: {
        triggerFields: [
          'configuration.perimeterType',
          'configuration.fetchPerimeterInfoFromMessageMetadata',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!(
            !configuration.fetchPerimeterInfoFromMessageMetadata &&
            configuration.perimeterType === 'POLYGON'
          ),
        }),
      },
    },
    {
      fieldName: 'configuration.centerLatitude',
      label: $t('rule-chain.nodeAction.centerLatitude'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().min(-90).max(90),
      componentProps: { min: -90, max: 90 },
      dependencies: {
        triggerFields: [
          'configuration.perimeterType',
          'configuration.fetchPerimeterInfoFromMessageMetadata',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!(
            !configuration.fetchPerimeterInfoFromMessageMetadata &&
            configuration.perimeterType === 'CIRCLE'
          ),
        }),
      },
    },
    {
      fieldName: 'configuration.centerLongitude',
      label: $t('rule-chain.nodeAction.centerLongitude'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().min(-180).max(180),
      componentProps: { min: -180, max: 180 },
      dependencies: {
        triggerFields: [
          'configuration.perimeterType',
          'configuration.fetchPerimeterInfoFromMessageMetadata',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!(
            !configuration.fetchPerimeterInfoFromMessageMetadata &&
            configuration.perimeterType === 'CIRCLE'
          ),
        }),
      },
    },
    {
      fieldName: 'configuration.range',
      label: $t('rule-chain.nodeAction.range'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().min(0),
      componentProps: { min: 0 },
      dependencies: {
        triggerFields: [
          'configuration.perimeterType',
          'configuration.fetchPerimeterInfoFromMessageMetadata',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!(
            !configuration.fetchPerimeterInfoFromMessageMetadata &&
            configuration.perimeterType === 'CIRCLE'
          ),
        }),
      },
    },
    {
      fieldName: 'configuration.rangeUnit',
      label: $t('rule-chain.nodeAction.rangeUnit'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['METER', 'KILOMETER', 'FOOT', 'MILE', 'NAUTICAL_MILE'].map(
          (value) => ({
            value,
            label: $t(`rule-chain.actionUi.${value}`),
          }),
        ),
      },
      dependencies: {
        triggerFields: [
          'configuration.perimeterType',
          'configuration.fetchPerimeterInfoFromMessageMetadata',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!(
            !configuration.fetchPerimeterInfoFromMessageMetadata &&
            configuration.perimeterType === 'CIRCLE'
          ),
        }),
      },
    },
  ];
}
