<script setup lang="ts">
import type { AuthApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { alert } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { VbenButton } from '@vben-core/shadcn-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { activateUser } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({
  name: 'CreatePasswordPage',
});
const authStore = useAuthStore();

const loading = ref(false);

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      hideLabel: true,
      hideRequiredMark: true,
    },
    schema: [
      {
        component: 'Input',
        dependencies: {
          show: false,
          triggerFields: ['activateToken'],
        },
        fieldName: 'activateToken',
        rules: 'required',
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          passwordStrength: true,
          placeholder: $t('authentication.password'),
        },
        fieldName: 'password',
        label: $t('authentication.password'),
        renderComponentContent() {
          return {
            strengthText: () => $t('authentication.passwordStrength'),
          };
        },
        rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          placeholder: $t('authentication.confirmPassword'),
        },
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
        label: $t('authentication.confirmPassword'),
      },
    ],
    showDefaultActions: false,
  }),
);

const router = useRouter();

onMounted(() => {
  const routerQuery = router.currentRoute.value.query;
  if ('activateToken' in routerQuery) {
    formApi.setValues({ activateToken: routerQuery.activateToken });
  } else {
    alert({
      icon: 'error',
      overlayBlur: 50,
      title: $t('页面错误'),
      content: $t('当前激活连接错误，请重新获取！'),
      confirmText: $t('返回登录'),
      beforeClose: async () => {
        await goToLogin();
        return true;
      },
    });
  }
});

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    message.loading({
      content: `${$t('page.submit.loading')}`,
      duration: 0,
      key: 'is-form-submitting',
    });
    try {
      const data = {
        ...values,
      } as AuthApi.ActivateUserParams;
      const jwtPawir = await activateUser(data);
      message.success({
        content: `${$t('page.auth.createPasswordSuccess')}`,
        duration: 2,
        key: 'is-form-submitting',
      });
      await authStore.tokenLogin(jwtPawir);
    } catch (error: any) {
      message.error({
        content: error.message || `${$t('page.submit.error')}`,
        duration: 2,
        key: 'is-form-submitting',
      });
    }
  }
}

async function goToLogin() {
  await router.push({ path: '/auth/login' });
}
</script>

<template>
  <div>
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="text-foreground mb-3 text-3xl font-bold leading-9 tracking-tight lg:text-4xl"
      >
        {{ $t('page.auth.createPassword') }} 🚀
      </h2>

      <p class="text-muted-foreground lg:text-md text-sm">
        {{ $t('创建密码 激活账户') }}
      </p>
    </div>
    <Form />
    <div class="flex items-center justify-between space-x-8">
      <VbenButton
        :class="{
          'cursor-wait': loading,
        }"
        :loading="loading"
        aria-label="register"
        class="mt-2 w-full"
        @click="handleSubmit"
      >
        <slot name="submitButtonText">
          {{ $t('page.auth.createPassword') }}
        </slot>
      </VbenButton>
      <VbenButton
        variant="outline"
        :loading="loading"
        class="mt-2 w-full"
        @click="goToLogin()"
      >
        <slot name="submitButtonText">
          {{ $t('common.cancel') }}
        </slot>
      </VbenButton>
    </div>

    <div class="mt-4 text-center text-sm">
      {{ $t('authentication.alreadyHaveAccount') }}
      <span class="vben-link text-sm font-normal" @click="goToLogin()">
        {{ $t('authentication.goToLogin') }}
      </span>
    </div>
  </div>
</template>
