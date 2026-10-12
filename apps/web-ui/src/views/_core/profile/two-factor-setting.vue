<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type {
  AccountTwoFaSettings,
  TwoFaAccountConfig,
} from '#/api/tb/two-factor-auth';

import { computed, onMounted, reactive, ref } from 'vue';

import { confirm, useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob } from '@vben/utils';

import { message, QRCode } from 'antdv-next';

import TbSwitch from '#/adapter/component/tb-switch.vue';
import { useVbenForm, z } from '#/adapter/form';
import {
  deleteAccountTwoFaConfig,
  generateAccountTwoFaConfig,
  getAccountTwoFaProviders,
  getAccountTwoFaSettings,
  saveAccountTwoFaConfig,
  submitAccountTwoFaConfig,
  updateAccountTwoFaConfig,
} from '#/api/tb/two-factor-auth';
import { FormSection } from '#/components/form-section';
import { TwoFaProviderType } from '#/enums';
import { $t } from '#/locales';

const loading = ref(false);
const providers = ref<TwoFaProviderType[]>();
const settings = ref<AccountTwoFaSettings>({ configs: {} });
const record = ref<TwoFaAccountConfig>();
const primaryProviderCount = computed(
  () =>
    Object.values(settings.value.configs).filter(
      (config) => config.providerType !== TwoFaProviderType.BACKUP_CODE,
    ).length,
);
const labels = computed(() => ({
  [TwoFaProviderType.TOTP]: $t('authentication.twoFactor.totp'),
  [TwoFaProviderType.EMAIL]: $t('authentication.twoFactor.email'),
  [TwoFaProviderType.SMS]: $t('authentication.twoFactor.sms'),
  [TwoFaProviderType.BACKUP_CODE]: $t('authentication.twoFactor.backup'),
}));

const [Modal, modalApi] = useVbenModal({
  onConfirm: handleSave,
  onClosed() {
    record.value = undefined;
  },
});
const modalState = modalApi.useStore();

const [Form, formApi] = useVbenForm(
  reactive({
    layout: 'vertical',
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
    schema: computed((): VbenFormSchema[] => [
      {
        fieldName: 'email',
        component: 'VbenInput',
        label: $t('authentication.twoFactor.email'),
        hide: record.value?.providerType !== TwoFaProviderType.EMAIL,
        componentProps: {
          autocomplete: 'email',
          placeholder: $t('authentication.twoFactor.email'),
        },
        rules: z
          .string({ error: $t('authentication.validation.emailInvalid') })
          .trim()
          .email($t('authentication.validation.emailInvalid')),
      },
      {
        fieldName: 'phoneNumber',
        component: 'VbenInput',
        label: $t('authentication.twoFactor.sms'),
        hide: record.value?.providerType !== TwoFaProviderType.SMS,
        componentProps: {
          autocomplete: 'tel',
          placeholder: $t('authentication.twoFactor.sms'),
        },
        rules: z
          .string({ error: $t('authentication.twoFactor.contactRequired') })
          .trim()
          .min(1, $t('authentication.twoFactor.contactRequired')),
      },
      {
        fieldName: 'code',
        component: 'VbenInput',
        label: $t('authentication.twoFactor.code'),
        hide: record.value?.providerType !== TwoFaProviderType.TOTP,
        componentProps: {
          autocomplete: 'one-time-code',
          inputmode: 'numeric',
          maxlength: 6,
        },
        rules: z
          .string({ error: $t('authentication.twoFactor.codeRequired') })
          .regex(/^\d{6}$/, $t('authentication.codeTip', [6])),
      },
      {
        fieldName: 'verificationCode',
        component: 'VbenPinInput',
        label: $t('authentication.twoFactor.code'),
        hide:
          record.value?.providerType !== TwoFaProviderType.EMAIL &&
          record.value?.providerType !== TwoFaProviderType.SMS,
        componentProps: {
          key: record.value?.providerType,
          'aria-label': $t('authentication.twoFactor.code'),
          disabled: modalState.value.submitting,
          handleSendCode: handleSend,
          createText: (seconds: number) =>
            seconds
              ? $t('authentication.twoFactor.resendIn', { seconds })
              : $t('authentication.twoFactor.send'),
        },
        rules: z
          .string({ error: $t('authentication.twoFactor.codeRequired') })
          .regex(/^\d{6}$/, $t('authentication.codeTip', [6])),
      },
    ]),
  }),
);

async function handleLoad() {
  loading.value = true;
  try {
    const [available, account] = await Promise.all([
      getAccountTwoFaProviders(),
      getAccountTwoFaSettings(),
    ]);
    providers.value = available;
    settings.value = account || { configs: {} };
  } catch {
    // 请求层统一显示错误。
  } finally {
    loading.value = false;
  }
}

async function handleConfigure(type: TwoFaProviderType) {
  if (loading.value) return false;
  loading.value = true;
  try {
    const config = await generateAccountTwoFaConfig(type);
    if (type === TwoFaProviderType.BACKUP_CODE) {
      if (settings.value.configs[type]) {
        // 后端禁止覆盖已有配置；删除成功后立即同步，保存失败也不显示旧码仍有效。
        settings.value = await deleteAccountTwoFaConfig(type);
      }
      settings.value = await saveAccountTwoFaConfig(config);
    }
    record.value = config;
    modalApi.open();
    if (type !== TwoFaProviderType.BACKUP_CODE) {
      modalApi.lock();
      await formApi.reset();
      await formApi.setValues({
        email: config.email || '',
        phoneNumber: config.phoneNumber || '',
      });
    }
    return true;
  } catch {
    return false;
  } finally {
    modalApi.unlock();
    loading.value = false;
  }
}

async function handleToggle(type: TwoFaProviderType) {
  if (!settings.value.configs[type]) {
    return handleConfigure(type);
  }
  await confirm({
    icon: 'warning',
    title: $t('account.twoFactor.disableTitle', { name: labels.value[type] }),
    content:
      type !== TwoFaProviderType.BACKUP_CODE && primaryProviderCount.value === 1
        ? $t('account.twoFactor.disableLast')
        : $t('account.twoFactor.disableDescription'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      loading.value = true;
      try {
        settings.value = await deleteAccountTwoFaConfig(type);
        return true;
      } catch {
        return false;
      } finally {
        loading.value = false;
      }
    },
  });
}

async function handleDefault(type: TwoFaProviderType) {
  loading.value = true;
  try {
    settings.value = await updateAccountTwoFaConfig(type);
  } catch {
    /* 请求层显示错误，保留原默认方式。 */
  } finally {
    loading.value = false;
  }
}

async function handleRegenerate() {
  await confirm({
    icon: 'warning',
    title: $t('account.twoFactor.regenerate'),
    content: $t('account.twoFactor.replaceWarning', {
      count:
        settings.value.configs[TwoFaProviderType.BACKUP_CODE]?.codesLeft || 0,
    }),
    beforeClose: ({ isConfirm }) =>
      isConfirm ? handleConfigure(TwoFaProviderType.BACKUP_CODE) : true,
  });
}

async function handleSend() {
  if (!record.value) throw new Error($t('account.messages.loadFailed'));
  const config = record.value;
  const fieldName =
    config.providerType === TwoFaProviderType.EMAIL ? 'email' : 'phoneNumber';
  const { valid } = await formApi.validateField(fieldName);
  if (!valid) throw new Error($t('authentication.twoFactor.contactRequired'));
  const formValues = await formApi.getValues();
  if (record.value !== config)
    throw new Error($t('account.messages.loadFailed'));
  await submitAccountTwoFaConfig({
    ...config,
    [fieldName]: formValues[fieldName].trim(),
  });
}

async function handleSave(): Promise<void> {
  if (!record.value) return;
  if (record.value.codes) return modalApi.close();
  const { valid } = await formApi.validate();
  if (!valid) return;
  modalApi.lock();
  try {
    const formValues = await formApi.getValues();
    const config = { ...record.value };
    if (config.providerType !== TwoFaProviderType.TOTP) {
      const fieldName =
        config.providerType === TwoFaProviderType.EMAIL
          ? 'email'
          : 'phoneNumber';
      config[fieldName] = formValues[fieldName].trim();
    }
    settings.value = await saveAccountTwoFaConfig(
      config,
      config.providerType === TwoFaProviderType.TOTP
        ? formValues.code
        : formValues.verificationCode,
    );
    message.success($t('tb.common.saveSuccess'));
    modalApi.close();
  } catch {
    /* 保留表单，允许修改验证码后重试。 */
  } finally {
    modalApi.unlock();
  }
}

function handleDownload() {
  if (!record.value?.codes) return;
  downloadFileFromBlob({
    fileName: 'backup-codes.txt',
    source: new Blob([record.value.codes.join('\r\n')], {
      type: 'text/plain;charset=utf-8',
    }),
  });
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(record.value?.codes?.join('\n') || '');
    message.success($t('account.messages.copied'));
  } catch {
    message.error($t('account.messages.copyFailed'));
  }
}

onMounted(handleLoad);
</script>

<template>
  <FormSection
    :title="$t('authentication.twoFactor.title')"
    :description="$t('account.twoFactor.description')"
  >
    <p v-if="providers?.length === 0" class="text-muted-foreground">
      {{ $t('authentication.twoFactor.noProviders') }}
    </p>
    <div v-else class="divide-y divide-border" :aria-busy="loading">
      <div
        v-for="type in providers"
        :key="type"
        class="py-4 first:pt-0 last:pb-0"
      >
        <TbSwitch
          :title="labels[type]"
          :checked="!!settings.configs[type]"
          :disabled="
            loading ||
            (type === TwoFaProviderType.BACKUP_CODE && !primaryProviderCount)
          "
          @update:checked="handleToggle(type)"
        >
          <template #description>
            <template v-if="type === TwoFaProviderType.BACKUP_CODE">
              {{
                !primaryProviderCount
                  ? $t('account.twoFactor.backupRequiresProvider')
                  : settings.configs[type]
                    ? $t('account.twoFactor.codesLeft', {
                        count: settings.configs[type]?.codesLeft || 0,
                      })
                    : $t('account.twoFactor.backupDescription')
              }}
            </template>
            <template v-else-if="settings.configs[type]">
              {{
                settings.configs[type]?.email ||
                settings.configs[type]?.phoneNumber ||
                $t('account.twoFactor.authenticatorEnabled')
              }}
            </template>
            <template v-else>{{ $t('account.twoFactor.enableHint') }}</template>
            <div
              v-if="settings.configs[type]"
              class="mt-2 flex flex-wrap items-center gap-3"
            >
              <VbenButton
                v-if="type === TwoFaProviderType.BACKUP_CODE"
                variant="outline"
                :disabled="loading"
                @click.stop="handleRegenerate"
              >
                {{ $t('account.twoFactor.regenerate') }}
              </VbenButton>
              <span
                v-else-if="settings.configs[type]?.useByDefault"
                class="text-sm text-primary"
              >
                {{ $t('account.twoFactor.defaultProvider') }}
              </span>
              <VbenButton
                v-else-if="primaryProviderCount > 1"
                variant="outline"
                :disabled="loading"
                @click.stop="handleDefault(type)"
              >
                {{ $t('account.twoFactor.setDefault') }}
              </VbenButton>
            </div>
          </template>
        </TbSwitch>
      </div>
    </div>
    <Modal
      class="w-[calc(100%_-_2rem)] max-w-xl rounded-xl"
      content-class="px-6 pt-5 pb-5"
      :confirm-text="
        record?.codes
          ? $t('account.twoFactor.done')
          : $t('account.twoFactor.verifySave')
      "
      :show-cancel-button="!record?.codes"
    >
      <template #title>
        <span class="flex items-center gap-2">
          <IconifyIcon
            :icon="record?.codes ? 'lucide:key-round' : 'lucide:shield-check'"
            class="size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          {{
            record?.codes
              ? $t('account.twoFactor.backupTitle')
              : $t('account.twoFactor.configureTitle', {
                  name: record ? labels[record.providerType] : '',
                })
          }}
        </span>
      </template>
      <template v-if="record?.codes">
        <p class="text-muted-foreground">
          {{ $t('account.twoFactor.backupDescription') }}
        </p>
        <div class="my-6 grid grid-cols-2 gap-4 text-center font-mono text-lg">
          <span v-for="code in record.codes" :key="code">{{ code }}</span>
        </div>
        <div class="flex gap-3">
          <VbenButton variant="outline" @click="handleDownload">
            {{ $t('account.twoFactor.download') }}
          </VbenButton>
          <VbenButton variant="outline" @click="handleCopy">
            {{ $t('account.twoFactor.copy') }}
          </VbenButton>
        </div>
        <p class="mt-5 text-muted-foreground">
          {{ $t('account.twoFactor.backupOnce') }}
        </p>
      </template>
      <template v-else-if="record">
        <template v-if="record.authUrl">
          <p class="mb-4 text-muted-foreground">
            {{ $t('authentication.twoFactor.scan') }}
          </p>
          <QRCode
            class="mb-5"
            :value="record.authUrl"
            color="#000000"
            bg-color="#ffffff"
          />
        </template>
        <fieldset
          :disabled="modalState.submitting"
          @keydown.enter.prevent="handleSave"
        >
          <Form />
        </fieldset>
      </template>
    </Modal>
  </FormSection>
</template>
