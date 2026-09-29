<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { UserPasswordPolicy } from '#/api/tb/auth';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';

import { notification } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  activateUser,
  getUserPasswordPolicy,
  resetPassword,
} from '#/api/tb/auth';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

defineOptions({ name: 'CreatePassword' });

// 两种邮件入口共用密码表单，令牌及提交接口由路由明确指定。
const props = defineProps<{ mode: 'activate' | 'reset' }>();
interface FormValues {
  password: string;
  confirmPassword: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(false);
const policy = ref<UserPasswordPolicy>();
const token = computed(() => {
  const queryToken =
    props.mode === 'activate'
      ? route.query.activateToken
      : route.query.resetToken;
  return typeof queryToken === 'string' && queryToken.trim() ? queryToken : '';
});
const title = computed(() =>
  props.mode === 'activate'
    ? $t('authentication.actions.createPassword')
    : $t('authentication.actions.resetPassword'),
);
const subtitle = computed(() =>
  props.mode === 'activate'
    ? $t('authentication.messages.createPasswordSubtitle')
    : $t('authentication.messages.resetPasswordSubtitle'),
);
const invalidLinkMessage = computed(() =>
  props.mode === 'activate'
    ? $t('authentication.validation.activateLinkInvalid')
    : $t('authentication.validation.resetLinkInvalid'),
);

function getPasswordChecks(password: string) {
  const passwordPolicy = policy.value;
  if (!passwordPolicy) return [];
  return [
    {
      limit: passwordPolicy.minimumLength,
      valid: password.length >= (passwordPolicy.minimumLength ?? 0),
      label: `${$t('account.validation.atLeast')} ${$t(
        'account.validation.pwdMinLength',
        { n: passwordPolicy.minimumLength },
      )}`,
    },
    {
      limit: passwordPolicy.maximumLength,
      valid: password.length <= (passwordPolicy.maximumLength ?? 0),
      label: `${$t('account.validation.atMost')} ${$t(
        'account.validation.pwdMaxLength',
        { n: passwordPolicy.maximumLength },
      )}`,
    },
    {
      limit: passwordPolicy.minimumUppercaseLetters,
      valid:
        (password.match(/[A-Z]/g)?.length ?? 0) >=
        (passwordPolicy.minimumUppercaseLetters ?? 0),
      label: `${$t('account.validation.atLeast')} ${$t(
        'account.validation.pwdMinUpper',
        {
          n: passwordPolicy.minimumUppercaseLetters,
        },
      )}`,
    },
    {
      limit: passwordPolicy.minimumLowercaseLetters,
      valid:
        (password.match(/[a-z]/g)?.length ?? 0) >=
        (passwordPolicy.minimumLowercaseLetters ?? 0),
      label: `${$t('account.validation.atLeast')} ${$t(
        'account.validation.pwdMinLower',
        {
          n: passwordPolicy.minimumLowercaseLetters,
        },
      )}`,
    },
    {
      limit: passwordPolicy.minimumDigits,
      valid:
        (password.match(/\d/g)?.length ?? 0) >=
        (passwordPolicy.minimumDigits ?? 0),
      label: `${$t('account.validation.atLeast')} ${$t(
        'account.validation.pwdMinDigits',
        { n: passwordPolicy.minimumDigits },
      )}`,
    },
    {
      // 与后端 EnglishCharacterData.Special 保持一致，仅统计 ASCII 标点。
      limit: passwordPolicy.minimumSpecialCharacters,
      valid:
        (password.match(
          /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g,
        )?.length ?? 0) >= (passwordPolicy.minimumSpecialCharacters ?? 0),
      label: `${$t('account.validation.atLeast')} ${$t(
        'account.validation.pwdMinSpecial',
        {
          n: passwordPolicy.minimumSpecialCharacters,
        },
      )}`,
    },
    {
      limit: passwordPolicy.allowWhitespaces === false ? 1 : 0,
      valid: !/\s/u.test(password),
      label: $t('account.validation.pwdNoWhitespace'),
    },
  ].filter(({ limit }) => (limit ?? 0) > 0);
}

const [Form, formApi] = useVbenForm<FormValues>(
  reactive({
    commonConfig: { hideLabel: true, hideRequiredMark: true },
    layout: 'vertical',
    schema: computed((): VbenFormSchema<FormValues>[] => [
      {
        component: 'VbenInputPassword',
        componentProps: {
          autocomplete: 'new-password',
          'aria-label': $t('authentication.password'),
          placeholder: $t('authentication.password'),
        },
        fieldName: 'password',
        label: $t('authentication.password'),
        rules: z
          .string({ error: $t('authentication.passwordTip') })
          .min(1, { message: $t('authentication.passwordTip') })
          .refine(
            (value) =>
              !!policy.value &&
              getPasswordChecks(value).every((item) => item.valid),
            {
              message: $t('account.validation.passwordPolicyNotMet'),
            },
          ),
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          autocomplete: 'new-password',
          'aria-label': $t('authentication.confirmPassword'),
          placeholder: $t('authentication.confirmPassword'),
        },
        fieldName: 'confirmPassword',
        label: $t('authentication.confirmPassword'),
        dependencies: {
          rules(values) {
            return z
              .string({ error: $t('authentication.passwordTip') })
              .min(1, { message: $t('authentication.passwordTip') })
              .refine((value) => value === values.password, {
                message: $t('authentication.confirmPasswordTip'),
              });
          },
          triggerFields: ['password'],
        },
      },
    ]),
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
  }),
);
const passwordChecks = computed(() =>
  getPasswordChecks(formApi.form.values?.password ?? ''),
);

async function loadPolicy() {
  isLoading.value = true;
  try {
    policy.value = await getUserPasswordPolicy();
  } catch {
    // 请求层显示错误；保留重试入口，策略获取成功前禁止提交。
  } finally {
    isLoading.value = false;
  }
}

watch(
  [() => props.mode, token],
  async () => {
    await formApi.reset();
    if (token.value && !policy.value) await loadPolicy();
  },
  { immediate: true },
);

async function handleSubmit() {
  if (isLoading.value || !token.value || !policy.value) return;
  isLoading.value = true;
  try {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const { password } = await formApi.getValues();
    if (props.mode === 'activate') {
      const pair = await activateUser({ activateToken: token.value, password });
      const userInfo = await authStore.loginWithToken(pair);
      notification.success({
        title: $t('authentication.messages.createPasswordSuccess'),
        description: `${$t('authentication.messages.createPasswordSuccessDesc')}: ${userInfo.realName}`,
      });
      await router.replace(
        userInfo.homePath || preferences.app.defaultHomePath,
      );
    } else {
      await resetPassword({ resetToken: token.value, password });
      notification.success({
        title: $t('authentication.messages.resetPasswordSuccess'),
        description: $t('authentication.messages.resetPasswordSuccessDesc'),
      });
      await authStore.logout(false, false);
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="mb-3 text-3xl/9 font-bold tracking-tight text-foreground lg:text-4xl"
      >
        {{ title }}
      </h2>
      <p class="lg:text-md text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>
    <div
      v-if="!token"
      role="alert"
      class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
    >
      {{ invalidLinkMessage }}
    </div>
    <template v-else>
      <fieldset
        :disabled="isLoading || !policy"
        @keydown.enter.prevent="handleSubmit"
      >
        <Form />
      </fieldset>
      <div
        v-if="!policy"
        class="mb-4 text-sm text-muted-foreground"
        role="status"
      >
        {{
          isLoading
            ? $t('authentication.messages.passwordPolicyLoading')
            : $t('authentication.messages.passwordPolicyLoadFailed')
        }}
        <VbenButton v-if="!isLoading" variant="link" @click="loadPolicy">
          {{ $t('tb.common.retry') }}
        </VbenButton>
      </div>
      <div
        v-else-if="passwordChecks.length"
        class="mb-5 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground"
      >
        <p class="mb-2 font-medium text-foreground">
          {{ $t('account.sections.passwordRequirements') }}
        </p>
        <ul class="list-inside list-disc space-y-1">
          <li
            v-for="item in passwordChecks"
            :key="item.label"
            :class="{ 'text-primary': item.valid }"
          >
            {{ item.label }}
          </li>
        </ul>
      </div>
      <VbenButton
        class="mt-2 w-full"
        :loading="isLoading"
        :disabled="isLoading || !policy"
        @click="handleSubmit"
      >
        {{ title }}
      </VbenButton>
    </template>
    <VbenButton
      class="mt-4 w-full"
      variant="outline"
      :disabled="isLoading"
      @click="router.push(LOGIN_PATH)"
    >
      {{ $t('authentication.actions.goToLogin') }}
    </VbenButton>
  </div>
</template>
