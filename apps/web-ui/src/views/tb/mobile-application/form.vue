<script lang="ts" setup>
import type {
  MobileApplicationBasicValues,
  MobileApplicationStoreValues,
  MobileApplicationVersionValues,
} from './form-data';

import type { MobileApp } from '#/api/tb/mobile-app';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton, VbenInputPassword } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getMobileApp, saveMobileApp } from '#/api/tb/mobile-app';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { createAppSecret, toMobileAppFormValues } from './form-data';
import {
  createFormSchema,
  createStoreFormSchema,
  createVersionFormSchema,
} from './form-schema';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<MobileApp | null>(null);
const platformType = ref<MobileApp['platformType']>('ANDROID');

async function handleGenerateSecret() {
  await formApi.setFieldValue('appSecret', createAppSecret());
}

async function handleValuesChange(formValues: MobileApplicationBasicValues) {
  const platformChanged =
    !record.value && formValues.platformType !== platformType.value;
  platformType.value = formValues.platformType;
  // 商店校验依赖基础表单的平台和状态；这些上下文值不渲染成重复字段。
  await storeFormApi.setValues(
    {
      platformType: formValues.platformType,
      status: formValues.status,
      ...(platformChanged
        ? { storeLink: '', sha256CertFingerprints: '', appId: '' }
        : {}),
    },
    false,
  );
  if (platformChanged) {
    await storeFormApi.clearValidation([
      'storeLink',
      'sha256CertFingerprints',
      'appId',
    ]);
  }
}

const commonFormConfig = {
  layout: 'vertical' as const,
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
};
const sectionFormConfig = {
  ...commonFormConfig,
  commonConfig: { ...commonFormConfig.commonConfig, formItemClass: 'min-w-0' },
  wrapperClass: 'grid-cols-1 gap-5 sm:grid-cols-2',
};

const [Form, formApi] = useVbenForm<MobileApplicationBasicValues>({
  ...commonFormConfig,
  handleValuesChange,
  schema: createFormSchema(),
});
const [VersionForm, versionFormApi] =
  useVbenForm<MobileApplicationVersionValues>({
    ...sectionFormConfig,
    schema: createVersionFormSchema(),
  });
const [StoreForm, storeFormApi] = useVbenForm<MobileApplicationStoreValues>({
  ...sectionFormConfig,
  schema: createStoreFormSchema(),
});

const [Modal, modalApi] = useVbenModal<{ mobileAppId?: string }>({
  async onConfirm() {
    const [basicValidation, versionValidation, storeValidation] =
      await Promise.all([
        formApi.validate(),
        versionFormApi.validate(),
        storeFormApi.validate(),
      ]);
    if (!basicValidation.valid) {
      formApi.scrollToFirstError(basicValidation.errors);
      return;
    }
    if (!versionValidation.valid) {
      versionFormApi.scrollToFirstError(versionValidation.errors);
      return;
    }
    if (!storeValidation.valid) {
      storeFormApi.scrollToFirstError(storeValidation.errors);
      return;
    }
    const [formValues, versionValues, storeValues] = await Promise.all([
      formApi.getValues(),
      versionFormApi.getValues(),
      storeFormApi.getValues(),
    ]);
    const mobileApp: MobileApp = {
      ...record.value,
      pkgName: formValues.pkgName.trim(),
      title: (formValues.title ?? '').trim(),
      appSecret: formValues.appSecret,
      platformType: record.value?.platformType ?? formValues.platformType,
      status: formValues.status,
      versionInfo: {
        ...record.value?.versionInfo,
        minVersion: versionValues.minVersion ?? '',
        latestVersion: versionValues.latestVersion ?? '',
        minVersionReleaseNotes: versionValues.minVersionReleaseNotes ?? '',
        latestVersionReleaseNotes:
          versionValues.latestVersionReleaseNotes ?? '',
      },
      storeInfo: {
        storeLink: (storeValues.storeLink ?? '').trim(),
        ...(formValues.platformType === 'ANDROID'
          ? { sha256CertFingerprints: storeValues.sha256CertFingerprints ?? '' }
          : { appId: storeValues.appId ?? '' }),
      },
    };

    modalApi.lock();
    try {
      await saveMobileApp(mobileApp);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { mobileAppId } = modalApi.getData() ?? {};
    record.value = null;
    platformType.value = 'ANDROID';
    await Promise.all([
      formApi.reset(),
      versionFormApi.reset(),
      storeFormApi.reset(),
    ]);
    formApi.updateSchema([
      {
        fieldName: 'platformType',
        componentProps: { disabled: !!mobileAppId },
      },
    ]);
    modalApi.setState({
      title: mobileAppId
        ? $t('mobile-center.features.application.actions.edit')
        : $t('mobile-center.features.application.actions.create'),
    });

    modalApi.lock();
    try {
      const mobileApp = mobileAppId
        ? await getMobileApp(mobileAppId)
        : undefined;
      record.value = mobileApp ?? null;
      const formValues = toMobileAppFormValues(mobileApp);
      platformType.value = formValues.basic.platformType;
      await Promise.all([
        formApi.setValues(formValues.basic),
        versionFormApi.setValues(formValues.version),
        storeFormApi.setValues(formValues.store, false),
      ]);
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form>
      <template #appSecret="slotProps">
        <div class="flex w-full min-w-0 items-center gap-2">
          <VbenInputPassword
            v-bind="{
              ...slotProps.componentProps,
              'onUpdate:modelValue': (value: string | undefined) =>
                slotProps.componentProps['onUpdate:modelValue']?.(value ?? ''),
            }"
            class="min-w-0 flex-1"
          />
          <VbenButton
            type="button"
            variant="outline"
            class="h-10 shrink-0"
            @click="handleGenerateSecret"
          >
            <IconifyIcon
              icon="lucide:refresh-cw"
              class="mr-2 size-4"
              aria-hidden="true"
            />
            {{
              $t('mobile-center.features.application.actions.generateSecret')
            }}
          </VbenButton>
        </div>
      </template>
    </Form>
    <FormSection
      :title="$t('mobile-center.features.application.groups.versionInfo')"
      :collapsible="false"
      class="mb-5"
    >
      <VersionForm />
    </FormSection>
    <FormSection
      :title="$t('mobile-center.features.application.groups.storeInfo')"
      :collapsible="false"
      class="mb-5"
    >
      <StoreForm />
    </FormSection>
  </Modal>
</template>
