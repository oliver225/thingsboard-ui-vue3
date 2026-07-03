<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';
import { $t } from '@vben/locales';

import { notification } from 'antdv-next';

import { resetPasswordByEmail } from '#/api/tb/auth';

defineOptions({ name: 'ForgetPassword' });

const router = useRouter();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'example@thingsboard.org',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailTip') })
        .email($t('authentication.emailValidErrorTip')),
    },
  ];
});

async function handleSubmit(values: Recordable<any>) {
  if (!values?.email) return;
  loading.value = true;
  try {
    await resetPasswordByEmail(values.email);
    // 后端出于安全考虑总是返回 200,无法区分邮箱是否存在
    notification.success({
      description: $t('tb.auth.resetEmailSentDesc'),
      duration: 0,
      title: $t('tb.auth.resetEmailSent'),
    });
    await router.push(LOGIN_PATH);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
