<script lang="ts" setup>
/**
 * 重置密码页
 * TB 重置邮件链接 GET /api/noauth/resetPassword?resetToken=xxx 会 303 跳转到
 * {baseUrl}/login/resetPassword?resetToken=xxx
 * 提交调用 POST /api/noauth/resetPassword 设置新密码,成功后旧会话失效,需重新登录。
 */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';
import { $t } from '@vben/locales';

import { notification } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { resetPassword } from '#/api/tb/auth';

defineOptions({ name: 'ResetPassword' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const resetToken = ref('');

const [Form, formApi] = useVbenForm({
  commonConfig: { hideLabel: true, hideRequiredMark: true },
  schema: [
    {
      component: 'VbenInputPassword',
      componentProps: { placeholder: $t('authentication.password') },
      fieldName: 'password',
      rules: z.string().min(6, { message: $t('tb.auth.passwordMinTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: { placeholder: $t('authentication.confirmPassword') },
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: $t('authentication.passwordTip') })
            .min(1, { message: $t('authentication.passwordTip') })
            .refine((value) => value === password, {
              message: $t('authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
    },
  ],
  showDefaultActions: false,
});

onMounted(() => {
  const token = route.query.resetToken;
  if (typeof token === 'string' && token) {
    resetToken.value = token;
  } else {
    notification.error({
      description: $t('tb.auth.resetLinkInvalid'),
      duration: 0,
      title: $t('tb.auth.linkInvalid'),
    });
    router.push(LOGIN_PATH);
  }
});

function goToLogin() {
  router.push(LOGIN_PATH);
}

async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !resetToken.value) return;
  const { password } = await formApi.getValues();
  loading.value = true;
  try {
    // 重置成功不返回 token,旧会话失效,需用新密码重新登录
    await resetPassword({ password, resetToken: resetToken.value });
    notification.success({
      description: $t('tb.auth.resetPasswordSuccessDesc'),
      duration: 3,
      title: $t('tb.auth.resetPasswordSuccess'),
    });
    await router.push(LOGIN_PATH);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="mb-7">
      <h2
        class="mb-3 text-3xl font-bold leading-9 tracking-tight text-foreground lg:text-4xl"
      >
        {{ $t('tb.auth.resetPassword') }} 🔒
      </h2>
      <p class="text-sm text-muted-foreground lg:text-base">
        {{ $t('tb.auth.resetPasswordSubtitle') }}
      </p>
    </div>

    <Form />

    <VbenButton
      :class="{
        'cursor-wait': loading,
      }"
      :loading="loading"
      aria-label="reset-password"
      class="w-full"
      @click="handleSubmit"
    >
      {{ $t('tb.auth.resetPassword') }}
    </VbenButton>

    <div class="mt-4 text-center text-sm">
      {{ $t('tb.auth.alreadyHaveAccount') }}
      <VbenButton class="px-1" variant="link" @click="goToLogin">
        {{ $t('tb.auth.goToLogin') }}
      </VbenButton>
    </div>
  </div>
</template>
