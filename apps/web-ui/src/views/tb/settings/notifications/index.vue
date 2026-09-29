<script setup lang="ts">
import type { NotificationSettings } from '#/api/tb/notification';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { VbenButton, VbenInputPassword, VbenSegmented } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  getNotificationSettings,
  saveNotificationSettings,
} from '#/api/tb/notification';
import { FormSection } from '#/components/form-section';
import { Authority, NotificationDeliveryMethod } from '#/enums';
import { useFormRequest } from '#/hooks/use-form-request';
import { $t } from '#/locales';

import SettingsPanel from '../components/settings-panel.vue';
import SmsProvider from './sms-provider.vue';

const fileInputRef = ref<HTMLInputElement>();
const { hasAccessByRoles } = useAccess();
const isSystem = computed(() => hasAccessByRoles([Authority.SYS_ADMIN]));
const activeTab = ref(isSystem.value ? 'sms' : 'slack');
const tabs = computed(() => [
  ...(isSystem.value
    ? [{ value: 'sms', label: $t('settings.features.notifications.sms.title') }]
    : []),
  { value: 'slack', label: $t('settings.features.notifications.slack.name') },
  ...(isSystem.value
    ? [
        {
          value: 'mobile',
          label: $t('settings.features.notifications.mobile.title'),
        },
      ]
    : []),
]);
const { isLoading, isSaving, isReady, read, write } = useFormRequest();
const record = ref<NotificationSettings>({ deliveryMethodsConfigs: {} });
const botToken = ref('');
const credentials = ref('');
const filename = ref('');
function apply(settings: NotificationSettings) {
  record.value = settings;
  botToken.value = settings.deliveryMethodsConfigs?.SLACK?.botToken ?? '';
  credentials.value =
    settings.deliveryMethodsConfigs?.MOBILE_APP
      ?.firebaseServiceAccountCredentials ?? '';
  filename.value =
    settings.deliveryMethodsConfigs?.MOBILE_APP
      ?.firebaseServiceAccountCredentialsFileName ?? '';
}
const handleReload = () =>
  read(async () => apply(await getNotificationSettings()));
async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const value = await file.text();
    const json = JSON.parse(value);
    if (
      json.type !== 'service_account' ||
      !json.project_id ||
      !json.private_key ||
      !json.client_email
    )
      throw new Error('Invalid Firebase service account credentials');
    credentials.value = value;
    filename.value = file.name;
  } catch {
    message.error($t('settings.features.notifications.mobile.invalidFile'));
  } finally {
    input.value = '';
  }
}
function handleSave(method: 'MOBILE_APP' | 'SLACK') {
  if (method === 'MOBILE_APP' && !isSystem.value) return;
  return write(async () => {
    // 合并当前渠道的改动，保留其他渠道及租户无权编辑的服务端字段。
    const deliveryMethodsConfigs = { ...record.value.deliveryMethodsConfigs };
    if (method === 'SLACK') {
      if (botToken.value.trim())
        deliveryMethodsConfigs.SLACK = {
          ...deliveryMethodsConfigs.SLACK,
          method: NotificationDeliveryMethod.SLACK,
          botToken: botToken.value.trim(),
        };
      else delete deliveryMethodsConfigs.SLACK;
    } else if (filename.value && credentials.value) {
      deliveryMethodsConfigs.MOBILE_APP = {
        ...deliveryMethodsConfigs.MOBILE_APP,
        method: NotificationDeliveryMethod.MOBILE_APP,
        firebaseServiceAccountCredentials: credentials.value,
        firebaseServiceAccountCredentialsFileName: filename.value,
      };
    } else {
      delete deliveryMethodsConfigs.MOBILE_APP;
    }
    const result = await saveNotificationSettings({
      ...record.value,
      deliveryMethodsConfigs,
    });
    record.value = result;
    message.success($t('tb.common.saveSuccess'));
  });
}
onMounted(handleReload);
</script>
<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <div class="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-4">
      <VbenSegmented
        class="[&_[role=tab]]:!min-w-0 [&_[role=tab]]:!px-3"
        v-model="activeTab"
        :tabs="tabs"
        variant="navigation"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-hidden">
      <SmsProvider v-if="isSystem" v-show="activeTab === 'sms'" />

      <SettingsPanel
        v-show="activeTab === 'slack'"
        :show-header="false"
        :title="$t('settings.features.notifications.slack.title')"
      >
        <FormSection>
          <label
            for="slack-token"
            class="mb-2 block text-sm font-medium leading-5"
          >
            {{ $t('settings.features.notifications.slack.apiToken') }}
          </label>
          <VbenInputPassword
            id="slack-token"
            v-model="botToken"
            class="h-10 text-sm shadow-xs"
            :disabled="!isReady || isLoading || isSaving"
            autocomplete="new-password"
          />
        </FormSection>
        <template #footer>
          <VbenButton
            variant="outline"
            class="min-w-20"
            :loading="isLoading"
            :disabled="isSaving"
            @click="handleReload"
          >
            {{ $t('tb.common.undo') }}
          </VbenButton>
          <VbenButton
            variant="default"
            class="min-w-20"
            :loading="isSaving"
            :disabled="!isReady || isLoading"
            @click="handleSave('SLACK')"
          >
            {{ $t('tb.common.save') }}
          </VbenButton>
        </template>
      </SettingsPanel>

      <SettingsPanel
        v-if="isSystem"
        v-show="activeTab === 'mobile'"
        :show-header="false"
        :title="$t('settings.features.notifications.mobile.title')"
      >
        <FormSection
          :title="$t('settings.features.notifications.mobile.file')"
          :description="$t('settings.features.notifications.mobile.hint')"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-4 rounded-md bg-muted/30 p-4"
          >
            <div class="min-w-0 flex-1">
              <p
                class="m-0 text-sm font-medium leading-5 [overflow-wrap:anywhere]"
              >
                {{
                  filename ||
                  $t('settings.features.notifications.mobile.filePlaceholder')
                }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-3">
              <VbenButton
                variant="outline"
                :disabled="!isReady || isLoading || isSaving"
                @click="fileInputRef?.click()"
              >
                {{ $t('settings.features.notifications.mobile.file') }}
              </VbenButton>
              <VbenButton
                v-if="filename"
                variant="ghost"
                class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                :disabled="!isReady || isLoading || isSaving"
                @click="
                  filename = '';
                  credentials = '';
                "
              >
                {{ $t('tb.common.delete') }}
              </VbenButton>
            </div>
            <input
              id="firebase-file"
              ref="fileInputRef"
              class="sr-only"
              type="file"
              accept=".json,application/json"
              :disabled="!isReady || isLoading || isSaving"
              @change="handleUpload"
            />
          </div>
        </FormSection>
        <template #footer>
          <VbenButton
            variant="outline"
            class="min-w-20"
            :loading="isLoading"
            :disabled="isSaving"
            @click="handleReload"
          >
            {{ $t('tb.common.undo') }}
          </VbenButton>
          <VbenButton
            variant="default"
            class="min-w-20"
            :loading="isSaving"
            :disabled="!isReady || isLoading"
            @click="handleSave('MOBILE_APP')"
          >
            {{ $t('tb.common.save') }}
          </VbenButton>
        </template>
      </SettingsPanel>
    </div>
  </div>
</template>
