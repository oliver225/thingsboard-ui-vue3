import type {
  MobileApplicationBasicValues,
  MobileApplicationStoreValues,
  MobileApplicationVersionValues,
} from './form-data';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z\d-.]+)?(\+[a-zA-Z\d-.]+)?$/;
const fingerprintPattern = /^[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){31}$/;
const appIdPattern = /^[A-Z0-9]{10}\.[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/;
const storePatterns = {
  ANDROID:
    /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=[a-zA-Z0-9._]+(?:&[a-zA-Z0-9._-]+=[a-zA-Z0-9._%-]*)*$/,
  IOS: /^https?:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d{7,10}(?:\?[^\s]*)?$/,
};

function createPatternRule(
  pattern: RegExp,
  message: string,
  requiredMessage?: string,
) {
  const rule = z.string({ error: requiredMessage ?? message });
  return requiredMessage
    ? rule.min(1, { message: requiredMessage }).regex(pattern, { message })
    : rule.regex(pattern, { message }).nullish().or(z.literal(''));
}

export function createFormSchema(): VbenFormSchema<MobileApplicationBasicValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: 'org.example.app',
        autocomplete: 'off',
      },
      defaultValue: '',
      fieldName: 'pkgName',
      label: $t('mobile-center.features.application.fields.pkgName'),
      rules: z
        .string({
          error: $t(
            'mobile-center.features.application.validation.packageRequired',
          ),
        })
        .trim()
        .min(1, {
          message: $t(
            'mobile-center.features.application.validation.packageRequired',
          ),
        })
        .max(255, {
          message: $t(
            'mobile-center.features.application.validation.maxLength',
            {
              max: 255,
            },
          ),
        })
        .regex(/^[a-zA-Z][a-zA-Z\d_]*(?:\.[a-zA-Z][a-zA-Z\d_]*)+$/, {
          message: $t(
            'mobile-center.features.application.validation.packageInvalid',
          ),
        }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: $t(
          'mobile-center.features.application.form.titlePlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('mobile-center.features.application.fields.title'),
      rules: z
        .string()
        .max(255, {
          message: $t(
            'mobile-center.features.application.validation.maxLength',
            {
              max: 255,
            },
          ),
        })
        .nullish(),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          { label: 'Android', value: 'ANDROID' },
          { label: 'iOS', value: 'IOS' },
        ],
      },
      defaultValue: 'ANDROID',
      fieldName: 'platformType',
      label: $t('mobile-center.features.application.fields.platform'),
      rules: z.enum(['ANDROID', 'IOS'], {
        error: $t(
          'mobile-center.features.application.validation.platformRequired',
        ),
      }),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          { value: 'DRAFT', label: $t('mobile-center.options.status.DRAFT') },
          {
            value: 'PUBLISHED',
            label: $t('mobile-center.options.status.PUBLISHED'),
          },
          {
            value: 'DEPRECATED',
            label: $t('mobile-center.options.status.DEPRECATED'),
          },
          {
            value: 'SUSPENDED',
            label: $t('mobile-center.options.status.SUSPENDED'),
          },
        ],
      },
      defaultValue: 'DRAFT',
      fieldName: 'status',
      label: $t('mobile-center.features.application.fields.status'),
      rules: z.enum(['DRAFT', 'PUBLISHED', 'DEPRECATED', 'SUSPENDED'], {
        error: $t(
          'mobile-center.features.application.validation.statusRequired',
        ),
      }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        autocomplete: 'new-password',
        placeholder: $t(
          'mobile-center.features.application.form.secretPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'appSecret',
      label: $t('mobile-center.features.application.fields.secret'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string({
          error: $t(
            'mobile-center.features.application.validation.secretRequired',
          ),
        })
        .min(1, {
          message: $t(
            'mobile-center.features.application.validation.secretRequired',
          ),
        })
        .refine(
          (value) => {
            if (!value) return true;
            try {
              return atob(value).length >= 64;
            } catch {
              return false;
            }
          },
          {
            message: $t(
              'mobile-center.features.application.validation.secretInvalid',
            ),
          },
        ),
    },
  ];
}
export function createVersionFormSchema(): VbenFormSchema<MobileApplicationVersionValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: { placeholder: '1.0.0' },
      defaultValue: '',
      fieldName: 'minVersion',
      label: $t('mobile-center.features.application.fields.minVersion'),
      rules: createPatternRule(
        versionPattern,
        $t('mobile-center.features.application.validation.versionInvalid'),
      ),
    },
    {
      component: 'VbenInput',
      componentProps: { placeholder: '1.0.0' },
      defaultValue: '',
      fieldName: 'latestVersion',
      label: $t('mobile-center.features.application.fields.latestVersion'),
      rules: createPatternRule(
        versionPattern,
        $t('mobile-center.features.application.validation.versionInvalid'),
      ),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t(
          'mobile-center.features.application.form.releaseNotesPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'minVersionReleaseNotes',
      label: $t('mobile-center.features.application.fields.minReleaseNotes'),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t(
          'mobile-center.features.application.form.releaseNotesPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'latestVersionReleaseNotes',
      label: $t('mobile-center.features.application.fields.latestReleaseNotes'),
    },
  ];
}
export function createStoreFormSchema(): VbenFormSchema<MobileApplicationStoreValues>[] {
  return [
    {
      component: 'VbenInput',
      defaultValue: '',
      fieldName: 'storeLink',
      label: $t('mobile-center.features.application.fields.storeLink'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['platformType', 'status'],
        resolve: ({ values }) => ({
          componentProps: {
            placeholder:
              values.platformType === 'IOS'
                ? 'https://apps.apple.com/us/app/example/id1234567890'
                : 'https://play.google.com/store/apps/details?id=org.example.app',
          },
          rules: createPatternRule(
            storePatterns[values.platformType === 'IOS' ? 'IOS' : 'ANDROID'],
            $t('mobile-center.features.application.validation.storeInvalid'),
            values.status === 'PUBLISHED'
              ? $t(
                  'mobile-center.features.application.validation.storeRequired',
                )
              : undefined,
          ),
        }),
      },
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: Array.from({ length: 32 }, () => 'AA').join(':'),
      },
      defaultValue: '',
      fieldName: 'sha256CertFingerprints',
      label: $t('mobile-center.features.application.fields.fingerprints'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['platformType', 'status'],
        resolve: ({ values }) => ({
          if: values.platformType === 'ANDROID',
          rules: createPatternRule(
            fingerprintPattern,
            $t(
              'mobile-center.features.application.validation.fingerprintsInvalid',
            ),
            values.status === 'PUBLISHED'
              ? $t(
                  'mobile-center.features.application.validation.fingerprintsRequired',
                )
              : undefined,
          ),
        }),
      },
    },
    {
      component: 'VbenInput',
      componentProps: { placeholder: 'ABCDEFGHIJ.org.example.app' },
      defaultValue: '',
      fieldName: 'appId',
      label: $t('mobile-center.features.application.fields.appId'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['platformType', 'status'],
        resolve: ({ values }) => ({
          if: values.platformType === 'IOS',
          rules: createPatternRule(
            appIdPattern,
            $t('mobile-center.features.application.validation.appIdInvalid'),
            values.status === 'PUBLISHED'
              ? $t(
                  'mobile-center.features.application.validation.appIdRequired',
                )
              : undefined,
          ),
        }),
      },
    },
  ];
}
