<script lang="ts" setup>
/**
 * 创建密码 / 激活账号页
 * TB 激活邮件链接:{baseUrl}/noauth/activate?activateToken=xxx
 * 校验通过后调用 POST /api/noauth/activate 设置密码并直接登录。
 */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { notification } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { activateUser } from '#/api/tb/auth';
import { useAuthStore } from '#/store';

defineOptions({ name: 'CreatePassword' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const accessStore = useAccessStore();

const loading = ref(false);
const activateToken = ref('');

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
  const token = route.query.activateToken;
  if (typeof token === 'string' && token) {
    activateToken.value = token;
  } else {
    notification.error({
      description: $t('tb.auth.activateLinkInvalid'),
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
  if (!valid || !activateToken.value) return;
  const { password } = await formApi.getValues();
  loading.value = true;
  try {
    // 激活成功直接返回 JwtPair,免再次登录
    const jwtPair = await activateUser({
      activateToken: activateToken.value,
      password,
    });
    accessStore.setAccessToken(jwtPair.token);
    accessStore.setRefreshToken(jwtPair.refreshToken);
    const userInfo = await authStore.fetchUserInfo();
    accessStore.setAccessCodes(userInfo.roles ?? []);
    notification.success({
      description: `${$t('tb.auth.createPasswordSuccessDesc')}: ${userInfo.realName}`,
      duration: 3,
      title: $t('tb.auth.createPasswordSuccess'),
    });
    await router.push(userInfo.homePath || preferences.app.defaultHomePath);
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
        {{ $t('tb.auth.createPassword') }} 🚀
      </h2>
      <p class="text-sm text-muted-foreground lg:text-base">
        {{ $t('tb.auth.createPasswordSubtitle') }}
      </p>
    </div>

    <Form />

    <VbenButton
      :class="{
        'cursor-wait': loading,
      }"
      :loading="loading"
      aria-label="login"
      class="w-full"
      @click="handleSubmit"
    >
      {{ $t('tb.auth.createPassword') }}
    </VbenButton>

    <div class="mt-4 text-center text-sm">
      {{ $t('tb.auth.alreadyHaveAccount') }}
      <VbenButton class="px-1" variant="link" @click="goToLogin">
        {{ $t('tb.auth.goToLogin') }}
      </VbenButton>
    </div>
  </div>
</template>
