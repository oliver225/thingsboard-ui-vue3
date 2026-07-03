<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { SecuritySettings, UserPasswordPolicy } from '#/api/tb/admin';

import { h, onMounted, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getSecuritySettings, saveSecuritySettings } from '#/api/tb/admin';

const DEFAULT_POLICY: UserPasswordPolicy = {
  allowWhitespaces: true,
  forceUserToResetPasswordIfNotValid: false,
  maximumLength: null,
  minimumDigits: null,
  minimumLength: 6,
  minimumLowercaseLetters: null,
  minimumSpecialCharacters: null,
  minimumUppercaseLetters: null,
  passwordExpirationPeriodDays: null,
  passwordReuseFrequencyDays: null,
};

const record = ref<null | SecuritySettings>(null);

// --------------------------- 通用策略 ---------------------------
const generalSchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'maxFailedLoginAttempts',
    label: $t('tb.securitySettings.general.maxFailedLoginAttempts'),
  },
  {
    component: 'Input',
    componentProps: { allowClear: true, size: 'large' },
    fieldName: 'userLockoutNotificationEmail',
    label: $t('tb.securitySettings.general.userLockoutNotificationEmail'),
    rules: z
      .string()
      .email({ message: $t('tb.securitySettings.general.emailInvalid') })
      .optional()
      .or(z.literal('')),
  },
  {
    component: 'InputNumber',
    componentProps: { max: 24, min: 1, precision: 0, size: 'large' },
    fieldName: 'userActivationTokenTtl',
    label: $t('tb.securitySettings.general.userActivationTokenTtl'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { max: 24, min: 1, precision: 0, size: 'large' },
    fieldName: 'passwordResetTokenTtl',
    label: $t('tb.securitySettings.general.passwordResetTokenTtl'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 1, precision: 0, size: 'large' },
    fieldName: 'mobileSecretKeyLength',
    label: $t('tb.securitySettings.general.mobileSecretKeyLength'),
  },
];

const [GeneralForm, generalFormApi] = useVbenForm({
  layout: 'vertical',
  schema: generalSchema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

// --------------------------- 密码策略 ---------------------------
const policySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: { max: 50, min: 6, precision: 0, size: 'large' },
    fieldName: 'minimumLength',
    label: $t('tb.securitySettings.general.minimumLength'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 6, precision: 0, size: 'large' },
    fieldName: 'maximumLength',
    label: $t('tb.securitySettings.general.maximumLength'),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'minimumUppercaseLetters',
    label: $t('tb.securitySettings.general.minimumUppercaseLetters'),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'minimumLowercaseLetters',
    label: $t('tb.securitySettings.general.minimumLowercaseLetters'),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'minimumDigits',
    label: $t('tb.securitySettings.general.minimumDigits'),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'minimumSpecialCharacters',
    label: $t('tb.securitySettings.general.minimumSpecialCharacters'),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'passwordExpirationPeriodDays',
    label: $t('tb.securitySettings.general.passwordExpirationPeriodDays'),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0, size: 'large' },
    fieldName: 'passwordReuseFrequencyDays',
    label: $t('tb.securitySettings.general.passwordReuseFrequencyDays'),
  },
  {
    component: 'VbenCheckbox',
    fieldName: 'allowWhitespaces',
    formItemClass: 'sm:col-span-2',
    hideLabel: true,
    renderComponentContent: () => ({
      default: () =>
        h('span', $t('tb.securitySettings.general.allowWhitespaces')),
    }),
  },
  {
    component: 'VbenCheckbox',
    fieldName: 'forceUserToResetPasswordIfNotValid',
    formItemClass: 'sm:col-span-2',
    hideLabel: true,
    renderComponentContent: () => ({
      default: () =>
        h('span', $t('tb.securitySettings.general.forceResetPassword')),
    }),
  },
];

const [PolicyForm, policyFormApi] = useVbenForm({
  layout: 'vertical',
  schema: policySchema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

async function loadSecurity() {
  try {
    const data = await getSecuritySettings();
    record.value = data;
    await generalFormApi.setValues({
      maxFailedLoginAttempts: data.maxFailedLoginAttempts ?? null,
      mobileSecretKeyLength: data.mobileSecretKeyLength ?? null,
      passwordResetTokenTtl: data.passwordResetTokenTtl ?? 24,
      userActivationTokenTtl: data.userActivationTokenTtl ?? 24,
      userLockoutNotificationEmail: data.userLockoutNotificationEmail ?? '',
    });
    await policyFormApi.setValues({
      ...DEFAULT_POLICY,
      ...data.passwordPolicy,
    });
  } catch {
    // 读取失败(如权限不足)静默
  }
}

async function saveSecurity() {
  const [general, policy] = await Promise.all([
    generalFormApi.validate(),
    policyFormApi.validate(),
  ]);
  if (!general.valid || !policy.valid) {
    return;
  }
  const generalValues = await generalFormApi.getValues();
  const policyValues = await policyFormApi.getValues<UserPasswordPolicy>();
  const payload: SecuritySettings = {
    ...record.value,
    ...generalValues,
    passwordPolicy: { ...record.value?.passwordPolicy, ...policyValues },
  };
  record.value = await saveSecuritySettings(payload);
  message.success($t('tb.common.saveSuccess'));
}

onMounted(loadSecurity);
</script>

<template>
  <div class="border-border bg-card rounded-lg border px-5 py-4">
    <div class="text-lg font-semibold">
      {{ $t('tb.securitySettings.general.title') }}
    </div>

    <div class="mt-4 space-y-4">
      <!-- 通用策略 -->
      <div class="border-border rounded-md border px-4 py-3">
        <div class="mb-3 text-sm font-bold">
          {{ $t('tb.securitySettings.general.generalPolicy') }}
        </div>
        <GeneralForm />
      </div>

      <!-- 密码策略 -->
      <div class="border-border rounded-md border px-4 py-3">
        <div class="mb-3 text-sm font-bold">
          {{ $t('tb.securitySettings.general.passwordPolicy') }}
        </div>
        <PolicyForm />
      </div>
    </div>

    <div class="mt-4 flex items-center justify-start gap-2">
      <VbenButton variant="outline" @click="loadSecurity">
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton @click="saveSecurity">
        {{ $t('tb.common.save') }}
      </VbenButton>
    </div>
  </div>
</template>
