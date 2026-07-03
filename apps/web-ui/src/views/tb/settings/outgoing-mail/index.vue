<script lang="ts" setup>
import type { AdminSettings, MailServerSettings } from '#/api/tb/admin';

import { computed, onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  message,
  Select,
  Switch,
} from 'antdv-next';

import {
  getAdminSettings,
  saveAdminSettings,
  sendTestMail,
} from '#/api/tb/admin';

const formRef = ref();
/** 是否处于「更改密码」状态(用于设置新密码) */
const changePassword = ref(false);

/** 邮件服务器设置(整个 AdminSettings) */
const mailForm = reactive<AdminSettings<MailServerSettings>>({
  jsonValue: {
    enableOauth2: false,
    enableProxy: false,
    enableTls: false,
    mailFrom: '',
    providerId: 'CUSTOM',
    proxyHost: '',
    proxyPassword: '',
    proxyPort: null,
    proxyUser: '',
    smtpHost: 'localhost',
    smtpPort: 25,
    smtpProtocol: 'smtp',
    timeout: 10_000,
    tlsVersion: 'TLSv1.2',
    username: '',
  },
  key: 'mail',
});

/** 已配置密码时(showChangePassword)展示「更改密码」开关,否则直接展示密码输入 */
const hasPassword = computed(() => !!mailForm.jsonValue.showChangePassword);
const showPasswordInput = computed(
  () => !hasPassword.value || changePassword.value,
);

async function loadMail() {
  changePassword.value = false;
  try {
    Object.assign(mailForm, await getAdminSettings<MailServerSettings>('mail'));
  } catch {
    // 读取失败(如权限不足)静默
  }
}

/** 组装提交数据:空密码不下发,避免覆盖已保存的密码 */
function buildPayload(): AdminSettings<MailServerSettings> {
  const jsonValue = { ...mailForm.jsonValue };
  if (!jsonValue.password) {
    delete jsonValue.password;
  }
  return { ...mailForm, jsonValue };
}

async function saveMail() {
  await formRef.value?.validate();
  Object.assign(mailForm, await saveAdminSettings(buildPayload()));
  changePassword.value = false;
  message.success($t('tb.common.saveSuccess'));
}

async function handleSendTestMail() {
  await formRef.value?.validate();
  await sendTestMail(buildPayload());
  message.success($t('tb.settings.mail.testMailSuccess'));
}

onMounted(loadMail);
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="text-lg font-semibold">
        {{ $t('tb.settings.mail.title') }}
      </div>

      <Form ref="formRef" class="!mt-4" layout="vertical" :model="mailForm">
        <FormItem
          :label="$t('tb.settings.mail.mailFrom')"
          :name="['jsonValue', 'mailFrom']"
          :rules="[
            {
              required: true,
              message: $t('tb.settings.mail.mailFromRequired'),
            },
          ]"
        >
          <Input
            v-model:value="mailForm.jsonValue.mailFrom"
            allow-clear
            size="large"
            :placeholder="$t('tb.settings.mail.mailFromPlaceholder')"
          />
        </FormItem>

        <!-- 连接设置 -->
        <div class="border-border mb-4 rounded-md border px-4 py-3">
          <div class="mb-3 text-sm font-bold">
            {{ $t('tb.settings.mail.connection') }}
          </div>
          <div class="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <FormItem
              :label="$t('tb.settings.mail.smtpProtocol')"
              :name="['jsonValue', 'smtpProtocol']"
            >
              <Select
                v-model:value="mailForm.jsonValue.smtpProtocol"
                :options="[
                  { label: 'SMTP', value: 'smtp' },
                  { label: 'SMTPS', value: 'smtps' },
                ]"
              />
            </FormItem>
            <FormItem
              :label="$t('tb.settings.mail.timeout')"
              :name="['jsonValue', 'timeout']"
              :rules="[
                {
                  required: true,
                  message: $t('tb.settings.mail.timeoutRequired'),
                },
              ]"
            >
              <InputNumber
                v-model:value="mailForm.jsonValue.timeout"
                class="w-full"
                :min="0"
              />
            </FormItem>
            <FormItem
              :label="$t('tb.settings.mail.smtpHost')"
              :name="['jsonValue', 'smtpHost']"
              :rules="[
                {
                  required: true,
                  message: $t('tb.settings.mail.smtpHostRequired'),
                },
              ]"
            >
              <Input v-model:value="mailForm.jsonValue.smtpHost" allow-clear />
            </FormItem>
            <FormItem
              :label="$t('tb.settings.mail.smtpPort')"
              :name="['jsonValue', 'smtpPort']"
              :rules="[
                {
                  required: true,
                  message: $t('tb.settings.mail.smtpPortRequired'),
                },
              ]"
            >
              <InputNumber
                v-model:value="mailForm.jsonValue.smtpPort"
                class="w-full"
                :max="65_535"
                :min="1"
              />
            </FormItem>
          </div>

          <FormItem class="!mb-2">
            <div class="flex items-center gap-2">
              <Switch v-model:checked="mailForm.jsonValue.enableTls" />
              <span class="text-sm">{{
                $t('tb.settings.mail.enableTls')
              }}</span>
            </div>
          </FormItem>
          <FormItem
            v-if="mailForm.jsonValue.enableTls"
            :label="$t('tb.settings.mail.tlsVersion')"
            :name="['jsonValue', 'tlsVersion']"
            :rules="[
              {
                required: true,
                message: $t('tb.settings.mail.tlsVersionRequired'),
              },
            ]"
          >
            <Select
              v-model:value="mailForm.jsonValue.tlsVersion"
              class="sm:!w-1/2"
              :options="
                ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'].map((v) => ({
                  label: v,
                  value: v,
                }))
              "
            />
          </FormItem>

          <FormItem class="!mb-2">
            <div class="flex items-center gap-2">
              <Switch v-model:checked="mailForm.jsonValue.enableProxy" />
              <span class="text-sm">
                {{ $t('tb.settings.mail.enableProxy') }}
              </span>
            </div>
          </FormItem>
          <div
            v-if="mailForm.jsonValue.enableProxy"
            class="grid grid-cols-1 gap-x-6 sm:grid-cols-2"
          >
            <FormItem
              :label="$t('tb.settings.mail.proxyHost')"
              :name="['jsonValue', 'proxyHost']"
              :rules="[
                {
                  required: true,
                  message: $t('tb.settings.mail.proxyHostRequired'),
                },
              ]"
            >
              <Input v-model:value="mailForm.jsonValue.proxyHost" allow-clear />
            </FormItem>
            <FormItem
              :label="$t('tb.settings.mail.proxyPort')"
              :name="['jsonValue', 'proxyPort']"
              :rules="[
                {
                  required: true,
                  message: $t('tb.settings.mail.proxyPortRequired'),
                },
              ]"
            >
              <InputNumber
                v-model:value="mailForm.jsonValue.proxyPort"
                class="w-full"
                :max="65_535"
                :min="1"
              />
            </FormItem>
            <FormItem
              :label="$t('tb.settings.mail.proxyUser')"
              :name="['jsonValue', 'proxyUser']"
            >
              <Input v-model:value="mailForm.jsonValue.proxyUser" allow-clear />
            </FormItem>
            <FormItem
              :label="$t('tb.settings.mail.proxyPassword')"
              :name="['jsonValue', 'proxyPassword']"
            >
              <InputPassword v-model:value="mailForm.jsonValue.proxyPassword" />
            </FormItem>
          </div>
        </div>

        <!-- 身份验证 -->
        <div class="border-border rounded-md border px-4 py-3">
          <div class="mb-3 text-sm font-bold">
            {{ $t('tb.settings.mail.authentication') }}
          </div>
          <FormItem
            :label="$t('tb.settings.mail.username')"
            :name="['jsonValue', 'username']"
          >
            <Input v-model:value="mailForm.jsonValue.username" allow-clear />
          </FormItem>
          <FormItem v-if="hasPassword" class="!mb-2">
            <div class="flex items-center gap-2">
              <Switch v-model:checked="changePassword" />
              <span class="text-sm">
                {{ $t('tb.settings.mail.changePassword') }}
              </span>
            </div>
          </FormItem>
          <FormItem
            v-if="showPasswordInput"
            :label="$t('tb.settings.mail.password')"
            :name="['jsonValue', 'password']"
          >
            <InputPassword v-model:value="mailForm.jsonValue.password" />
          </FormItem>
        </div>
      </Form>

      <div class="mt-4 flex flex-wrap items-center justify-start gap-2">
        <VbenButton variant="outline" @click="loadMail">
          {{ $t('tb.common.undo') }}
        </VbenButton>
        <VbenButton variant="outline" @click="handleSendTestMail">
          {{ $t('tb.settings.mail.sendTestMail') }}
        </VbenButton>
        <VbenButton @click="saveMail">
          {{ $t('tb.common.save') }}
        </VbenButton>
      </div>
    </div>
  </div>
</template>
