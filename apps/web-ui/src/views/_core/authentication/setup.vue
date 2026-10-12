<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';

import { useVbenForm, z } from '#/adapter/form';
import { completeSetup } from '#/api/tb/noauth';
import { $t } from '#/locales';
import { useSetupStore } from '#/store/setup';

const router = useRouter();
const setupStore = useSetupStore();
const loading = ref(false);
const error = ref('');
const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      hideLabel: true,
      hideRequiredMark: true,
    },
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
    schema: computed((): VbenFormSchema[] => [
      {
        fieldName: 'email',
        component: 'VbenInput',
        label: $t('authentication.username'),
        componentProps: {
          'aria-label': $t('authentication.messages.usernameTip'),
          autocomplete: 'username',
          placeholder: $t('authentication.messages.usernameTip'),
        },
        rules: z.email({ error: $t('authentication.validation.emailInvalid') }),
      },
      {
        fieldName: 'password',
        component: 'VbenInputPassword',
        label: $t('authentication.password'),
        componentProps: {
          'aria-label': $t('authentication.password'),
          autocomplete: 'new-password',
          placeholder: $t('authentication.password'),
        },
        rules: z
          .string({ error: $t('authentication.passwordTip') })
          .min(1, $t('authentication.passwordTip')),
      },
      {
        fieldName: 'confirmPassword',
        component: 'VbenInputPassword',
        label: $t('authentication.confirmPassword'),
        componentProps: {
          'aria-label': $t('authentication.confirmPassword'),
          autocomplete: 'new-password',
          placeholder: $t('authentication.confirmPassword'),
        },
        dependencies: {
          triggerFields: ['password'],
          rules: (values) =>
            z
              .string({ error: $t('authentication.passwordTip') })
              .min(1, $t('authentication.passwordTip'))
              .refine(
                (value) => value === values.password,
                $t('authentication.confirmPasswordTip'),
              ),
        },
      },
      {
        fieldName: 'loadDemo',
        component: 'TbCheckbox',
        label: $t('authentication.setup.loadDemo'),
        componentProps: {
          class: 'setup-demo-option',
          title: $t('authentication.setup.loadDemo'),
          description: $t('authentication.setup.loadDemoDescription'),
          disabled: loading.value,
        },
        defaultValue: false,
      },
    ]),
  }),
);

async function handleRetry() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    if ((await setupStore.load(true)) === 'READY')
      await router.replace(LOGIN_PATH);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (loading.value || setupStore.status !== 'ACCOUNT_REQUIRED') return;
  const { valid } = await formApi.validate();
  if (!valid) return;
  loading.value = true;
  error.value = '';
  try {
    const values = await formApi.getValues();
    await completeSetup({
      email: values.email.trim(),
      password: values.password,
      loadDemo: !!values.loadDemo,
    });
    await formApi.reset();
  } catch (error: any) {
    error.value =
      error.response?.data?.message || $t('authentication.setup.failed');
  } finally {
    // 创建成功或响应丢失后都重新查询，不重复提交创建请求。
    const status = await setupStore.load(true);
    loading.value = false;
    if (status === 'READY') await router.replace(LOGIN_PATH);
  }
}
</script>

<template>
  <div>
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="mb-3 text-3xl/9 font-bold tracking-tight text-foreground lg:text-4xl"
      >
        {{ $t('authentication.setup.title') }}
        <span class="ml-2 inline-block" aria-hidden="true">🚀</span>
      </h2>
      <p class="lg:text-md text-sm text-muted-foreground">
        {{ $t('authentication.setup.description') }}
      </p>
    </div>
    <p v-if="error" class="mb-4 text-destructive" role="alert">{{ error }}</p>
    <template v-if="setupStore.status === 'ACCOUNT_REQUIRED'">
      <fieldset :disabled="loading" @keydown.enter.prevent="handleSubmit">
        <Form />
      </fieldset>
      <VbenButton
        class="w-full"
        :loading="loading"
        :disabled="loading"
        @click="handleSubmit"
      >
        {{ $t('authentication.setup.submit') }}
      </VbenButton>
    </template>
    <p v-else-if="setupStore.status === 'READY'" role="status">
      {{ $t('authentication.setup.ready') }}
    </p>
    <template v-else>
      <p class="mb-4" role="status">
        {{
          setupStore.status
            ? $t('authentication.setup.unsupported', {
                status: setupStore.status,
              })
            : $t('authentication.setup.unavailable')
        }}
      </p>
      <VbenButton :loading="loading" :disabled="loading" @click="handleRetry">
        {{ $t('tb.common.retry') }}
      </VbenButton>
    </template>
  </div>
</template>

<style scoped>
:deep(.setup-demo-option) {
  padding: 1rem;
  border-radius: 0.5rem;
}

:deep(.setup-demo-option [id$='-description']) {
  margin-top: 0.5rem;
}
</style>
