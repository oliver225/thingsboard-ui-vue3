import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

import { createAttributeFields } from '../shared/attribute-fields';
import { section, templateHint } from '../shared/form-layout';

function createDeviceRelationFields(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.deviceRelationsQuery.direction',
      label: $t('rule-chain.config.deviceRelationsQuery_direction'),
      formItemClass: 'sm:col-span-1',
      component: 'VbenSelect',
      modelPropName: 'modelValue',
      rules: 'selectRequired',
      componentProps: {
        options: ['FROM', 'TO'].map((value) => ({
          value,
          label: $t(`rule-chain.config.options.${value}`),
        })),
      },
    },
    {
      fieldName: 'configuration.deviceRelationsQuery.maxLevel',
      label: $t('rule-chain.config.deviceRelationsQuery_maxLevel'),
      formItemClass: 'sm:col-span-1',
      component: 'InputNumber',
      rules: z.number().int().min(1),
      componentProps: { min: 1, precision: 0, step: 1 },
    },
    {
      fieldName: 'configuration.deviceRelationsQuery.fetchLastLevelOnly',
      label: $t('rule-chain.config.deviceRelationsQuery_fetchLastLevelOnly'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.config.descriptions.lastLevelDevices'),
        title: $t('rule-chain.config.deviceRelationsQuery_fetchLastLevelOnly'),
      },
    },
    {
      fieldName: 'configuration.deviceRelationsQuery.relationType',
      label: $t('rule-chain.config.deviceRelationsQuery_relationType'),
      formItemClass: 'sm:col-span-2',
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: z
        .string({
          error: $t('ui.formRules.required', [
            $t('rule-chain.config.deviceRelationsQuery_relationType'),
          ]),
        })
        .trim()
        .min(
          1,
          $t('ui.formRules.required', [
            $t('rule-chain.config.deviceRelationsQuery_relationType'),
          ]),
        ),
    },
    {
      fieldName: 'configuration.deviceRelationsQuery.deviceTypes',
      label: $t('rule-chain.config.deviceRelationsQuery_deviceTypes'),
      formItemClass: 'sm:col-span-2',
      component: 'EntityInput',
      rules: 'selectRequired',
      componentProps: {
        entityType: EntityType.DEVICE_PROFILE,
        multiple: true,
        valueField: 'name',
      },
    },
  ];
}

export function createSchema(): VbenFormSchema[] {
  const attributeFields = createAttributeFields();
  const failureFieldName = 'configuration.tellFailureIfAbsent';
  const sections = [
    {
      fieldName: '_deviceRelationsQuery',
      title: $t('rule-chain.nodeAction.deviceRelationsQuery'),
      fields: createDeviceRelationFields(),
    },
    {
      fieldName: '_relatedDeviceAttributes',
      title: $t('rule-chain.nodeAction.relatedDeviceAttributes'),
      fields: [
        templateHint(
          '_relatedDeviceAttributesHelp',
          $t('rule-chain.templateSyntax.allFields'),
        ),
        ...attributeFields.filter(
          (field) => field.fieldName !== failureFieldName,
        ),
      ],
    },
  ];

  return [
    ...sections.map(({ fieldName, title, fields }): VbenFormSchema =>
      section(fieldName, title, fields),
    ),
    ...attributeFields.filter((field) => field.fieldName === failureFieldName),
  ];
}

export const definition = {
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
