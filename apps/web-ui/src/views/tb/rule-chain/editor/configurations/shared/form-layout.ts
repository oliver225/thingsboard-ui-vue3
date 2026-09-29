import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { Alert } from 'antdv-next';

import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import TemplateHint from './template-hint.vue';

export function section(
  fieldName: string,
  title: string,
  fields: VbenFormSchema[],
  options: {
    collapsible?: boolean;
    columns?: 2 | 3;
    contentClass?: string;
    description?: string;
    template?: boolean;
  } = {},
): VbenFormSchema {
  return {
    fieldName,
    hideLabel: true,
    formItemClass: 'sm:col-span-2',
    component: () =>
      h(
        FormSection,
        {
          title,
          size: 'small',
          collapsible: options.collapsible,
          description: options.description,
          contentClass:
            options.contentClass ??
            (options.columns === 3
              ? 'grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-3'
              : 'grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-2'),
        },
        {
          default: () => [
            options.template &&
              h(TemplateHint, { class: 'col-span-full mb-4' }),
            fields.map((schema) =>
              h(FormField, { key: schema.fieldName, schema }),
            ),
          ],
        },
      ),
  };
}

export function hint(fieldName: string, message: string): VbenFormSchema {
  return {
    fieldName,
    hideLabel: true,
    formItemClass: 'sm:col-span-2',
    component: Alert,
    componentProps: { type: 'warning', showIcon: true, message },
  };
}

export function templateDescription() {
  return h(TemplateHint);
}

export function templateHint(
  fieldName = '_templateHint',
  scope?: string,
): VbenFormSchema {
  return {
    fieldName,
    hideLabel: true,
    formItemClass: 'col-span-full',
    component: TemplateHint,
    componentProps: { scope },
  };
}

export function scopeOptions() {
  return ['CLIENT_SCOPE', 'SHARED_SCOPE', 'SERVER_SCOPE'].map((value) => ({
    value,
    label: $t(`rule-chain.actionUi.${value}`),
  }));
}
