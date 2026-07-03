<script lang="ts" setup>
import type {
  AdminSettings,
  DeviceConnectivitySettings,
  GeneralSettings,
} from '#/api/tb/admin';

import { onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Input, InputNumber, message, Segmented, Switch } from 'antdv-next';

import { getAdminSettings, saveAdminSettings } from '#/api/tb/admin';

/** 设备连接协议分组*/
const GROUPS = [
  { protocols: ['http', 'https'], value: 'http' },
  { protocols: ['mqtt', 'mqtts'], value: 'mqtt' },
  { protocols: ['coap', 'coaps'], value: 'coap' },
] as const;

const activeGroup = ref('http');

/** 常规设置(整个 AdminSettings) */
const generalForm = reactive<AdminSettings<GeneralSettings>>({
  jsonValue: { baseUrl: '', prohibitDifferentUrl: false },
  key: 'general',
});

/** 设备连接(整个 AdminSettings) */
const connectivityForm = reactive<AdminSettings<DeviceConnectivitySettings>>({
  jsonValue: {
    coap: { enabled: true, host: '', port: 5683 },
    coaps: { enabled: false, host: '', port: 5684 },
    http: { enabled: true, host: '', port: 8080 },
    https: { enabled: false, host: '', port: 443 },
    mqtt: { enabled: true, host: '', port: 1883 },
    mqtts: { enabled: false, host: '', port: 8883 },
  },
  key: 'connectivity',
});

async function loadGeneral() {
  try {
    Object.assign(
      generalForm,
      await getAdminSettings<GeneralSettings>('general'),
    );
  } catch {
    // 读取失败(如权限不足)静默
  }
}

async function saveGeneral() {
  if (!generalForm.jsonValue.baseUrl) {
    message.error($t('tb.settings.generalSettings.baseUrlRequired'));
    return;
  }
  Object.assign(generalForm, await saveAdminSettings(generalForm));
  message.success($t('tb.common.saveSuccess'));
}

async function loadConnectivity() {
  try {
    Object.assign(
      connectivityForm,
      await getAdminSettings<DeviceConnectivitySettings>('connectivity'),
    );
  } catch {
    // 读取失败静默
  }
}

async function saveConnectivity() {
  Object.assign(connectivityForm, await saveAdminSettings(connectivityForm));
  message.success($t('tb.common.saveSuccess'));
}

onMounted(() => {
  loadGeneral();
  loadConnectivity();
});
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <!-- 常规设置 -->
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="text-lg font-semibold">
        {{ $t('tb.settings.generalSettings.title') }}
      </div>
      <div class="mt-4 space-y-4">
        <div>
          <div class="mb-1 text-sm">
            <span class="text-destructive">*</span>
            {{ $t('tb.settings.generalSettings.baseUrl') }}
          </div>
          <Input
            size="large"
            allow-clear
            v-model:value="generalForm.jsonValue.baseUrl"
            :placeholder="$t('tb.settings.generalSettings.baseUrlPlaceholder')"
          />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <Switch
              v-model:checked="generalForm.jsonValue.prohibitDifferentUrl"
            />
            <span class="text-sm">
              {{ $t('tb.settings.generalSettings.prohibitDifferentUrl') }}
            </span>
          </div>
          <p class="text-muted-foreground mt-2 text-xs">
            {{ $t('tb.settings.generalSettings.prohibitDifferentUrlHint') }}
          </p>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-start gap-2">
        <VbenButton variant="outline" @click="loadGeneral">
          {{ $t('tb.common.undo') }}
        </VbenButton>
        <VbenButton @click="saveGeneral">
          {{ $t('tb.common.save') }}
        </VbenButton>
      </div>
    </div>

    <!-- 设备连接 -->
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="text-lg font-semibold">
        {{ $t('tb.settings.deviceConnectivity.title') }}
      </div>
      <div class="my-4 flex flex-col items-center gap-2 w-full">
        <Segmented
          v-model:value="activeGroup"
          size="large"
          :block="true"
          :style="{ width: '60%' }"
          :options="
            GROUPS.map((group) => ({
              label: $t(`tb.settings.deviceConnectivity.${group.value}S`),
              value: group.value,
            }))
          "
        />
        <p class="text-muted-foreground text-center">
          {{ $t('tb.settings.deviceConnectivity.hint') }}
        </p>
      </div>

      <template v-for="group in GROUPS" :key="group.value">
        <div v-show="activeGroup === group.value" class="space-y-6">
          <div
            v-for="protocol in group.protocols"
            :key="protocol"
            class="space-y-3"
          >
            <div class="flex items-center gap-2">
              <Switch
                v-model:checked="connectivityForm.jsonValue[protocol].enabled"
              />
              <span class="text-sm font-bold">
                {{ $t(`tb.settings.deviceConnectivity.${protocol}`) }}
              </span>
            </div>
            <div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <div class="text-muted-foreground mb-1 text-sm">
                  {{ $t('tb.settings.deviceConnectivity.host') }}
                </div>
                <Input
                  v-model:value="connectivityForm.jsonValue[protocol].host"
                  allow-clear
                  size="large"
                  :disabled="!connectivityForm.jsonValue[protocol].enabled"
                  :placeholder="
                    $t('tb.settings.deviceConnectivity.hostPlaceholder')
                  "
                />
              </div>
              <div>
                <div class="text-muted-foreground mb-1 text-sm">
                  {{ $t('tb.settings.deviceConnectivity.port') }}
                </div>
                <InputNumber
                  v-model:value="connectivityForm.jsonValue[protocol].port"
                  class="w-full"
                  :max="65_535"
                  :min="1"
                  size="large"
                  :style="{ width: '80%' }"
                  :disabled="!connectivityForm.jsonValue[protocol].enabled"
                  :placeholder="
                    $t('tb.settings.deviceConnectivity.portPlaceholder')
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="mt-6 flex items-center justify-start gap-2">
        <VbenButton variant="outline" @click="loadConnectivity">
          {{ $t('tb.common.undo') }}
        </VbenButton>
        <VbenButton @click="saveConnectivity">
          {{ $t('tb.common.save') }}
        </VbenButton>
      </div>
    </div>
  </div>
</template>
