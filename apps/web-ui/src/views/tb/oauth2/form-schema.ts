import type {
  ClientFormValues,
  ClientGeneralFormValues,
  ClientMapperFormValues,
} from './form-data';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

function createRequiredRule(label: string, max?: number) {
  const message = $t('oauth2.validation.required', { field: label });
  const rule = z
    .string({ error: message })
    .refine((value) => !!value.trim(), { message });
  return max
    ? rule.max(max, { message: $t('oauth2.validation.maxLength', { max }) })
    : rule;
}

function createUrlRule(required = false, max?: number) {
  const rule = z.string({ error: $t('oauth2.validation.invalidUrl') }).refine(
    (value) => {
      if (!value) return !required;
      if (value.trim() !== value || (max && value.length > max)) return false;
      try {
        const url = new URL(value);
        return !!url.hostname && ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    },
    { message: $t('oauth2.validation.invalidUrl') },
  );
  return required ? rule : rule.nullish();
}

function createOptionalRule(max: number) {
  return z
    .string()
    .max(max, {
      message: $t('oauth2.validation.maxLength', { max }),
    })
    .nullish();
}

export function createClientFormSchema(
  providerOptions: () => { label: string; value: string }[],
  platformOptions: () => { label: string; value: string }[],
): VbenFormSchema<ClientFormValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 100,
        placeholder: $t('oauth2.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      formItemClass: 'sm:col-span-2',
      fieldName: 'title',
      label: $t('oauth2.fields.title'),
      rules: createRequiredRule($t('oauth2.fields.title'), 100),
    },
    {
      component: 'VbenSelect',
      componentProps: () => ({ options: providerOptions() }),
      defaultValue: 'Custom',
      fieldName: 'additionalInfo.providerName',
      label: $t('oauth2.fields.provider'),
      rules: createRequiredRule($t('oauth2.fields.provider')),
    },
    {
      component: 'Select',
      componentProps: () => ({
        mode: 'multiple',
        allowClear: true,
        options: platformOptions(),
        placeholder: $t('oauth2.features.form.allPlatforms'),
      }),
      defaultValue: [],
      description: $t('oauth2.features.form.platformHint'),
      fieldName: 'platforms',
      label: $t('oauth2.fields.platforms'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        autocomplete: 'off',
        placeholder: $t('oauth2.features.form.clientIdPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'clientId',
      label: $t('oauth2.fields.clientId'),
      rules: createRequiredRule($t('oauth2.fields.clientId'), 255),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        maxlength: 2048,
        autocomplete: 'new-password',
        placeholder: $t('oauth2.features.form.clientSecretPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'clientSecret',
      label: $t('oauth2.fields.clientSecret'),
      rules: createRequiredRule($t('oauth2.fields.clientSecret'), 2048),
    },
  ];
}

export function createGeneralFormSchema(): VbenFormSchema<ClientGeneralFormValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: { placeholder: 'https://example.com/oauth/token' },
      defaultValue: '',
      fieldName: 'accessTokenUri',
      label: $t('oauth2.fields.accessTokenUri'),
      rules: createUrlRule(true),
    },
    {
      component: 'VbenInput',
      componentProps: { placeholder: 'https://example.com/oauth/authorize' },
      defaultValue: '',
      fieldName: 'authorizationUri',
      label: $t('oauth2.fields.authorizationUri'),
      rules: createUrlRule(true),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'https://example.com/.well-known/jwks.json',
      },
      defaultValue: '',
      fieldName: 'jwkSetUri',
      label: $t('oauth2.fields.jwkSetUri'),
      rules: createUrlRule(),
    },
    {
      component: 'VbenInput',
      componentProps: { placeholder: 'https://example.com/userinfo' },
      defaultValue: '',
      fieldName: 'userInfoUri',
      label: $t('oauth2.fields.userInfoUri'),
      rules: createUrlRule(),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'BASIC', label: 'BASIC' },
          { value: 'NONE', label: $t('oauth2.options.authenticationNone') },
        ],
      },
      defaultValue: 'POST',
      formItemClass: 'sm:col-span-2',
      fieldName: 'clientAuthenticationMethod',
      label: $t('oauth2.fields.clientAuthenticationMethod'),
      rules: z.enum(['POST', 'BASIC', 'NONE'], {
        error: $t('oauth2.validation.authenticationMethodRequired'),
      }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('oauth2.features.form.loginButtonLabelPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'loginButtonLabel',
      label: $t('oauth2.fields.loginButtonLabel'),
      rules: createRequiredRule($t('oauth2.fields.loginButtonLabel')),
    },
    {
      component: 'IconPicker',
      defaultValue: '',
      fieldName: 'loginButtonIcon',
      label: $t('oauth2.fields.loginButtonIcon'),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('oauth2.fields.allowUserCreation') },
      defaultValue: true,
      formItemClass: 'sm:col-span-2',
      fieldName: 'allowUserCreation',
      hideLabel: true,
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('oauth2.fields.activateUser') },
      defaultValue: false,
      formItemClass: 'sm:col-span-2',
      fieldName: 'activateUser',
      hideLabel: true,
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'tags',
        tokenSeparators: [',', ' '],
        placeholder: $t('oauth2.features.form.scopeHint'),
      },
      defaultValue: [],
      formItemClass: 'sm:col-span-2',
      fieldName: 'scope',
      label: $t('oauth2.fields.scope'),
      rules: z
        .array(z.string().trim().min(1), {
          error: $t('oauth2.validation.scopeRequired'),
        })
        .min(1, { message: $t('oauth2.validation.scopeRequired') }),
    },
  ];
}

export function createMapperFormSchema(): VbenFormSchema<ClientMapperFormValues>[] {
  return [
    {
      component: 'VbenInput',
      defaultValue: 'email',
      formItemClass: 'sm:col-span-2',
      fieldName: 'userNameAttributeName',
      label: $t('oauth2.fields.userNameAttributeName'),
      rules: createRequiredRule($t('oauth2.fields.userNameAttributeName')),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          { value: 'BASIC', label: $t('oauth2.options.mapperBasic') },
          { value: 'CUSTOM', label: $t('oauth2.options.mapperCustom') },
          { value: 'GITHUB', label: 'GitHub' },
          { value: 'APPLE', label: 'Apple' },
        ],
      },
      defaultValue: 'BASIC',
      fieldName: 'mapperConfig.type',
      label: $t('oauth2.fields.mapperType'),
      formItemClass: 'sm:col-span-2',
      rules: z.enum(['BASIC', 'CUSTOM', 'GITHUB', 'APPLE'], {
        error: $t('oauth2.validation.mapperTypeRequired'),
      }),
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 31 },
      defaultValue: 'email',
      dependencies: {
        if: (values) =>
          !['CUSTOM', 'GITHUB'].includes(values.mapperConfig?.type ?? ''),
        triggerFields: ['mapperConfig.type'],
      },
      formItemClass: 'sm:col-span-2',
      fieldName: 'mapperConfig.basic.emailAttributeKey',
      label: $t('oauth2.fields.emailAttributeKey'),
      rules: createRequiredRule($t('oauth2.fields.emailAttributeKey'), 31),
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 31 },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type !== 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.basic.firstNameAttributeKey',
      label: $t('oauth2.fields.firstNameAttributeKey'),
      rules: createOptionalRule(31),
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 31 },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type !== 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.basic.lastNameAttributeKey',
      label: $t('oauth2.fields.lastNameAttributeKey'),
      rules: createOptionalRule(31),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          { value: 'DOMAIN', label: $t('oauth2.options.tenantDomain') },
          { value: 'EMAIL', label: $t('oauth2.options.tenantEmail') },
          { value: 'CUSTOM', label: $t('oauth2.options.tenantCustom') },
        ],
      },
      defaultValue: 'DOMAIN',
      dependencies: {
        if: (values) => values.mapperConfig?.type !== 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      formItemClass: 'sm:col-span-2',
      fieldName: 'mapperConfig.basic.tenantNameStrategy',
      label: $t('oauth2.fields.tenantNameStrategy'),
      rules: z.enum(['DOMAIN', 'EMAIL', 'CUSTOM'], {
        error: $t('oauth2.validation.tenantNameStrategyRequired'),
      }),
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 255 },
      defaultValue: '',
      dependencies: {
        if: (values) =>
          values.mapperConfig?.type !== 'CUSTOM' &&
          values.mapperConfig?.basic?.tenantNameStrategy === 'CUSTOM',
        triggerFields: [
          'mapperConfig.type',
          'mapperConfig.basic.tenantNameStrategy',
        ],
      },
      formItemClass: 'sm:col-span-2',
      fieldName: 'mapperConfig.basic.tenantNamePattern',
      label: $t('oauth2.fields.tenantNamePattern'),
      rules: createRequiredRule($t('oauth2.fields.tenantNamePattern'), 255),
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 255 },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type !== 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      formItemClass: 'sm:col-span-2',
      fieldName: 'mapperConfig.basic.customerNamePattern',
      label: $t('oauth2.fields.customerNamePattern'),
      rules: createOptionalRule(255),
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 255 },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type !== 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.basic.defaultDashboardName',
      label: $t('oauth2.fields.defaultDashboardName'),
      rules: createOptionalRule(255),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('oauth2.fields.alwaysFullScreen') },
      defaultValue: false,
      dependencies: {
        if: (values) => values.mapperConfig?.type !== 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.basic.alwaysFullScreen',
      hideLabel: true,
      formItemClass: 'sm:self-end',
    },
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: 'https://example.com/oauth/mapper',
      },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type === 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.custom.url',
      label: $t('oauth2.fields.mapperUrl'),
      rules: createUrlRule(true, 255),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: { maxlength: 255, autocomplete: 'off' },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type === 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.custom.username',
      label: $t('oauth2.fields.username'),
      rules: createOptionalRule(255),
    },
    {
      component: 'VbenInputPassword',
      componentProps: { maxlength: 255, autocomplete: 'new-password' },
      defaultValue: '',
      dependencies: {
        if: (values) => values.mapperConfig?.type === 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.custom.password',
      label: $t('oauth2.fields.password'),
      rules: createOptionalRule(255),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('oauth2.fields.sendToken') },
      defaultValue: false,
      dependencies: {
        if: (values) => values.mapperConfig?.type === 'CUSTOM',
        triggerFields: ['mapperConfig.type'],
      },
      fieldName: 'mapperConfig.custom.sendToken',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    },
  ];
}
