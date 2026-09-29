import type { NodeFormData, NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { VbenSegmented } from '@vben/common-ui';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { section, templateDescription } from '../shared/form-layout';
import ScriptInput from '../shared/script-input.vue';
import SeverityInput from '../shared/severity-input.vue';

export function createSchema(context: NodeFormData): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.useMessageAlarmData',
      label: $t('rule-chain.nodeAction.useMessageAlarmData'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        description: $t('rule-chain.actionUi.messageAlarmHelp'),
        title: $t('rule-chain.nodeAction.useMessageAlarmData'),
      },
    },
    {
      fieldName: 'configuration.overwriteAlarmDetails',
      label: $t('rule-chain.nodeAction.overwriteAlarmDetails'),
      formItemClass: 'sm:col-span-2',
      component: 'TbSwitch',
      hideLabel: true,
      componentProps: {
        title: $t('rule-chain.nodeAction.overwriteAlarmDetails'),
      },
      dependencies: {
        triggerFields: ['configuration.useMessageAlarmData'],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !!configuration.useMessageAlarmData,
        }),
      },
    },
    {
      ...section('_details', $t('rule-chain.actionUi.alarmDetails'), [
        {
          fieldName: 'configuration.scriptLang',
          label: $t('rule-chain.config.scriptLang'),
          hideLabel: true,
          formItemClass: 'sm:col-span-2',
          component: VbenSegmented,
          modelPropName: 'modelValue',
          rules: 'selectRequired',
          componentProps: {
            class: 'mx-auto w-full max-w-xs p-[2px]',
            'aria-label': $t('rule-chain.config.scriptLang'),
            tabs: [
              { label: 'JavaScript', value: 'JS' },
              { label: 'TBEL', value: 'TBEL' },
            ],
          },
          dependencies: {
            triggerFields: [
              'configuration.overwriteAlarmDetails',
              'configuration.useMessageAlarmData',
            ],
            resolve: ({ values: { configuration = {} } }) => ({
              if: !!(
                !configuration.useMessageAlarmData ||
                configuration.overwriteAlarmDetails
              ),
            }),
          },
        },
        {
          fieldName: 'configuration.alarmDetailsBuildJs',
          label: $t('rule-chain.config.alarmDetailsBuildJs'),
          formItemClass: 'sm:col-span-2',
          component: ScriptInput,
          hideLabel: true,
          modelPropName: 'modelValue',
          componentProps: {
            functionName: 'Details',
            language: 'JS',
            scriptType: 'json',
            nodeId: context.data?.id?.id,
          },
          rules: 'required',
          dependencies: {
            triggerFields: [
              'configuration.overwriteAlarmDetails',
              'configuration.scriptLang',
              'configuration.useMessageAlarmData',
            ],
            resolve: ({ values: { configuration = {} } }) => ({
              if: !!(
                (!configuration.useMessageAlarmData ||
                  configuration.overwriteAlarmDetails) &&
                configuration.scriptLang === 'JS'
              ),
            }),
          },
        },
        {
          fieldName: 'configuration.alarmDetailsBuildTbel',
          label: $t('rule-chain.config.alarmDetailsBuildTbel'),
          formItemClass: 'sm:col-span-2',
          component: ScriptInput,
          hideLabel: true,
          modelPropName: 'modelValue',
          componentProps: {
            functionName: 'Details',
            language: 'TBEL',
            scriptType: 'json',
            nodeId: context.data?.id?.id,
          },
          rules: 'required',
          dependencies: {
            triggerFields: [
              'configuration.overwriteAlarmDetails',
              'configuration.scriptLang',
              'configuration.useMessageAlarmData',
            ],
            resolve: ({ values: { configuration = {} } }) => ({
              if: !!(
                (!configuration.useMessageAlarmData ||
                  configuration.overwriteAlarmDetails) &&
                configuration.scriptLang !== 'JS'
              ),
            }),
          },
        },
      ]),
      dependencies: {
        triggerFields: [
          'configuration.useMessageAlarmData',
          'configuration.overwriteAlarmDetails',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if:
            !configuration.useMessageAlarmData ||
            configuration.overwriteAlarmDetails,
        }),
      },
    },
    {
      ...section('_alarm', $t('rule-chain.actionUi.alarmSettings'), [
        {
          fieldName: 'configuration.alarmType',
          label: $t('rule-chain.nodeAction.alarmType'),
          description: templateDescription,
          formItemClass: 'sm:col-span-2',
          component: 'VbenInput',
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.alarmType'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [
                $t('rule-chain.nodeAction.alarmType'),
              ]),
            ),
          dependencies: {
            triggerFields: ['configuration.useMessageAlarmData'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: !configuration.useMessageAlarmData,
            }),
          },
        },
        {
          fieldName: 'configuration.dynamicSeverity',
          label: $t('rule-chain.config.dynamicSeverity'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.config.dynamicSeverity') },
          dependencies: {
            triggerFields: ['configuration.useMessageAlarmData'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: !configuration.useMessageAlarmData,
            }),
          },
        },
        {
          fieldName: 'configuration.severity',
          label: $t('rule-chain.actionUi.alarmSeverity'),
          formItemClass: 'sm:col-span-2',
          component: SeverityInput,
          modelPropName: 'modelValue',
          rules: z
            .string({
              error: $t('ui.formRules.required', [
                $t('rule-chain.config.severity'),
              ]),
            })
            .trim()
            .min(
              1,
              $t('ui.formRules.required', [$t('rule-chain.config.severity')]),
            ),
          dependencies: {
            triggerFields: [
              'configuration.useMessageAlarmData',
              'configuration.dynamicSeverity',
            ],
            resolve: ({ values: { configuration = {} } }) => ({
              if: !configuration.useMessageAlarmData,
              componentProps: { dynamic: configuration.dynamicSeverity },
            }),
          },
        },
      ]),
      dependencies: {
        triggerFields: [
          'configuration.useMessageAlarmData',
          'configuration.overwriteAlarmDetails',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !configuration.useMessageAlarmData,
        }),
      },
    },
    {
      ...section('_propagation', $t('rule-chain.actionUi.alarmPropagation'), [
        {
          fieldName: 'configuration.propagate',
          label: $t('rule-chain.config.propagate'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: { title: $t('rule-chain.config.propagate') },
        },
        {
          fieldName: 'configuration.relationTypes',
          label: $t('rule-chain.config.relationTypes'),
          description: $t('rule-chain.actionUi.relationTypesHelp'),
          formItemClass: 'sm:col-span-2',
          component: 'Select',
          componentProps: { mode: 'tags' },
          dependencies: {
            triggerFields: ['configuration.propagate'],
            resolve: ({ values: { configuration = {} } }) => ({
              if: configuration.propagate === true,
            }),
          },
        },
        {
          fieldName: 'configuration.propagateToOwner',
          label: $t('rule-chain.nodeAction.propagateToOwner'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            title: $t('rule-chain.nodeAction.propagateToOwner'),
          },
        },
        {
          fieldName: 'configuration.propagateToTenant',
          label: $t('rule-chain.nodeAction.propagateToTenant'),
          formItemClass: 'sm:col-span-2',
          component: 'TbSwitch',
          hideLabel: true,
          componentProps: {
            title: $t('rule-chain.nodeAction.propagateToTenant'),
          },
        },
      ]),
      dependencies: {
        triggerFields: [
          'configuration.useMessageAlarmData',
          'configuration.overwriteAlarmDetails',
        ],
        resolve: ({ values: { configuration = {} } }) => ({
          if: !configuration.useMessageAlarmData,
        }),
      },
    },
  ];
}

export const definition = {
  createSchema,
  getValues(configuration) {
    return {
      ...configuration,
      scriptLang: configuration.scriptLang || 'JS',
      dynamicSeverity:
        configuration.dynamicSeverity ??
        !['CRITICAL', 'INDETERMINATE', 'MAJOR', 'MINOR', 'WARNING'].includes(
          configuration.severity || 'CRITICAL',
        ),
    };
  },
} satisfies NodeFormDefinition;
