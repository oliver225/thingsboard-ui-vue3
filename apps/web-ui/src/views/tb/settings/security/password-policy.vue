<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { SecuritySettings, UserPasswordPolicy } from '#/api/tb/admin';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { Button, message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getSecuritySettings, saveSecuritySettings } from '#/api/tb/admin';
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

// 登录限制与账户验证链接设置。
const generalSchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'maxFailedLoginAttempts',
    label: $t(
      'settings.features.security.passwordPolicy.maxFailedLoginAttempts',
    ),
  },
  {
    component: 'VbenInput',
    componentProps: { class: 'h-10 shadow-xs' },
    fieldName: 'userLockoutNotificationEmail',
    label: $t(
      'settings.features.security.passwordPolicy.userLockoutNotificationEmail',
    ),
    rules: z
      .string()
      .email({
        message: $t('settings.features.security.passwordPolicy.emailInvalid'),
      })
      .optional()
      .or(z.literal('')),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, max: 24, min: 1 },
    fieldName: 'userActivationTokenTtl',
    label: $t(
      'settings.features.security.passwordPolicy.userActivationTokenTtl',
    ),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, max: 24, min: 1 },
    fieldName: 'passwordResetTokenTtl',
    label: $t(
      'settings.features.security.passwordPolicy.passwordResetTokenTtl',
    ),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 1 },
    fieldName: 'mobileSecretKeyLength',
    label: $t(
      'settings.features.security.passwordPolicy.mobileSecretKeyLength',
    ),
  },
];

const [GeneralForm, generalFormApi] = useVbenForm({
  layout: 'vertical',
  schema: generalSchema,
  showDefaultActions: false,
  commonConfig: { labelClass: 'text-sm font-medium', formItemClass: 'pb-0' },
  wrapperClass: 'grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2',
});

// 密码复杂度、有效期和不符合策略时的处理方式。
const policySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, max: 50, min: 6 },
    fieldName: 'minimumLength',
    label: $t('settings.features.security.passwordPolicy.minimumLength'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 6 },
    fieldName: 'maximumLength',
    label: $t('settings.features.security.passwordPolicy.maximumLength'),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'minimumUppercaseLetters',
    label: $t(
      'settings.features.security.passwordPolicy.minimumUppercaseLetters',
    ),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'minimumLowercaseLetters',
    label: $t(
      'settings.features.security.passwordPolicy.minimumLowercaseLetters',
    ),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'minimumDigits',
    label: $t('settings.features.security.passwordPolicy.minimumDigits'),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'minimumSpecialCharacters',
    label: $t(
      'settings.features.security.passwordPolicy.minimumSpecialCharacters',
    ),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'passwordExpirationPeriodDays',
    label: $t(
      'settings.features.security.passwordPolicy.passwordExpirationPeriodDays',
    ),
  },
  {
    component: 'InputNumber',
    componentProps: { ...numberInputProps, min: 0 },
    fieldName: 'passwordReuseFrequencyDays',
    label: $t(
      'settings.features.security.passwordPolicy.passwordReuseFrequencyDays',
    ),
  },
  {
    component: 'TbCheckbox',
    fieldName: 'allowWhitespaces',
    formItemClass: 'md:col-span-2',
    hideLabel: true,
    componentProps: {
      title: $t('settings.features.security.passwordPolicy.allowWhitespaces'),
    },
  },
  {
    component: 'TbCheckbox',
    fieldName: 'forceUserToResetPasswordIfNotValid',
    formItemClass: 'md:col-span-2',
    hideLabel: true,
    componentProps: {
      title: $t('settings.features.security.passwordPolicy.forceResetPassword'),
    },
  },
];

const [PolicyForm, policyFormApi] = useVbenForm({
  layout: 'vertical',
  schema: policySchema,
  showDefaultActions: false,
  commonConfig: { labelClass: 'text-sm font-medium', formItemClass: 'pb-0' },
  wrapperClass: 'grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2',
});

async function performLoad() {
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
}

async function performSave() {
  const [general, policy] = await Promise.all([
    generalFormApi.validate(),
    policyFormApi.validate(),
  ]);
  if (!general.valid || !policy.valid) {
    return;
  }
  const generalValues = await generalFormApi.getValues();
  const policyValues = await policyFormApi.getValues<UserPasswordPolicy>();
  if (
    (policyValues.maximumLength !== null &&
      policyValues.maximumLength !== undefined &&
      policyValues.maximumLength < (policyValues.minimumLength ?? 6)) ||
    (policyValues.minimumLength ?? 0) < 6 ||
    (policyValues.minimumLength ?? 0) > 50
  ) {
    message.error($t('settings.validation.passwordLength'));
    return;
  }
  for (const value of Object.values(policyValues)) {
    if (typeof value === 'number' && (!Number.isInteger(value) || value < 0)) {
      message.error($t('settings.validation.nonnegative'));
      return;
    }
  }
  for (const key of ['userActivationTokenTtl', 'passwordResetTokenTtl']) {
    if (
      !Number.isInteger(generalValues[key]) ||
      generalValues[key] < 1 ||
      generalValues[key] > 24
    ) {
      message.error($t('settings.validation.ttl'));
      return;
    }
  }
  const payload: SecuritySettings = {
    ...record.value,
    ...generalValues,
    passwordPolicy: { ...record.value?.passwordPolicy, ...policyValues },
  };
  record.value = await saveSecuritySettings(payload);
  message.success($t('tb.common.saveSuccess'));
}

const handleReload = () => read(performLoad);
const handleSave = () => write(performSave);
onMounted(handleReload);
</script>

<template>
  <SettingsPanel
    :show-header="false"
    :title="$t('settings.features.security.passwordPolicy.title')"
  >
    <div class="flex flex-col gap-6">
      <!-- 通用策略 -->
      <FormSection
        :title="$t('settings.features.security.passwordPolicy.generalPolicy')"
        :description="
          $t(
            'settings.features.security.passwordPolicy.generalPolicyDescription',
          )
        "
      >
        <GeneralForm />
      </FormSection>

      <!-- 密码策略 -->
      <FormSection
        :title="$t('settings.features.security.passwordPolicy.passwordPolicy')"
        :description="
          $t(
            'settings.features.security.passwordPolicy.passwordPolicyDescription',
          )
        "
      >
        <PolicyForm />
      </FormSection>
    </div>
    <template #footer>
      <Button
        type="default"
        :loading="isLoading"
        :disabled="isSaving"
        @click="handleReload"
      >
        {{ $t('tb.common.undo') }}
      </Button>
      <Button
        type="primary"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </Button>
    </template>
  </SettingsPanel>
</template>
