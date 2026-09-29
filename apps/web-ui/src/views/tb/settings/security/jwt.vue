<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { JwtSettings } from '#/api/tb/admin';

import { h, onMounted } from 'vue';

import { confirm, VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getJwtSettings, saveJwtSettings } from '#/api/tb/admin';
import { FormSection } from '#/components/form-section';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

const { isLoading, isSaving, isReady, read, write } = useFormRequest();

const numberInputProps = {
  precision: 0,
  class:
    '!h-10 !w-full !rounded-md !border-input !bg-background !shadow-xs [&_input]:!h-full',
  size: 'middle',
} as const;

const accessStore = useAccessStore();
let loadedIssuer = '';
let loadedSigningKey = '';

/** 生成 64 字节安全随机数，并按后端契约编码为 Base64。 */
function genSigningKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(64));
  return btoa(String.fromCodePoint(...bytes));
}

const schema: VbenFormSchema[] = [
  {
    component: 'VbenInput',
    componentProps: { class: 'h-10 shadow-xs' },
    fieldName: 'tokenIssuer',
    formItemClass: 'md:col-span-2',
    label: $t('settings.features.security.jwt.tokenIssuer'),
    rules: 'required',
  },
  {
    component: 'VbenInput',
    componentProps: {
      class: 'h-10 font-mono text-sm shadow-xs',
      autocomplete: 'off',
      spellcheck: false,
    },
    fieldName: 'tokenSigningKey',
    formItemClass: 'md:col-span-2',
    label: $t('settings.features.security.jwt.tokenSigningKey'),
    suffix: () =>
      h(
        VbenButton,
        {
          variant: 'outline',
          class: 'h-10 shrink-0',
          type: 'button',
          disabled: !isReady.value || isLoading.value || isSaving.value,
          onClick: () =>
            jwtFormApi.setFieldValue('tokenSigningKey', genSigningKey()),
        },
        () => $t('settings.features.security.jwt.generateKey'),
      ),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 60 },
    fieldName: 'tokenExpirationTime',
    label: $t('settings.features.security.jwt.tokenExpirationTime'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 900 },
    dependencies: {
      rules: (formValues) =>
        z
          .number({ message: $t('settings.validation.requiredField') })
          .refine((v) => v > (formValues.tokenExpirationTime ?? 0), {
            message: $t('settings.features.security.jwt.refreshLessToken'),
          }),
      triggerFields: ['tokenExpirationTime', 'refreshTokenExpTime'],
    },
    fieldName: 'refreshTokenExpTime',
    label: $t('settings.features.security.jwt.refreshTokenExpTime'),
  },
];

const [JwtForm, jwtFormApi] = useVbenForm({
  layout: 'vertical',
  schema,
  showDefaultActions: false,
  commonConfig: { labelClass: 'text-sm font-medium', formItemClass: 'pb-0' },
  wrapperClass: 'grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2',
});

async function performLoad() {
  const data = await getJwtSettings();
  loadedIssuer = data.tokenIssuer ?? '';
  loadedSigningKey = data.tokenSigningKey ?? '';
  await jwtFormApi.setValues({ ...data });
}

async function doSaveJwt(formValues: JwtSettings) {
  const pair = await saveJwtSettings(formValues);
  // 后端轮换令牌后同步当前会话，避免后续请求使用已失效的令牌。
  if (pair?.token) {
    accessStore.setAccessToken(pair.token);
    accessStore.setRefreshToken(pair.refreshToken);
  }
  await performLoad();
  message.success($t('tb.common.saveSuccess'));
}

async function performSave() {
  const { valid } = await jwtFormApi.validate();
  if (!valid) {
    return;
  }
  const formValues = await jwtFormApi.getValues<JwtSettings>();
  try {
    if (atob(formValues.tokenSigningKey).length < 32)
      throw new Error('JWT signing key must contain at least 32 decoded bytes');
  } catch {
    message.error($t('settings.validation.jwtKey'));
    return;
  }
  if (
    !Number.isInteger(formValues.tokenExpirationTime) ||
    formValues.tokenExpirationTime < 60 ||
    formValues.tokenExpirationTime > 2_147_483_647 ||
    !Number.isInteger(formValues.refreshTokenExpTime) ||
    formValues.refreshTokenExpTime < 900 ||
    formValues.refreshTokenExpTime > 2_147_483_647 ||
    formValues.refreshTokenExpTime <= formValues.tokenExpirationTime
  ) {
    message.error($t('settings.validation.jwtTime'));
    return;
  }
  const sensitiveChanged =
    formValues.tokenIssuer !== loadedIssuer ||
    formValues.tokenSigningKey !== loadedSigningKey;
  if (!sensitiveChanged) {
    await doSaveJwt(formValues);
    return;
  }
  await confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      await doSaveJwt(formValues);
    },
    content: $t('settings.features.security.jwt.changeWarning'),

    icon: 'warning',
    title: $t('settings.features.security.jwt.changeWarningTitle'),
  }).catch(() => {});
}

const handleReload = () => read(performLoad);
const handleSave = () => write(performSave);
onMounted(handleReload);
</script>

<template>
  <SettingsPanel
    :show-header="false"
    :title="$t('settings.features.security.jwt.title')"
  >
    <FormSection>
      <JwtForm />
    </FormSection>
    <template #footer>
      <VbenButton
        variant="outline"
        class="min-w-20"
        :loading="isLoading"
        :disabled="isSaving"
        @click="handleReload"
      >
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        variant="default"
        class="min-w-20"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </template>
  </SettingsPanel>
</template>
