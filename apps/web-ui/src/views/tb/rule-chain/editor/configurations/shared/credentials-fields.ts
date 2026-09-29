import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import FileTextInput from './file-text-input.vue';
import { requiredText } from './form-fields';

export function createCredentialsFields({
  azure = false,
  rest = false,
} = {}): VbenFormSchema[] {
  return [
    {
      fieldName: 'configuration.credentials.type',
      label: $t('rule-chain.config.credentials_type'),
      formItemClass: 'sm:col-span-2',
      component: 'Select',
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['configuration.useSimpleClientHttpFactory'],
        resolve: ({ values: { configuration } }) => ({
          componentProps: {
            options: (azure
              ? ['sas', 'cert.PEM']
              : ['anonymous', 'basic', 'cert.PEM']
            ).map((value) => ({
              value,
              label: $t(
                `rule-chain.externalUi.credentials.${value === 'cert.PEM' ? 'certificate' : value}`,
              ),
              disabled:
                rest &&
                value === 'cert.PEM' &&
                configuration.useSimpleClientHttpFactory,
            })),
          },
        }),
      },
    },
    ...(azure
      ? [
          {
            fieldName: 'configuration.credentials.sasKey',
            label: $t('rule-chain.config.credentials_sasKey'),
            formItemClass: 'sm:col-span-2',
            component: 'InputPassword',
            componentProps: { autocomplete: 'new-password' },
            rules: requiredText('rule-chain.config.credentials_sasKey'),
            dependencies: {
              triggerFields: ['configuration.credentials.type'],
              resolve: ({ values: { configuration } }) => ({
                if: configuration.credentials?.type === 'sas',
              }),
            },
          } satisfies VbenFormSchema,
        ]
      : [
          {
            fieldName: 'configuration.credentials.username',
            label: $t('rule-chain.config.credentials_username'),
            formItemClass: 'sm:col-span-2',
            component: 'VbenInput',
            modelPropName: 'modelValue',
            rules: requiredText('rule-chain.config.credentials_username'),
            dependencies: {
              triggerFields: ['configuration.credentials.type'],
              resolve: ({ values: { configuration } }) => ({
                if: configuration.credentials?.type === 'basic',
              }),
            },
          } satisfies VbenFormSchema,
        ]),
    ...['caCert', 'cert', 'privateKey'].map((key): VbenFormSchema => ({
      fieldName: `configuration.credentials.${key}`,
      label: $t(`rule-chain.config.credentials_${key}`),
      formItemClass: 'sm:col-span-2',
      component: FileTextInput,
      modelPropName: 'modelValue',
      rules:
        azure && key !== 'caCert'
          ? requiredText(`rule-chain.config.credentials_${key}`)
          : undefined,
      dependencies: {
        triggerFields: [
          'configuration.credentials.type',
          `configuration.credentials.${key}FileName`,
        ],
        resolve: ({ values: { configuration }, controller }) => ({
          if:
            configuration.credentials?.type === 'cert.PEM' ||
            (azure && key === 'caCert'),
          componentProps: {
            fileName: configuration.credentials?.[`${key}FileName`],
            onSelect: (name: string) =>
              controller.setFieldValue(
                `configuration.credentials.${key}FileName`,
                name,
              ),
          },
        }),
      },
    })),
    {
      fieldName: 'configuration.credentials.password',
      label: $t('rule-chain.config.credentials_password'),
      formItemClass: 'sm:col-span-2',
      component: 'InputPassword',
      componentProps: { autocomplete: 'new-password' },
      dependencies: {
        triggerFields: ['configuration.credentials.type'],
        resolve: ({ values: { configuration } }) => ({
          if: ['basic', 'cert.PEM'].includes(configuration.credentials?.type),
          rules:
            rest && configuration.credentials?.type === 'basic'
              ? 'required'
              : undefined,
        }),
      },
    },
  ];
}
