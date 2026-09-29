import type {
  MobileBundleBasicValues,
  MobileBundleOAuthValues,
} from './form-data';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { getMobileOAuth2Clients } from '#/api/tb/mobile-app';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

import { mergeOptions } from './form-data';

export function createFormSchema(): VbenFormSchema<MobileBundleBasicValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: $t('mobile-center.features.bundle.form.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('mobile-center.features.bundle.fields.title'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t('mobile-center.features.bundle.validation.titleRequired'),
        })
        .max(255, {
          message: $t(
            'mobile-center.features.bundle.validation.titleMaxLength',
          ),
        }),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'MOBILE_APP',
        params: { platformType: 'ANDROID' },
        showSearch: true,
        placeholder: $t(
          'mobile-center.features.bundle.form.androidPlaceholder',
        ),
      },
      fieldName: 'androidAppId',
      label: $t('mobile-center.features.bundle.fields.android'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'MOBILE_APP',
        params: { platformType: 'IOS' },
        showSearch: true,
        placeholder: $t('mobile-center.features.bundle.form.iosPlaceholder'),
      },
      fieldName: 'iosAppId',
      label: $t('mobile-center.features.bundle.fields.ios'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t(
          'mobile-center.features.bundle.form.descriptionPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('mobile-center.features.bundle.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ];
}

export function createOAuthFormSchema(): VbenFormSchema<MobileBundleOAuthValues>[] {
  return [
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('mobile-center.features.bundle.fields.oauth2Enabled'),
      },
      defaultValue: true,
      fieldName: 'oauth2Enabled',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        mode: 'multiple',
        allowClear: true,
        showSearch: true,
        optionFilterProp: 'label',
        api: loadClientOptions,
        immediate: false,
        placeholder: $t(
          'mobile-center.features.bundle.form.clientsPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'oauth2ClientIds',
      label: $t('mobile-center.features.bundle.fields.clients'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['oauth2Enabled'],
        resolve: ({ values }) => ({ if: values.oauth2Enabled }),
      },
    },
  ];
}

async function loadClientOptions({
  selected = [],
}: {
  selected?: { value?: string; label?: string }[];
}) {
  const clients = await loadAllPages(getMobileOAuth2Clients);
  return mergeOptions(
    clients.map((client) => ({ value: client.id?.id, label: client.title })),
    selected,
  );
}
