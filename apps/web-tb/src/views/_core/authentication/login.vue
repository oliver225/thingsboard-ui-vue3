<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

import TechSupport from './tech-support.vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

// const MOCK_USER_OPTIONS: BasicOption[] = [
//   {
//     label: 'Super',
//     value: 'vben',
//   },
//   {
//     label: 'Admin',
//     value: 'admin',
//   },
//   {
//     label: 'User',
//     value: 'jack',
//   },
// ];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    sub-title="请输入 Thingsboard 账户信息开始进入系统"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  >
    <template #third-party-login>
      <TechSupport />
    </template>
  </AuthenticationLogin>
</template>
