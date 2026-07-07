<script lang="ts" setup>
import type { FormInstance } from 'antdv-next';

import type { DeviceProfile } from '#/api/tb/device-profile';

import { reactive, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Form, FormItem, Input, message, Select, Switch } from 'antdv-next';

import { DeviceProvisionType, deviceProvisionTypeOptions } from '#/enums';
import { $t } from '#/locales';
import { randomSecret } from '#/utils/common';

const props = defineProps<{
  disabled?: boolean;
  profile?: DeviceProfile | null;
}>();

const formRef = ref<FormInstance>();

const state = reactive({
  allowCreateNewDevicesByX509Certificate: true,
  certificateRegExPattern: '(.*)',
  certificateValue: '',
  provisionDeviceKey: '',
  provisionDeviceSecret: '',
  type: DeviceProvisionType.DISABLED as DeviceProvisionType,
});

const requiredRule = [
  { message: $t('tb.deviceProfile.validation.required'), required: true },
];

watch(
  () => props.profile,
  (profile) => {
    const config = profile?.profileData?.provisionConfiguration ?? {};
    state.type =
      (profile?.provisionType as DeviceProvisionType) ??
      DeviceProvisionType.DISABLED;
    state.provisionDeviceKey =
      profile?.provisionDeviceKey ?? config.provisionDeviceKey ?? '';
    if (state.type === DeviceProvisionType.X509_CERTIFICATE_CHAIN) {
      state.certificateValue = config.provisionDeviceSecret ?? '';
      state.certificateRegExPattern = config.certificateRegExPattern ?? '(.*)';
      state.allowCreateNewDevicesByX509Certificate =
        config.allowCreateNewDevicesByX509Certificate ?? true;
    } else {
      state.provisionDeviceSecret = config.provisionDeviceSecret ?? '';
    }
  },
  { immediate: true },
);

function onTypeChange(type: DeviceProvisionType) {
  if (
    type === DeviceProvisionType.ALLOW_CREATE_NEW_DEVICES ||
    type === DeviceProvisionType.CHECK_PRE_PROVISIONED_DEVICES
  ) {
    if (!state.provisionDeviceKey) {
      state.provisionDeviceKey = randomSecret(20);
    }
    if (!state.provisionDeviceSecret) {
      state.provisionDeviceSecret = randomSecret(20);
    }
  } else if (
    type === DeviceProvisionType.X509_CERTIFICATE_CHAIN &&
    !state.certificateRegExPattern
  ) {
    state.certificateRegExPattern = '(.*)';
  }
}

async function copy(value: string) {
  if (!value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success($t('tb.common.copySuccess'));
  } catch {
    // 剪贴板不可用时静默
  }
}

const usesKeySecret = () =>
  state.type === DeviceProvisionType.ALLOW_CREATE_NEW_DEVICES ||
  state.type === DeviceProvisionType.CHECK_PRE_PROVISIONED_DEVICES;

function buildProvisionConfiguration(): Record<string, any> {
  if (state.type === DeviceProvisionType.X509_CERTIFICATE_CHAIN) {
    return {
      allowCreateNewDevicesByX509Certificate:
        state.allowCreateNewDevicesByX509Certificate,
      certificateRegExPattern: state.certificateRegExPattern,
      provisionDeviceSecret: state.certificateValue,
      type: state.type,
    };
  }
  if (usesKeySecret()) {
    return {
      provisionDeviceKey: state.provisionDeviceKey,
      provisionDeviceSecret: state.provisionDeviceSecret,
      type: state.type,
    };
  }
  return { type: DeviceProvisionType.DISABLED };
}

defineExpose({
  getValues() {
    return { provisionConfiguration: buildProvisionConfiguration() };
  },
  async validate(): Promise<boolean> {
    try {
      await formRef.value?.validate();
      return true;
    } catch {
      return false;
    }
  },
});
</script>

<template>
  <Form
    ref="formRef"
    :disabled="disabled"
    :model="state"
    layout="vertical"
    size="large"
  >
    <FormItem :label="$t('tb.deviceProfile.provision.strategy')">
      <Select
        v-model:value="state.type"
        :options="deviceProvisionTypeOptions()"
        @change="onTypeChange"
      />
    </FormItem>

    <!-- 密钥 + 密文 -->
    <template v-if="usesKeySecret()">
      <FormItem
        :label="$t('tb.deviceProfile.provision.deviceKey')"
        :rules="requiredRule"
        name="provisionDeviceKey"
      >
        <Input v-model:value="state.provisionDeviceKey">
          <template #suffix>
            <IconifyIcon
              class="cursor-pointer"
              icon="lucide:copy"
              @click="copy(state.provisionDeviceKey)"
            />
            <IconifyIcon
              class="ml-1 cursor-pointer"
              icon="lucide:refresh-cw"
              @click="state.provisionDeviceKey = randomSecret(20)"
            />
          </template>
        </Input>
      </FormItem>
      <FormItem
        :label="$t('tb.deviceProfile.provision.deviceSecret')"
        :rules="requiredRule"
        name="provisionDeviceSecret"
      >
        <Input v-model:value="state.provisionDeviceSecret">
          <template #suffix>
            <IconifyIcon
              class="cursor-pointer"
              icon="lucide:copy"
              @click="copy(state.provisionDeviceSecret)"
            />
            <IconifyIcon
              class="ml-1 cursor-pointer"
              icon="lucide:refresh-cw"
              @click="state.provisionDeviceSecret = randomSecret(20)"
            />
          </template>
        </Input>
      </FormItem>
    </template>

    <!-- X509 证书链 -->
    <template
      v-else-if="state.type === DeviceProvisionType.X509_CERTIFICATE_CHAIN"
    >
      <FormItem>
        <Switch
          v-model:checked="state.allowCreateNewDevicesByX509Certificate"
        />
        <span class="ml-2">
          {{ $t('tb.deviceProfile.provision.allowCreateNewDevices') }}
        </span>
      </FormItem>
      <FormItem
        :label="$t('tb.deviceProfile.provision.certificateValue')"
        :rules="requiredRule"
        name="certificateValue"
      >
        <Input.TextArea v-model:value="state.certificateValue" :rows="5" />
      </FormItem>
      <FormItem
        :label="$t('tb.deviceProfile.provision.cnRegex')"
        :rules="requiredRule"
        name="certificateRegExPattern"
      >
        <Input v-model:value="state.certificateRegExPattern" />
      </FormItem>
    </template>
  </Form>
</template>
