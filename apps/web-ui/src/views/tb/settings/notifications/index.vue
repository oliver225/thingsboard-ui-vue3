<script lang="ts" setup>
import type {
  NotificationDeliveryMethodConfig,
  NotificationSettings,
} from '#/api/tb/notification';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { InputPassword, message } from 'antdv-next';

import {
  getNotificationSettings,
  saveNotificationSettings,
} from '#/api/tb/notification';
import { Authority, NotificationDeliveryMethod } from '#/enums';

import SmsProvider from './sms-provider.vue';

const { hasAccessByRoles } = useAccess();

/** 其余投递方式配置原样保留,避免保存时被覆盖 */
const deliveryConfigs = ref<NotificationSettings['deliveryMethodsConfigs']>({});
const slackBotToken = ref('');

function applySettings(settings: NotificationSettings) {
  deliveryConfigs.value = settings.deliveryMethodsConfigs ?? {};
  slackBotToken.value =
    deliveryConfigs.value[NotificationDeliveryMethod.SLACK]?.botToken ?? '';
}

async function loadSettings() {
  try {
    applySettings(await getNotificationSettings());
  } catch {
    // 读取失败(如权限不足)静默
  }
}

async function saveSettings() {
  const configs: NotificationSettings['deliveryMethodsConfigs'] = {
    ...deliveryConfigs.value,
  };
  // 令牌为空视为禁用 Slack(对齐 ui-ngx)
  if (slackBotToken.value) {
    configs[NotificationDeliveryMethod.SLACK] = {
      botToken: slackBotToken.value,
      method: NotificationDeliveryMethod.SLACK,
    } as NotificationDeliveryMethodConfig;
  } else {
    delete configs[NotificationDeliveryMethod.SLACK];
  }
  applySettings(
    await saveNotificationSettings({ deliveryMethodsConfigs: configs }),
  );
  message.success($t('tb.common.saveSuccess'));
}

onMounted(loadSettings);
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <!-- 短信供应商(仅系统管理员) -->
    <SmsProvider v-if="hasAccessByRoles([Authority.SYS_ADMIN])" />

    <!-- Slack 设置 -->
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="text-lg font-semibold">
        {{ $t('tb.settings.slack.title') }}
      </div>
      <div class="mt-4">
        <div class="text-muted-foreground mb-1 text-sm">
          {{ $t('tb.settings.slack.apiToken') }}
        </div>
        <InputPassword
          v-model:value="slackBotToken"
          :placeholder="$t('tb.settings.slack.apiTokenPlaceholder')"
        />
      </div>
      <div class="mt-4 flex items-center justify-start gap-2">
        <VbenButton variant="outline" @click="loadSettings">
          {{ $t('tb.common.undo') }}
        </VbenButton>
        <VbenButton @click="saveSettings">
          {{ $t('tb.common.save') }}
        </VbenButton>
      </div>
    </div>
  </div>
</template>
