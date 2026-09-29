<script lang="ts" setup>
import type {
  MobileBundleBasicValues,
  MobileBundleOAuthValues,
} from './form-data';

import type { MobileAppBundle, MobileAppBundleInfo } from '#/api/tb/mobile-app';
import type { OAuth2Client } from '#/api/tb/oauth2';

import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Steps } from 'antdv-next';

import { ApiSelect } from '#/adapter/component';
import { useVbenForm } from '#/adapter/form';
import {
  getMobileAppBundleInfo,
  saveMobileAppBundle,
  updateMobileBundleOAuth2Clients,
} from '#/api/tb/mobile-app';
import { EntityType } from '#/enums';
import { $t } from '#/locales';
import ClientForm from '#/views/tb/oauth2/client-form.vue';

import { mergeOptions, toMobileBundleFormValues } from './form-data';
import { createFormSchema, createOAuthFormSchema } from './form-schema';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<MobileAppBundleInfo | null>(null);
const currentStep = ref(0);
const contentRef = ref<HTMLDivElement>();
const clientOptions = ref<{ label: string; value: string }[]>([]);
const steps = computed(() => [
  { title: $t('mobile-center.features.bundle.steps.basic') },
  { title: $t('mobile-center.features.bundle.steps.layout') },
]);

const [ClientModal, clientModalApi] = useVbenModal({
  connectedComponent: ClientForm,
  destroyOnClose: true,
});

async function handleCreate() {
  const formValues = await oauthFormApi.getValues();
  if (formValues.oauth2Enabled) clientModalApi.setData({}).open();
}

async function handleOAuthValuesChange(formValues: MobileBundleOAuthValues) {
  if (
    formValues.oauth2Enabled === false &&
    formValues.oauth2ClientIds?.length
  ) {
    await oauthFormApi.setFieldValue('oauth2ClientIds', []);
  }
}

async function onSuccess(client: OAuth2Client) {
  if (!client.id) return;
  const clientId = client.id.id;
  clientOptions.value = mergeOptions(clientOptions.value, [
    { value: clientId, label: client.title },
  ]);
  oauthFormApi.updateSchema([
    {
      fieldName: 'oauth2ClientIds',
      componentProps: {
        options: clientOptions.value,
        params: { selected: [...clientOptions.value] },
      },
    },
  ]);
  const formValues = await oauthFormApi.getValues();
  await oauthFormApi.setFieldValue('oauth2ClientIds', [
    ...new Set([...(formValues.oauth2ClientIds ?? []), clientId]),
  ]);
}

async function handlePrevious() {
  currentStep.value = 0;
  await nextTick();
  contentRef.value?.scrollTo({ top: 0 });
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
const [Form, formApi] = useVbenForm<MobileBundleBasicValues>({
  ...commonFormConfig,
  schema: createFormSchema(),
});
const [OAuthForm, oauthFormApi] = useVbenForm<MobileBundleOAuthValues>({
  ...commonFormConfig,
  handleValuesChange: handleOAuthValuesChange,
  schema: createOAuthFormSchema(),
});

const [Modal, modalApi] = useVbenModal<{ mobileAppBundleId?: string }>({
  async onConfirm() {
    modalApi.lock();
    try {
      const [basicValidation, oauthValidation] = await Promise.all([
        formApi.validate(),
        oauthFormApi.validate(),
      ]);
      if (!basicValidation.valid || !oauthValidation.valid) {
        currentStep.value = 0;
        await nextTick();
        if (basicValidation.valid) {
          oauthFormApi.scrollToFirstError(oauthValidation.errors);
        } else {
          formApi.scrollToFirstError(basicValidation.errors);
        }
        return;
      }
      if (currentStep.value === 0) {
        currentStep.value = 1;
        await nextTick();
        contentRef.value?.scrollTo({ top: 0 });
        return;
      }
      const [formValues, oauthValues] = await Promise.all([
        formApi.getValues(),
        oauthFormApi.getValues(),
      ]);
      const mobileAppBundle: MobileAppBundle = {
        id: record.value?.id,
        version: record.value?.version,
        tenantId: record.value?.tenantId,
        title: formValues.title.trim(),
        description: (formValues.description ?? '').trim(),
        androidAppId: formValues.androidAppId
          ? { entityType: EntityType.MOBILE_APP, id: formValues.androidAppId }
          : null,
        iosAppId: formValues.iosAppId
          ? { entityType: EntityType.MOBILE_APP, id: formValues.iosAppId }
          : null,
        oauth2Enabled: oauthValues.oauth2Enabled,
        // 布局步骤尚未实现，编辑时保留已有布局。
        layoutConfig: record.value?.layoutConfig,
      };
      const isEdit = !!record.value?.id;
      const oauth2ClientIds = oauthValues.oauth2Enabled
        ? (oauthValues.oauth2ClientIds ?? [])
        : [];
      const saved = await saveMobileAppBundle(
        mobileAppBundle,
        isEdit ? undefined : oauth2ClientIds,
      );
      // 保存返回的新版本用于客户端关联更新失败后的重试。
      record.value = { ...record.value, ...saved };
      if (isEdit && saved.id) {
        try {
          await updateMobileBundleOAuth2Clients(saved.id.id, oauth2ClientIds);
        } catch {
          message.error(
            $t('mobile-center.features.bundle.form.clientsSaveFailed'),
          );
          emit('success');
          return;
        }
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { mobileAppBundleId } = modalApi.getData() ?? {};
    record.value = null;
    currentStep.value = 0;
    clientOptions.value = [];
    await Promise.all([formApi.reset(), oauthFormApi.reset()]);
    modalApi.setState({
      title: mobileAppBundleId
        ? $t('mobile-center.features.bundle.actions.edit')
        : $t('mobile-center.features.bundle.actions.create'),
    });
    modalApi.lock();
    try {
      const mobileAppBundle = mobileAppBundleId
        ? await getMobileAppBundleInfo(mobileAppBundleId)
        : undefined;
      record.value = mobileAppBundle ?? null;
      clientOptions.value = mergeOptions(
        [],
        (mobileAppBundle?.oauth2ClientInfos ?? []).map((client) => ({
          value: client.id?.id,
          label: client.title,
        })),
      );
      oauthFormApi.updateSchema([
        {
          fieldName: 'oauth2ClientIds',
          componentProps: {
            options: clientOptions.value,
            params: { selected: [...clientOptions.value] },
          },
        },
      ]);
      const formValues = toMobileBundleFormValues(mobileAppBundle);
      await Promise.all([
        formApi.setValues(formValues.basic),
        oauthFormApi.setValues(formValues.oauth),
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
    content-class="flex min-h-0 flex-col overflow-hidden px-6 pt-5 pb-1"
    :confirm-text="
      currentStep === 0
        ? $t('mobile-center.features.bundle.actions.next')
        : $t('tb.common.save')
    "
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
    <div class="mb-6 shrink-0">
      <Steps :current="currentStep" :items="steps" size="small" />
    </div>
    <ClientModal @success="onSuccess" />
    <div ref="contentRef" class="min-h-0 flex-1 overflow-y-auto px-1">
      <div v-show="currentStep === 0">
        <Form />
        <OAuthForm>
          <template #oauth2ClientIds="slotProps">
            <div class="w-full space-y-2">
              <ApiSelect v-bind="slotProps.componentProps" />
              <VbenButton
                type="button"
                variant="link"
                class="h-7 gap-1 px-0 text-sm"
                @click="handleCreate"
              >
                <IconifyIcon
                  icon="lucide:plus"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ $t('mobile-center.features.bundle.actions.createClient') }}
              </VbenButton>
            </div>
          </template>
        </OAuthForm>
      </div>
      <div v-show="currentStep === 1" class="min-h-64"></div>
    </div>

    <template #prepend-footer>
      <VbenButton
        v-if="currentStep === 1"
        type="button"
        variant="outline"
        class="mr-auto"
        :disabled="modalState.submitting"
        @click="handlePrevious"
      >
        {{ $t('mobile-center.features.bundle.actions.previous') }}
      </VbenButton>
    </template>
  </Modal>
</template>
