<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';

import { notification } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { resetPasswordByEmail } from '#/api/tb/auth';
import { $t } from '#/locales';

defineOptions({ name: 'ForgetPassword' });

interface FormValues {
  email: string;
}

const router = useRouter();
const isLoading = ref(false);
const [Form, formApi] = useVbenForm<FormValues>(
  reactive({
    commonConfig: { hideLabel: true, hideRequiredMark: true },
    layout: 'vertical',
    schema: computed((): VbenFormSchema<FormValues>[] => [
      {
        component: 'VbenInput',
        componentProps: {
          autocomplete: 'email',
          'aria-label': $t('authentication.email'),
          type: 'email',
          placeholder: $t('authentication.emailTip'),
        },
        fieldName: 'email',
        label: $t('authentication.email'),
        rules: z
          .string({ error: $t('authentication.emailTip') })
          .trim()
          .min(1, { message: $t('authentication.emailTip') })
          .email($t('authentication.emailValidErrorTip')),
      },
    ]),
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
  }),
);

async function handleSubmit() {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const { email } = await formApi.getValues();
    await resetPasswordByEmail(email.trim());
    notification.success({
      title: $t('authentication.messages.resetEmailSent'),
      description: $t('authentication.messages.resetEmailSentDesc'),
      duration: 0,
    });
    await router.replace(LOGIN_PATH);
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
        {{ $t('authentication.forgetPassword') }}
      </h2>
      <p class="lg:text-md text-sm text-muted-foreground">
        {{ $t('authentication.messages.forgetPasswordSubtitle') }}
      </p>
    </div>
    <fieldset :disabled="isLoading" @keydown.enter.prevent="handleSubmit">
      <Form />
    </fieldset>
    <VbenButton
      class="mt-2 w-full"
      :loading="isLoading"
      :disabled="isLoading"
      @click="handleSubmit"
    >
      {{ $t('authentication.sendResetLink') }}
    </VbenButton>
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
