<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { UserPasswordPolicy } from '#/api/tb/auth';

import { computed, onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { changePassword, getUserPasswordPolicy } from '#/api/tb/auth';
import { FormSection } from '#/components/form-section';

defineOptions({ name: 'AccountChangePassword' });

interface ChangePasswordFormValues {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
}

const accessStore = useAccessStore();

const loading = ref(true);
const policy = ref<UserPasswordPolicy>();

function getPasswordChecks(password: string) {
  const p = policy.value;
  if (!p) return [];

  const checks = [
    {
      key: 'minimumLength',
      limit: p.minimumLength ?? 0,
      count: password.length,
      label: 'pwdMinLength',
    },
    {
      key: 'maximumLength',
      limit: p.maximumLength ?? 0,
      count: password.length,
      label: 'pwdMaxLength',
    },
    {
      key: 'minimumUppercaseLetters',
      limit: p.minimumUppercaseLetters ?? 0,
      count: password.match(/[A-Z]/g)?.length ?? 0,
      label: 'pwdMinUpper',
    },
    {
      key: 'minimumLowercaseLetters',
      limit: p.minimumLowercaseLetters ?? 0,
      count: password.match(/[a-z]/g)?.length ?? 0,
      label: 'pwdMinLower',
    },
    {
      key: 'minimumDigits',
      limit: p.minimumDigits ?? 0,
      count: password.match(/\d/g)?.length ?? 0,
      label: 'pwdMinDigits',
    },
    {
      key: 'minimumSpecialCharacters',
      limit: p.minimumSpecialCharacters ?? 0,
      count: password.replaceAll(/[a-z0-9\s]/gi, '').length,
      label: 'pwdMinSpecial',
    },
  ]
    .filter(({ limit }) => limit > 0)
    .map(({ key, limit, count, label }) => ({
      key,
      label: [
        $t(
          key === 'maximumLength'
            ? 'account.validation.atMost'
            : 'account.validation.atLeast',
        ),
        $t(`account.validation.${label}`, { n: limit }),
      ].join(' '),
      valid: key === 'maximumLength' ? count <= limit : count >= limit,
    }));

  if (p.allowWhitespaces === false) {
    checks.push({
      key: 'allowWhitespaces',
      label: $t('account.validation.pwdNoWhitespace'),
      valid: !/\s/u.test(password),
    });
  }
  return checks;
}

const [Form, formApi] = useVbenForm<ChangePasswordFormValues>(
  reactive({
    commonConfig: {
      labelClass: 'text-sm font-medium',
      formItemClass: 'pb-0',
      componentProps: {
        class: 'w-full',
      },
    },
    layout: 'vertical',
    schema: computed((): VbenFormSchema<ChangePasswordFormValues>[] => [
      {
        component: 'VbenInputPassword',
        componentProps: {
          placeholder: $t('account.fields.currentPassword'),
        },
        fieldName: 'currentPassword',
        label: $t('account.fields.currentPassword'),
        rules: z
          .string({ error: $t('account.messages.currentPasswordTip') })
          .min(1, { message: $t('account.messages.currentPasswordTip') }),
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          placeholder: $t('account.fields.newPassword'),
        },
        dependencies: {
          rules(values) {
            const currentPassword = values.currentPassword ?? '';
            return z
              .string({ error: $t('authentication.passwordTip') })
              .min(1, { message: $t('authentication.passwordTip') })
              .refine((value) => value !== currentPassword, {
                message: $t('account.validation.newPasswordSameAsCurrent'),
              })
              .refine(
                (value) =>
                  !!policy.value &&
                  getPasswordChecks(value).every((item) => item.valid),
                {
                  message: $t('account.validation.passwordPolicyNotMet'),
                },
              );
          },
          triggerFields: ['currentPassword', 'newPassword'],
        },
        fieldName: 'newPassword',
        label: $t('account.fields.newPassword'),
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          placeholder: $t('account.fields.confirmNewPassword'),
        },
        dependencies: {
          rules(values) {
            const { newPassword } = values;
            return z
              .string({ error: $t('authentication.passwordTip') })
              .min(1, { message: $t('authentication.passwordTip') })
              .refine((value) => value === newPassword, {
                message: $t('authentication.confirmPasswordTip'),
              });
          },
          triggerFields: ['newPassword'],
        },
        fieldName: 'confirmPassword',
        label: $t('account.fields.confirmNewPassword'),
      },
    ]),
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1 gap-y-5',
  }),
);

const policyItems = computed(() =>
  getPasswordChecks(formApi.form.values?.newPassword ?? ''),
);

function handleReset() {
  return formApi.reset();
}

async function handleSubmit() {
  if (loading.value || !policy.value) {
    return;
  }

  loading.value = true;
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const values = await formApi.getValues();
    const jwtPair = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (!jwtPair.token || !jwtPair.refreshToken) {
      throw new Error('Invalid password change response');
    }
    // 旧凭证失效,写入新 token
    accessStore.setAccessToken(jwtPair.token);
    accessStore.setRefreshToken(jwtPair.refreshToken);
    message.success($t('account.messages.changePasswordSuccess'));
    await handleReset();
  } finally {
    loading.value = false;
  }
}

async function loadPolicy() {
  loading.value = true;
  try {
    policy.value = await getUserPasswordPolicy();
  } catch {
    // The retry button remains available if the policy could not be loaded.
  } finally {
    loading.value = false;
  }
}
onMounted(loadPolicy);
</script>

<template>
  <FormSection :title="$t('account.actions.changePassword')">
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
      <fieldset
        class="min-w-0 border-r pr-8"
        :disabled="loading || !policy"
        @keydown.enter.prevent="handleSubmit"
      >
        <Form />
      </fieldset>
      <div class="min-w-0 space-y-4">
        <h4 class="m-0 text-sm font-semibold">
          {{ $t('account.sections.passwordRequirements') }}
        </h4>
        <VbenButton
          v-if="!policy"
          variant="link"
          :loading="loading"
          :disabled="loading"
          @click="loadPolicy"
        >
          {{ $t('tb.common.retry') }}
        </VbenButton>
        <ul class="space-y-2 text-sm" aria-live="polite">
          <li
            v-for="item in policyItems"
            :key="item.key"
            class="flex items-center gap-2"
            :class="item.valid ? 'text-success' : 'text-destructive'"
          >
            <IconifyIcon
              :icon="item.valid ? 'lucide:check' : 'lucide:x'"
              class="size-4 shrink-0"
            />
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div
      class="mt-6 flex flex-wrap items-center gap-3 pt-5 [&>.ant-btn]:min-w-20"
    >
      <VbenButton variant="outline" :disabled="loading" @click="handleReset">
        {{ $t('account.actions.discardChanges') }}
      </VbenButton>
      <VbenButton
        :disabled="loading || !policy"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('account.actions.changePassword') }}
      </VbenButton>
    </div>
  </FormSection>
</template>
