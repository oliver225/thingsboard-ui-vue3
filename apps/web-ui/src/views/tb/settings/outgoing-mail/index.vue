<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import type {
  AdminSettings,
  MailConfigTemplate,
  MailServerSettings,
} from '#/api/tb/admin';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { VbenButton, VbenInputPassword, VbenSelect } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
} from 'antdv-next';

import TbSwitch from '#/adapter/component/tb-switch.vue';
import {
  authorizeMail,
  getAdminSettings,
  getMailConfigTemplates,
  getMailLoginProcessingUrl,
  saveAdminSettings,
  sendTestMail,
} from '#/api/tb/admin';
import { FormSection } from '#/components/form-section';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

const { isLoading, isSaving, isReady, read, write } = useFormRequest();

const formRef = ref<FormInstance>();
const templates = ref<MailConfigTemplate[]>([]);
const providerOptions = computed(() => [
  { value: 'CUSTOM', label: $t('settings.features.mail.customProvider') },
  ...templates.value
    .filter((item) => item.providerId !== 'CUSTOM')
    .map((item) => ({ value: item.providerId, label: item.name })),
]);
const oauthFields = [
  'clientId',
  'clientSecret',
  'providerTenantId',
  'authUri',
  'tokenUri',
  'redirectUri',
] as const;
function selectProvider(value: string) {
  const template = templates.value.find((item) => item.providerId === value);
  if (!template) return;
  const {
    smtpHost,
    smtpPort,
    smtpProtocol,
    timeout,
    enableTls,
    tlsVersion,
    scope,
  } = template;
  Object.assign(formValues.jsonValue, {
    smtpHost,
    smtpPort,
    smtpProtocol,
    timeout,
    enableTls,
    tlsVersion,
    scope,
    authUri: template.authorizationUri,
    tokenUri: template.accessTokenUri,
  });
  updateTenantUrls();
}
function updateTenantUrls() {
  if (formValues.jsonValue.providerId !== 'OFFICE_365') return;
  const template = templates.value.find(
    (item) => item.providerId === 'OFFICE_365',
  );
  if (template) {
    formValues.jsonValue.authUri = template.authorizationUri.replace(
      '%s',
      formValues.jsonValue.providerTenantId ?? '',
    );
    formValues.jsonValue.tokenUri = template.accessTokenUri.replace(
      '%s',
      formValues.jsonValue.providerTenantId ?? '',
    );
  }
}
async function enableOauth(value: boolean) {
  if (value && !formValues.jsonValue.redirectUri)
    formValues.jsonValue.redirectUri = new URL(
      await getMailLoginProcessingUrl(),
      window.location.origin,
    ).href;
}
const handleAuthorize = () =>
  write(async () => {
    await performSave();
    const url = new URL(await authorizeMail());
    if (['http:', 'https:'].includes(url.protocol))
      window.location.assign(url.href);
  });
/** 是否处于「更改密码」状态(用于设置新密码) */
const changePassword = ref(false);

/** 邮件服务器设置(整个 AdminSettings) */
const formValues = reactive<AdminSettings<MailServerSettings>>({
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
const hasPassword = computed(() => !!formValues.jsonValue.showChangePassword);
const showPasswordInput = computed(
  () => !hasPassword.value || changePassword.value,
);

async function performLoad() {
  changePassword.value = false;
  const [settings, providers] = await Promise.all([
    getAdminSettings<MailServerSettings>('mail'),
    getMailConfigTemplates(),
  ]);
  Object.assign(formValues, settings);
  templates.value = providers;
  formValues.jsonValue.enableTls =
    String(formValues.jsonValue.enableTls) === 'true';
  delete formValues.jsonValue.password;
}

/** 组装提交数据:空密码不下发,避免覆盖已保存的密码 */
function toMailPayload(): AdminSettings<MailServerSettings> {
  const jsonValue = { ...formValues.jsonValue };
  delete jsonValue.showChangePassword;
  if (!showPasswordInput.value || !jsonValue.password) {
    delete jsonValue.password;
  }
  return { ...formValues, jsonValue };
}

async function performSave() {
  await formRef.value?.validate();
  const config = formValues.jsonValue;
  if (
    !Number.isInteger(config.smtpPort) ||
    (config.smtpPort ?? 0) < 1 ||
    (config.smtpPort ?? 0) > 65_535 ||
    !Number.isInteger(config.timeout) ||
    (config.timeout ?? 0) < 0 ||
    (config.enableProxy &&
      (!config.proxyHost?.trim() ||
        !Number.isInteger(config.proxyPort) ||
        (config.proxyPort ?? 0) < 1 ||
        (config.proxyPort ?? 0) > 65_535))
  ) {
    message.error($t('settings.validation.mail'));
    throw new Error('Invalid mail settings');
  }
  Object.assign(formValues, await saveAdminSettings(toMailPayload()));
  changePassword.value = false;
  delete formValues.jsonValue.password;
  message.success($t('tb.common.saveSuccess'));
}

const handleSendTestMail = () =>
  write(async () => {
    await formRef.value?.validate();
    await sendTestMail(toMailPayload());
    message.success($t('settings.features.mail.testMailSuccess'));
  });

const handleReload = () => read(performLoad);
const handleSave = () => write(performSave);
watch(() => formValues.jsonValue.providerTenantId, updateTenantUrls);
onMounted(handleReload);
</script>

<template>
  <SettingsPanel :title="$t('settings.features.mail.title')">
    <Form
      ref="formRef"
      layout="vertical"
      :model="formValues"
      :disabled="!isReady || isLoading || isSaving"
      class="flex flex-col gap-6 !text-sm [&_.ant-form-item]:!mb-0 [&_.ant-form-item-label]:!pb-2 [&_.ant-form-item-label>label]:!text-sm [&_.ant-form-item-label>label]:!font-medium [&_.ant-form-item-label>label]:!text-foreground [&_.ant-select]:!min-h-10 [&_.ant-select]:!rounded-md [&_.ant-select]:!border-input [&_.ant-select]:!bg-background [&_.ant-select]:!shadow-xs [&_.ant-select]:!text-sm [&_.ant-select-selector]:!min-h-10 [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!border-input [&_.ant-select-selector]:!bg-background [&_.ant-select-selector]:!shadow-xs"
    >
      <FormSection>
        <div class="grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2">
          <FormItem :label="$t('settings.features.mail.oauth.provider')">
            <VbenSelect
              v-model="formValues.jsonValue.providerId"
              :disabled="!isReady || isLoading || isSaving"
              class="h-10"
              :options="providerOptions"
              @update:model-value="(value) => selectProvider(String(value))"
            />
          </FormItem>
          <FormItem
            :label="$t('settings.features.mail.mailFrom')"
            :name="['jsonValue', 'mailFrom']"
            :rules="[
              {
                required: true,
                message: $t('settings.features.mail.mailFromRequired'),
              },
            ]"
          >
            <Input
              :disabled="!isReady || isLoading || isSaving"
              class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
              v-model:value="formValues.jsonValue.mailFrom"
              :placeholder="$t('settings.features.mail.mailFromPlaceholder')"
            />
          </FormItem>
        </div>
      </FormSection>

      <!-- 连接设置 -->
      <FormSection :title="$t('settings.features.mail.connection')">
        <div class="grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2">
          <FormItem
            :label="$t('settings.features.mail.smtpProtocol')"
            :name="['jsonValue', 'smtpProtocol']"
          >
            <VbenSelect
              v-model="formValues.jsonValue.smtpProtocol"
              :disabled="!isReady || isLoading || isSaving"
              class="h-10"
              :options="[
                { label: 'SMTP', value: 'smtp' },
                { label: 'SMTPS', value: 'smtps' },
              ]"
            />
          </FormItem>
          <FormItem
            :label="$t('settings.features.mail.timeout')"
            :name="['jsonValue', 'timeout']"
            :rules="[
              {
                required: true,
                message: $t('settings.features.mail.timeoutRequired'),
              },
            ]"
          >
            <InputNumber
              v-model:value="formValues.jsonValue.timeout"
              class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full"
              :min="0"
            />
          </FormItem>
          <FormItem
            :label="$t('settings.features.mail.smtpHost')"
            :name="['jsonValue', 'smtpHost']"
            :rules="[
              {
                required: true,
                message: $t('settings.features.mail.smtpHostRequired'),
              },
            ]"
          >
            <Input
              :disabled="!isReady || isLoading || isSaving"
              class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
              v-model:value="formValues.jsonValue.smtpHost"
            />
          </FormItem>
          <FormItem
            :label="$t('settings.features.mail.smtpPort')"
            :name="['jsonValue', 'smtpPort']"
            :rules="[
              {
                required: true,
                message: $t('settings.features.mail.smtpPortRequired'),
              },
            ]"
          >
            <InputNumber
              v-model:value="formValues.jsonValue.smtpPort"
              class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full"
              :max="65_535"
              :min="1"
            />
          </FormItem>
        </div>

        <div class="mt-6">
          <TbSwitch
            :title="$t('settings.features.mail.enableTls')"
            :disabled="!isReady || isLoading || isSaving"
            id="mail-enable-tls"
            v-model:checked="formValues.jsonValue.enableTls"
          />
          <FormItem
            v-if="formValues.jsonValue.enableTls"
            class="mt-5 md:max-w-[calc(50%-12px)]"
            :label="$t('settings.features.mail.tlsVersion')"
            :name="['jsonValue', 'tlsVersion']"
            :rules="[
              {
                required: true,
                message: $t('settings.features.mail.tlsVersionRequired'),
              },
            ]"
          >
            <VbenSelect
              v-model="formValues.jsonValue.tlsVersion"
              :disabled="!isReady || isLoading || isSaving"
              class="h-10"
              @update:model-value="
                formRef
                  ?.validateFields([['jsonValue', 'tlsVersion']])
                  .catch(() => {})
              "
              :options="
                ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'].map((v) => ({
                  label: v,
                  value: v,
                }))
              "
            />
          </FormItem>
        </div>
        <div class="mt-5">
          <TbSwitch
            :title="$t('settings.features.mail.enableProxy')"
            :disabled="!isReady || isLoading || isSaving"
            id="mail-enable-proxy"
            v-model:checked="formValues.jsonValue.enableProxy"
          />
          <div
            v-if="formValues.jsonValue.enableProxy"
            class="mt-5 grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2"
          >
            <FormItem
              :label="$t('settings.features.mail.proxyHost')"
              :name="['jsonValue', 'proxyHost']"
              :rules="[
                {
                  required: true,
                  message: $t('settings.features.mail.proxyHostRequired'),
                },
              ]"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.proxyHost"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.mail.proxyPort')"
              :name="['jsonValue', 'proxyPort']"
              :rules="[
                {
                  required: true,
                  message: $t('settings.features.mail.proxyPortRequired'),
                },
              ]"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.proxyPort"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full"
                :max="65_535"
                :min="1"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.mail.proxyUser')"
              :name="['jsonValue', 'proxyUser']"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.proxyUser"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.mail.proxyPassword')"
              :name="['jsonValue', 'proxyPassword']"
            >
              <VbenInputPassword
                :disabled="!isReady || isLoading || isSaving"
                class="h-10 text-sm shadow-xs aria-[invalid=true]:border-destructive"
                v-model="formValues.jsonValue.proxyPassword"
              />
            </FormItem>
          </div>
        </div>
      </FormSection>

      <!-- 身份验证 -->
      <FormSection :title="$t('settings.features.mail.authentication')">
        <TbSwitch
          :title="$t('settings.features.mail.oauth.enable')"
          class="mb-6"
          :disabled="!isReady || isLoading || isSaving"
          id="mail-enable-oauth"
          v-model:checked="formValues.jsonValue.enableOauth2"
          @change="(value: any) => enableOauth(Boolean(value))"
        />
        <div
          v-if="formValues.jsonValue.enableOauth2"
          class="mb-6 grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2"
        >
          <FormItem
            v-for="field in oauthFields.filter(
              (f) =>
                f !== 'providerTenantId' ||
                formValues.jsonValue.providerId === 'OFFICE_365',
            )"
            :key="field"
            :class="
              ['authUri', 'tokenUri', 'redirectUri'].includes(field)
                ? 'md:col-span-2'
                : undefined
            "
            :label="$t(`settings.features.mail.oauth.${field}`)"
            :name="['jsonValue', field]"
            :rules="[
              {
                required: true,
                message: $t('settings.validation.requiredField'),
              },
            ]"
          >
            <VbenInputPassword
              :disabled="!isReady || isLoading || isSaving"
              class="h-10 text-sm shadow-xs aria-[invalid=true]:border-destructive"
              v-if="field === 'clientSecret'"
              v-model="formValues.jsonValue[field]"
              autocomplete="new-password"
            />
            <Input
              :disabled="!isReady || isLoading || isSaving"
              v-else
              v-model:value="formValues.jsonValue[field]"
              class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
            />
          </FormItem>
          <FormItem
            class="md:col-span-2"
            :label="$t('settings.features.mail.oauth.scope')"
            :name="['jsonValue', 'scope']"
            :rules="[
              {
                required: true,
                type: 'array',
                min: 1,
                message: $t('settings.validation.requiredField'),
              },
            ]"
          >
            <Select
              v-model:value="formValues.jsonValue.scope"
              mode="tags"
              :token-separators="[' ', ',']"
            />
          </FormItem>
          <p
            class="m-0 rounded-md bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:col-span-2"
          >
            {{
              formValues.jsonValue.tokenGenerated
                ? $t('settings.features.mail.oauth.authorized')
                : $t('settings.features.mail.oauth.notAuthorized')
            }}
          </p>
        </div>
        <div class="grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2">
          <FormItem
            :label="$t('settings.features.mail.username')"
            :name="['jsonValue', 'username']"
          >
            <Input
              :disabled="!isReady || isLoading || isSaving"
              class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
              v-model:value="formValues.jsonValue.username"
            />
          </FormItem>
          <FormItem
            v-if="!formValues.jsonValue.enableOauth2 && hasPassword"
            class="md:col-span-2 md:row-start-1"
          >
            <TbSwitch
              :title="$t('settings.features.mail.changePassword')"
              :disabled="!isReady || isLoading || isSaving"
              id="mail-change-password"
              v-model:checked="changePassword"
            />
          </FormItem>
          <FormItem
            v-if="!formValues.jsonValue.enableOauth2 && showPasswordInput"
            :label="$t('settings.features.mail.password')"
            :name="['jsonValue', 'password']"
          >
            <VbenInputPassword
              :disabled="!isReady || isLoading || isSaving"
              class="h-10 text-sm shadow-xs aria-[invalid=true]:border-destructive"
              v-model="formValues.jsonValue.password"
            />
          </FormItem>
        </div>
      </FormSection>
    </Form>
    <template #footer>
      <VbenButton
        class="min-w-20"
        variant="outline"
        :loading="isLoading"
        :disabled="isSaving"
        @click="handleReload"
      >
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        class="min-w-20"
        variant="outline"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSendTestMail"
      >
        {{ $t('settings.features.mail.sendTestMail') }}
      </VbenButton>
      <VbenButton
        class="min-w-20"
        variant="outline"
        v-if="formValues.jsonValue.enableOauth2"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleAuthorize"
      >
        {{ $t('settings.features.mail.oauth.authorize') }}
      </VbenButton>
      <VbenButton
        class="min-w-20"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </template>
  </SettingsPanel>
</template>
