import type { AiModelConnectionValues, AiModelFormValues } from './form-data';

import type { VbenFormSchema } from '#/adapter/form';
import type { AiProvider } from '#/enums';

import { z } from '#/adapter/form';
import { aiProviderLabel, AiProvider as Provider } from '#/enums';
import { $t } from '#/locales';

import {
  getModelParameterRange,
  isRequiredProviderField,
  modelFields,
  modelSuggestions,
  providerFields,
  secretFields,
} from './config';
import { isServiceAccountKeyValid } from './form-data';

function requiredText() {
  return z
    .string()
    .trim()
    .min(1, $t('settings.features.ai.validation.required'));
}

export function createGeneralSchema(
  provider: AiProvider,
): VbenFormSchema<AiModelFormValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: $t('settings.features.ai.form.namePlaceholder'),
      },
      fieldName: 'name',
      label: $t('settings.features.ai.fields.name'),
      defaultValue: '',
      rules: requiredText().max(
        255,
        $t('settings.features.ai.validation.nameLength'),
      ),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: Object.values(Provider).map((value) => ({
          value,
          label: aiProviderLabel(value),
        })),
      },
      fieldName: 'provider',
      label: $t('settings.features.ai.fields.provider'),
      defaultValue: Provider.OPENAI,
      rules: z.nativeEnum(Provider),
    },
    {
      component: 'AutoComplete',
      componentProps: {
        options: modelSuggestions[provider].map((value) => ({ value })),
        filterOption: (input: string, option: { value: string }) =>
          option.value.toLowerCase().includes(input.toLowerCase()),
        placeholder: $t('settings.features.ai.form.modelIdPlaceholder'),
      },
      fieldName: 'modelId',
      label: $t('settings.features.ai.fields.modelId'),
      formItemClass: 'sm:col-span-2',
      defaultValue: '',
      help: $t('settings.features.ai.form.modelIdHelp'),
      rules: requiredText(),
    },
  ];
}

export function createConnectionSchema(
  provider: AiProvider,
): VbenFormSchema<AiModelConnectionValues>[] {
  const schema: VbenFormSchema<AiModelConnectionValues>[] = providerFields[
    provider
  ].map((field) => {
    let component: 'Textarea' | 'VbenInput' | 'VbenInputPassword' =
      secretFields.has(field) ? 'VbenInputPassword' : 'VbenInput';
    if (field === 'serviceAccountKey') component = 'Textarea';
    return {
      component,
      componentProps:
        field === 'serviceAccountKey'
          ? {
              rows: 5,
              class: 'font-mono text-xs',
              spellcheck: false,
              placeholder: $t(
                'settings.features.ai.form.serviceAccountPlaceholder',
              ),
            }
          : { autocomplete: secretFields.has(field) ? 'new-password' : 'off' },
      fieldName: field,
      label: $t(`settings.features.ai.fields.${field}`),
      defaultValue: '',
      formItemClass: ['baseUrl', 'endpoint', 'serviceAccountKey'].includes(
        field,
      )
        ? 'sm:col-span-2'
        : '',
      help:
        field === 'apiKey' && provider === Provider.OPENAI
          ? $t('settings.features.ai.form.apiKeyHelp')
          : undefined,
      dependencies: {
        triggerFields: ['baseUrl'],
        resolve: ({ values: formValues }) => {
          const required = isRequiredProviderField(
            provider,
            field,
            formValues.baseUrl,
          );
          let rules = required ? requiredText() : z.string().trim().optional();
          if (field === 'serviceAccountKey') {
            rules = requiredText().refine(
              isServiceAccountKeyValid,
              $t('settings.features.ai.validation.serviceAccount'),
            );
          }
          return { required, rules };
        },
      },
    };
  });
  if (provider === Provider.OLLAMA) {
    schema.push({
      component: 'VbenSelect',
      componentProps: {
        options: ['NONE', 'BASIC', 'TOKEN'].map((value) => ({
          value,
          label: $t(`settings.features.ai.authType.${value}`),
        })),
      },
      fieldName: 'authType',
      label: $t('settings.features.ai.fields.authentication'),
      formItemClass: 'sm:col-span-2',
      defaultValue: 'NONE',
      rules: z.enum(['NONE', 'BASIC', 'TOKEN']),
    });
    for (const field of ['username', 'password', 'token'] as const) {
      schema.push({
        component: field === 'username' ? 'VbenInput' : 'VbenInputPassword',
        componentProps: {
          autocomplete: field === 'username' ? 'off' : 'new-password',
        },
        fieldName: field,
        label: $t(`settings.features.ai.fields.${field}`),
        defaultValue: '',
        formItemClass: field === 'token' ? 'sm:col-span-2' : '',
        dependencies: {
          triggerFields: ['authType'],
          resolve: ({ values: formValues }) => ({
            if: formValues.authType === (field === 'token' ? 'TOKEN' : 'BASIC'),
            required: true,
            rules: requiredText(),
          }),
        },
      });
    }
  }
  return schema;
}

export function createParametersSchema(
  provider: AiProvider,
): VbenFormSchema<AiModelFormValues>[] {
  return modelFields[provider].map((field) => {
    const range = getModelParameterRange(field);
    let rule = z.number({
      message: $t('settings.features.ai.validation.number'),
    });
    if (range.min !== undefined)
      rule = rule.min(
        range.min,
        $t('settings.features.ai.validation.min', { min: range.min }),
      );
    if (range.max !== undefined)
      rule = rule.max(
        range.max,
        $t('settings.features.ai.validation.max', { max: range.max }),
      );
    if (range.precision === 0)
      rule = rule.int($t('settings.features.ai.validation.integer'));
    return {
      component: 'InputNumber',
      componentProps: {
        ...range,
        placeholder: $t('settings.features.ai.form.providerDefault'),
      },
      fieldName: field,
      label: $t(`settings.features.ai.fields.${field}`),
      defaultValue: null,
      rules: rule.nullish(),
    };
  });
}
