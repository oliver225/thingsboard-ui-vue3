<script setup lang="ts">
import type { AdminSettings, DeviceConnectivitySettings } from '#/api/tb/admin';

import { onMounted, reactive, ref } from 'vue';

import { VbenButton, VbenSegmented } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Input, InputNumber, message } from 'antdv-next';

import TbSwitch from '#/adapter/component/tb-switch.vue';
import { getAdminSettings, saveAdminSettings } from '#/api/tb/admin';
import { FormSection } from '#/components/form-section';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

const { isLoading, isSaving, isReady, read, write } = useFormRequest();

/** 设备连接协议分组*/
const GROUPS = [
  { protocols: ['http', 'https'], value: 'http' },
  { protocols: ['mqtt', 'mqtts'], value: 'mqtt' },
  { protocols: ['coap', 'coaps'], value: 'coap' },
] as const;

const activeGroup = ref('http');

/** 设备连接(整个 AdminSettings) */
const formValues = reactive<AdminSettings<DeviceConnectivitySettings>>({
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

async function performLoad() {
  Object.assign(
    formValues,
    await getAdminSettings<DeviceConnectivitySettings>('connectivity'),
  );
}

async function performSave() {
  if (
    Object.values(formValues.jsonValue).some(
      (value) =>
        value.enabled &&
        value.port !== null &&
        value.port !== undefined &&
        (!Number.isInteger(value.port) ||
          (value.port ?? 0) < 1 ||
          (value.port ?? 0) > 65_535),
    )
  ) {
    message.error($t('settings.validation.connectivity'));
    return;
  }
  Object.assign(formValues, await saveAdminSettings(formValues));
  message.success($t('tb.common.saveSuccess'));
}

const handleReload = () => read(performLoad);
const handleSave = () => write(performSave);
onMounted(handleReload);
</script>
<template>
  <SettingsPanel :title="$t('settings.features.connectivity.title')">
    <div class="mb-6 space-y-3">
      <VbenSegmented
        v-model="activeGroup"
        class="!w-full [&_[role=tab]]:!min-w-0 [&_[role=tab]]:!px-2"
        variant="navigation"
        :tabs="
          GROUPS.map((group) => ({
            label: $t(`settings.features.connectivity.${group.value}S`),
            value: group.value,
          }))
        "
      />
      <p class="m-0 text-sm leading-5 text-muted-foreground">
        {{ $t('settings.features.connectivity.hint') }}
      </p>
    </div>
    <template v-for="group in GROUPS" :key="group.value">
      <div v-show="activeGroup === group.value" class="space-y-6">
        <FormSection v-for="protocol in group.protocols" :key="protocol">
          <TbSwitch
            :title="$t(`settings.features.connectivity.${protocol}`)"
            class="mb-6"
            :disabled="!isReady || isLoading || isSaving"
            :id="`connectivity-${protocol}-enabled`"
            v-model:checked="formValues.jsonValue[protocol].enabled"
          />
          <div class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div>
              <label
                :for="`connectivity-${protocol}-host`"
                class="mb-2 block text-sm font-medium leading-5"
              >
                {{ $t('settings.features.connectivity.host') }}
              </label>
              <Input
                :id="`connectivity-${protocol}-host`"
                v-model:value="formValues.jsonValue[protocol].host"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                :disabled="!formValues.jsonValue[protocol].enabled"
                :placeholder="
                  $t('settings.features.connectivity.hostPlaceholder')
                "
              />
            </div>
            <div>
              <label
                :for="`connectivity-${protocol}-port`"
                class="mb-2 block text-sm font-medium leading-5"
              >
                {{ $t('settings.features.connectivity.port') }}
              </label>
              <InputNumber
                :id="`connectivity-${protocol}-port`"
                v-model:value="formValues.jsonValue[protocol].port"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
                :max="65_535"
                :min="1"
                :disabled="!formValues.jsonValue[protocol].enabled"
                :placeholder="
                  $t('settings.features.connectivity.portPlaceholder')
                "
              />
            </div>
          </div>
        </FormSection>
      </div>
    </template>
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
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </template>
  </SettingsPanel>
</template>
