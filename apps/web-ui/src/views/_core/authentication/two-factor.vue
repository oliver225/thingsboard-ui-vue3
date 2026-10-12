<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type {
  TwoFaAccountConfig,
  TwoFaProviderInfo,
} from '#/api/tb/two-factor-auth';

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { useNow } from '@vueuse/core';
import { QRCode } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  checkTwoFaCode,
  finishTwoFaConfiguration,
  generateTwoFaConfig,
  getTwoFaConfigurationProviders,
  getTwoFaProviders,
  saveTwoFaConfig,
  sendTwoFaCode,
  submitTwoFaConfig,
} from '#/api/tb/two-factor-auth';
import { TwoFaProviderType } from '#/enums';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import { getTokenClaims } from '#/utils/auth';

const authStore = useAuthStore();
const challenge = authStore.challenge;
const now = useNow({ interval: 1000 });
const loading = ref(false);
const error = ref('');
const providers = ref<TwoFaProviderInfo[]>();
const record = ref<TwoFaAccountConfig>();
// 配置保存后登录失败，只重试登录，避免重复绑定认证方式。
const configured = ref(false);
const configuring = challenge?.scope === 'MFA_CONFIGURATION_TOKEN';
const expired = computed(
  () =>
    !challenge ||
    getTokenClaims(challenge.token).exp * 1000 <= now.value.getTime() ||
    authStore.challenge !== challenge,
);
const provider = computed(() =>
  providers.value?.find((item) => item.type === record.value?.providerType),
);
const contactRequired = computed(
  () =>
    record.value?.providerType === TwoFaProviderType.EMAIL ||
    record.value?.providerType === TwoFaProviderType.SMS,
);
const labels = computed(() => ({
  [TwoFaProviderType.TOTP]: $t('authentication.twoFactor.totp'),
  [TwoFaProviderType.EMAIL]: $t('authentication.twoFactor.email'),
  [TwoFaProviderType.SMS]: $t('authentication.twoFactor.sms'),
  [TwoFaProviderType.BACKUP_CODE]: $t('authentication.twoFactor.backup'),
}));
const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: { hideLabel: true, hideRequiredMark: true },
    layout: 'vertical',
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
    schema: computed((): VbenFormSchema[] => [
      {
        fieldName: 'email',
        component: 'VbenInput',
        componentProps: {
          autocomplete: 'email',
          'aria-label': $t('authentication.twoFactor.email'),
          placeholder: $t('authentication.twoFactor.email'),
        },
        label: $t('authentication.twoFactor.email'),
        hide:
          !configuring ||
          record.value?.providerType !== TwoFaProviderType.EMAIL,
        rules: z
          .string({ error: $t('authentication.validation.emailInvalid') })
          .trim()
          .email($t('authentication.validation.emailInvalid')),
      },
      {
        fieldName: 'phoneNumber',
        component: 'VbenInput',
        componentProps: {
          autocomplete: 'tel',
          'aria-label': $t('authentication.twoFactor.sms'),
          placeholder: $t('authentication.twoFactor.sms'),
        },
        label: $t('authentication.twoFactor.sms'),
        hide:
          !configuring || record.value?.providerType !== TwoFaProviderType.SMS,
        rules: z
          .string({ error: $t('authentication.twoFactor.contactRequired') })
          .trim()
          .min(1, $t('authentication.twoFactor.contactRequired')),
      },
      {
        fieldName: 'code',
        component: 'VbenInput',
        label: $t('authentication.twoFactor.code'),
        hide: contactRequired.value,
        componentProps: {
          'aria-label': $t('authentication.twoFactor.code'),
          autocomplete: 'one-time-code',
          placeholder:
            record.value?.providerType === TwoFaProviderType.BACKUP_CODE
              ? $t('authentication.twoFactor.backup')
              : $t('authentication.twoFactor.code'),
          disabled: loading.value,
        },
        rules: z
          .string({ error: $t('authentication.twoFactor.codeRequired') })
          .trim()
          .min(1, $t('authentication.twoFactor.codeRequired'))
          .refine(
            (value) =>
              record.value?.providerType === TwoFaProviderType.BACKUP_CODE ||
              value.length === 6,
            $t('authentication.codeTip', [6]),
          ),
      },
      {
        fieldName: 'verificationCode',
        component: 'VbenPinInput',
        label: $t('authentication.twoFactor.code'),
        hide: !contactRequired.value,
        componentProps: {
          key: record.value?.providerType,
          'aria-label': $t('authentication.twoFactor.code'),
          disabled: loading.value,
          maxTime: provider.value?.minVerificationCodeSendPeriod || 30,
          handleSendCode: handleSend,
          createText: (seconds: number) =>
            seconds
              ? $t('authentication.twoFactor.resendIn', { seconds })
              : $t('authentication.twoFactor.send'),
        },
        rules: z
          .string({ error: $t('authentication.twoFactor.codeRequired') })
          .length(6, $t('authentication.codeTip', [6])),
      },
    ]),
  }),
);

function handleError(cause: any) {
  if (!challenge || authStore.challenge !== challenge) return;
  if (cause.response?.status === 401) authStore.challenge = undefined;
  error.value =
    cause.response?.status === 429
      ? $t('authentication.twoFactor.rateLimited')
      : cause.response?.data?.message || $t('authentication.twoFactor.failed');
}

async function handleSelect(type: TwoFaProviderType) {
  if (!challenge || loading.value || expired.value || configured.value) return;
  loading.value = true;
  error.value = '';
  record.value = undefined;
  try {
    const accountConfig = configuring
      ? await generateTwoFaConfig(challenge.token, type)
      : { providerType: type };
    if (expired.value) return;
    record.value = { ...accountConfig, useByDefault: true };
    await formApi.reset();
    await formApi.setValues({
      email: record.value.email || '',
      phoneNumber: record.value.phoneNumber || '',
    });
  } catch (error) {
    handleError(error);
  } finally {
    loading.value = false;
  }
}

async function handleLoad() {
  if (!challenge || loading.value || expired.value) return;
  loading.value = true;
  error.value = '';
  try {
    let result: TwoFaProviderInfo[];
    if (configuring) {
      const types = await getTwoFaConfigurationProviders(challenge.token);
      result = types
        .filter((type) => type !== TwoFaProviderType.BACKUP_CODE)
        .map((type) => ({ type, default: false }));
    } else {
      result = await getTwoFaProviders(challenge.token);
    }
    if (expired.value) return;
    providers.value = result;
  } catch (error) {
    handleError(error);
  } finally {
    loading.value = false;
  }
  const first =
    providers.value?.find((item) => item.default) || providers.value?.[0];
  if (first) await handleSelect(first.type);
}

async function handleSend() {
  if (!challenge || expired.value || !record.value)
    throw new Error($t('authentication.twoFactor.expired'));
  const config = record.value;
  error.value = '';
  try {
    if (configuring) {
      const fieldName =
        config.providerType === TwoFaProviderType.EMAIL
          ? 'email'
          : 'phoneNumber';
      const { valid } = await formApi.validateField(fieldName);
      if (!valid)
        throw new Error($t('authentication.twoFactor.contactRequired'));
      const formValues = await formApi.getValues();
      if (expired.value || record.value !== config)
        throw new Error($t('authentication.twoFactor.expired'));
      await submitTwoFaConfig(challenge.token, {
        ...config,
        [fieldName]: formValues[fieldName].trim(),
      });
    } else {
      await sendTwoFaCode(challenge.token, config.providerType);
    }
  } catch (error) {
    if (record.value === config && !configured.value) handleError(error);
    // 交给验证码组件处理失败，发送失败时不启动倒计时。
    throw error;
  }
}

async function handleSubmit() {
  if (!challenge || loading.value || expired.value || !record.value) return;
  loading.value = true;
  error.value = '';
  try {
    let code = '';
    // 配置已保存时表单已卸载，重试只需完成登录。
    if (!configured.value) {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const formValues = await formApi.getValues();
      if (expired.value) return;
      code = (
        contactRequired.value ? formValues.verificationCode : formValues.code
      ).trim();
      if (configuring) {
        const config = { ...record.value };
        if (contactRequired.value) {
          const fieldName =
            config.providerType === TwoFaProviderType.EMAIL
              ? 'email'
              : 'phoneNumber';
          config[fieldName] = formValues[fieldName].trim();
        }
        await saveTwoFaConfig(challenge.token, config, code);
        if (expired.value) return;
        configured.value = true;
      }
    }
    const pair = configuring
      ? await finishTwoFaConfiguration(challenge.token)
      : await checkTwoFaCode(challenge.token, record.value.providerType, code);
    // 取消或离开页面后的迟到响应不能重新建立会话。
    if (expired.value) return;
    await authStore.completeLogin(pair);
  } catch (error) {
    handleError(error);
  } finally {
    loading.value = false;
  }
}

onMounted(handleLoad);
onUnmounted(() => {
  if (authStore.challenge === challenge) authStore.challenge = undefined;
});
</script>

<template>
  <div>
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="mb-3 text-3xl/9 font-bold tracking-tight text-foreground lg:text-4xl"
      >
        {{ $t('authentication.twoFactor.title') }}
      </h2>
      <p class="lg:text-md text-sm text-muted-foreground">
        {{
          configuring
            ? $t('authentication.twoFactor.configureDescription')
            : $t('authentication.twoFactor.description')
        }}
        <span v-if="record?.authUrl && !configured" class="mt-2 block">
          {{ $t('authentication.twoFactor.scan') }}
        </span>
      </p>
    </div>
    <p v-if="error" class="mb-4 text-destructive" role="alert">{{ error }}</p>
    <p v-if="expired" role="alert">
      {{ $t('authentication.twoFactor.expired') }}
    </p>
    <template v-else>
      <div v-if="providers?.length" class="mb-5 flex flex-wrap gap-2">
        <VbenButton
          v-for="item in providers"
          :key="item.type"
          :variant="record?.providerType === item.type ? 'default' : 'outline'"
          :disabled="loading || configured"
          @click="handleSelect(item.type)"
        >
          {{ labels[item.type] }}
        </VbenButton>
      </div>
      <template v-if="record">
        <QRCode
          v-if="record.authUrl && !configured"
          class="mb-5"
          :value="record.authUrl"
          color="#000000"
          bg-color="#ffffff"
        />
        <p v-if="provider?.contact" class="mb-3 text-sm">
          {{ provider.contact }}
        </p>
        <fieldset
          v-if="!configured"
          :disabled="loading"
          @keydown.enter.prevent="handleSubmit"
        >
          <Form />
        </fieldset>
        <VbenButton
          class="w-full"
          :loading="loading"
          :disabled="loading"
          @click="handleSubmit"
        >
          {{ $t('authentication.twoFactor.verify') }}
        </VbenButton>
      </template>
      <template v-else>
        <p v-if="providers?.length === 0" class="mb-4">
          {{ $t('authentication.twoFactor.noProviders') }}
        </p>
        <VbenButton :loading="loading" :disabled="loading" @click="handleLoad">
          {{ $t('tb.common.retry') }}
        </VbenButton>
      </template>
    </template>
    <VbenButton
      class="mt-4 w-full"
      variant="outline"
      @click="authStore.logout(false, false)"
    >
      {{ $t('authentication.actions.goToLogin') }}
    </VbenButton>
  </div>
</template>
