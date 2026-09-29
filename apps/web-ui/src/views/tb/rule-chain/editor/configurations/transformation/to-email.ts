import type { SelectProps } from 'antdv-next';

import type { NodeFormDefinition } from '../../types';

import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import {
  section,
  templateDescription,
  templateHint,
} from '../shared/form-layout';

function textField(
  name: string,
  labelKey: string,
  required = false,
): VbenFormSchema {
  const label = $t(labelKey);
  return {
    fieldName: `configuration.${name}`,
    label,
    formItemClass: 'sm:col-span-2',
    component: 'Textarea',
    componentProps: { autoSize: { minRows: 1, maxRows: 6 } },
    ...(required
      ? {
          rules: z
            .string({ error: $t('ui.formRules.required', [label]) })
            .trim()
            .min(1, $t('ui.formRules.required', [label])),
        }
      : {}),
  };
}

export function createSchema(): VbenFormSchema[] {
  const sections = [
    {
      fieldName: '_emailSender',
      title: $t('rule-chain.nodeAction.emailSender'),
      contentClass: 'grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-2',
      fields: [
        {
          ...textField('fromTemplate', 'rule-chain.config.fromTemplate', true),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          componentProps: {},
          description: templateDescription,
        } satisfies VbenFormSchema,
      ],
    },
    {
      fieldName: '_emailRecipients',
      title: $t('rule-chain.nodeAction.recipients'),
      contentClass: 'grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-3',
      fields: [
        templateHint(
          '_emailRecipientsHelp',
          $t('rule-chain.templateSyntax.recipients'),
        ),
        ...['toTemplate', 'ccTemplate', 'bccTemplate'].map((name) => ({
          ...textField(
            name,
            `rule-chain.config.${name}`,
            name === 'toTemplate',
          ),
          formItemClass: 'sm:col-span-1',
        })),
      ],
    },
    {
      fieldName: '_emailContent',
      title: $t('rule-chain.nodeAction.subjectBody'),
      contentClass: 'grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-2',
      fields: [
        templateHint(
          '_emailContentHelp',
          $t('rule-chain.templateSyntax.allFields'),
        ),
        textField('subjectTemplate', 'rule-chain.config.subjectTemplate', true),
        {
          fieldName: 'configuration.mailBodyType',
          label: $t('rule-chain.nodeAction.mailBodyType'),
          formItemClass: 'sm:col-span-2',
          component: 'Select',
          rules: 'selectRequired',
          componentProps: {
            options: [
              {
                value: 'false',
                label: 'plainText',
                description: 'plainTextHelp',
              },
              { value: 'true', label: 'html', description: 'htmlHelp' },
              {
                value: 'dynamic',
                label: 'useBodyTypeTemplate',
                description: 'useBodyTypeTemplateHelp',
              },
            ].map(({ value, label, description }) => ({
              value,
              label: $t(`rule-chain.nodeAction.${label}`),
              description: $t(`rule-chain.nodeAction.${description}`),
            })),
            optionRender: (({ option }) =>
              h('div', { class: 'flex flex-col gap-1 py-1' }, [
                h('span', String(option.data.label ?? '')),
                h(
                  'span',
                  { class: 'text-muted-foreground whitespace-normal text-xs' },
                  option.data.description,
                ),
              ])) satisfies NonNullable<SelectProps['optionRender']>,
          },
        } satisfies VbenFormSchema,
        {
          ...textField(
            'isHtmlTemplate',
            'rule-chain.config.isHtmlTemplate',
            true,
          ),
          component: 'VbenInput',
          modelPropName: 'modelValue',
          componentProps: {},
          description: $t('rule-chain.config.emailBodyTypeHelp'),
          dependencies: {
            triggerFields: ['configuration.mailBodyType'],
            resolve: ({ values: { configuration } }) => ({
              if: configuration.mailBodyType === 'dynamic',
            }),
          },
        } satisfies VbenFormSchema,
        {
          ...textField(
            'bodyTemplate',
            'rule-chain.nodeAction.bodyTemplate',
            true,
          ),
          componentProps: { autoSize: { minRows: 4, maxRows: 16 } },
        },
      ],
    },
  ];
  return sections.map(({ fieldName, title, contentClass, fields }) =>
    section(fieldName, title, fields, { contentClass }),
  );
}

export const definition = {
  createSchema,
  getValues(configuration) {
    const isHtmlTemplate = configuration.isHtmlTemplate;
    let defaultBodyType = 'false';
    if (isHtmlTemplate === 'true') {
      defaultBodyType = 'true';
    } else if (isHtmlTemplate && isHtmlTemplate !== 'false') {
      defaultBodyType = 'dynamic';
    }
    return {
      ...configuration,
      mailBodyType: configuration.mailBodyType ?? defaultBodyType,
    };
  },
  toConfiguration(configuration) {
    return {
      ...configuration,
      isHtmlTemplate:
        configuration.mailBodyType === 'dynamic'
          ? configuration.isHtmlTemplate
          : configuration.mailBodyType,
    };
  },
} satisfies NodeFormDefinition;
