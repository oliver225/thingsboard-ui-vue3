<script lang="ts" setup>
/**
 * 设备凭证 查看/编辑 弹窗(useVbenModal + useVbenForm)
 */
import type { VbenFormSchema } from '#/adapter/form';
import type { DeviceCredentials } from '#/api/tb/device';

import { h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Tooltip } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getDeviceCredentials, saveDeviceCredentials } from '#/api/tb/device';
import { DeviceCredentialsType, deviceCredentialsTypeOptions } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard, randomSecret } from '#/utils/common';

interface CredentialsFormValues {
  accessToken?: string;
  credentialsType: DeviceCredentialsType;
  mqttClientId?: string;
  mqttPassword?: string;
  mqttUserName?: string;
  x509?: string;
}

const emit = defineEmits<{ success: [] }>();

const record = ref<DeviceCredentials | null>(null);
const readonly = ref(false);
const loading = ref(false);

function buildFormValues(
  credentials: DeviceCredentials | null,
): CredentialsFormValues {
  const values = {
    accessToken: '',
    credentialsType:
      credentials?.credentialsType || DeviceCredentialsType.ACCESS_TOKEN,
    mqttClientId: '',
    mqttPassword: '',
    mqttUserName: '',
    x509: '',
  };

  switch (values.credentialsType) {
    case DeviceCredentialsType.ACCESS_TOKEN: {
      values.accessToken = credentials?.credentialsId ?? '';
      break;
    }
    case DeviceCredentialsType.MQTT_BASIC: {
      try {
        const value = JSON.parse(credentials?.credentialsValue ?? '{}');
        values.mqttClientId = value.clientId ?? '';
        values.mqttUserName = value.userName ?? '';
        values.mqttPassword = value.password ?? '';
      } catch {
        // ignore invalid server payload
      }
      break;
    }
    case DeviceCredentialsType.X509_CERTIFICATE: {
      values.x509 = credentials?.credentialsValue ?? '';
      break;
    }
    // No default
  }

  return values;
}

function onCredentialsTypeChange(formApi: any) {
  formApi.setValues({
    accessToken: record.value?.credentialsId ?? '',
    mqttClientId:
      JSON.parse(record.value?.credentialsValue ?? '{}').clientId ?? '',
    mqttPassword:
      JSON.parse(record.value?.credentialsValue ?? '{}').userName ?? '',
    mqttUserName:
      JSON.parse(record.value?.credentialsValue ?? '{}').password ?? '',
    x509: record.value?.credentialsValue ?? '',
  });
}

const schema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: () => ({
      size: 'large',
      allowClear: false,
      disabled: readonly.value,
      onChange: () => onCredentialsTypeChange(formApi),
      options: deviceCredentialsTypeOptions(),
      style: { width: '100%' },
    }),
    fieldName: 'credentialsType',
    label: $t('tb.device.credentials.typeLabel'),
  },
  {
    fieldName: 'accessToken',
    label: $t('tb.device.credentials.accessToken'),
    component: 'Input',
    componentProps: () => ({
      size: 'large',
      disabled: readonly.value,
    }),
    dependencies: {
      if: (values) =>
        values.credentialsType === DeviceCredentialsType.ACCESS_TOKEN,
      triggerFields: ['credentialsType'],
    },
    renderComponentContent: (values, formApi) => ({
      suffix: () =>
        h('span', { class: 'flex items-center gap-2' }, [
          createCopyIcon(values.accessToken),
          createGenerateIcon(() =>
            formApi.setFieldValue('accessToken', randomSecret(20)),
          ),
        ]),
    }),
  },
  {
    component: 'Textarea',
    componentProps: () => ({ disabled: readonly.value, rows: 6 }),
    dependencies: {
      if: (values) =>
        values.credentialsType === DeviceCredentialsType.X509_CERTIFICATE,
      triggerFields: ['credentialsType'],
    },
    fieldName: 'x509',
    label: $t('tb.device.credentials.x509'),
  },
  {
    component: 'Input',
    componentProps: () => ({
      size: 'large',
      disabled: readonly.value,
    }),
    dependencies: {
      if: (values) =>
        values.credentialsType === DeviceCredentialsType.MQTT_BASIC,
      triggerFields: ['credentialsType'],
    },
    fieldName: 'mqttClientId',
    label: $t('tb.device.credentials.clientId'),
    renderComponentContent: (_values, formApi) => ({
      suffix: () =>
        createGenerateIcon(() =>
          formApi.setFieldValue('mqttClientId', randomSecret(20)),
        ),
    }),
  },
  {
    component: 'Input',
    componentProps: () => ({
      size: 'large',
      disabled: readonly.value,
    }),
    dependencies: {
      if: (values) =>
        values.credentialsType === DeviceCredentialsType.MQTT_BASIC,
      triggerFields: ['credentialsType'],
    },
    fieldName: 'mqttUserName',
    label: $t('tb.device.credentials.userName'),
  },
  {
    component: 'InputPassword',
    componentProps: () => ({
      size: 'large',
      disabled: readonly.value,
    }),
    dependencies: {
      if: (values) =>
        values.credentialsType === DeviceCredentialsType.MQTT_BASIC,
      triggerFields: ['credentialsType'],
    },
    fieldName: 'mqttPassword',
    label: $t('tb.device.credentials.password'),
    renderComponentContent: (_values, formApi) => ({
      suffix: () =>
        createGenerateIcon(() =>
          formApi.setFieldValue('mqttPassword', randomSecret(20)),
        ),
    }),
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (readonly.value || !record.value) {
      return;
    }

    const values = await formApi.getValues<CredentialsFormValues>();
    const credentials: DeviceCredentials = {
      ...record.value,
      credentialsId: undefined,
      credentialsType: values.credentialsType,
      credentialsValue: undefined,
    };

    switch (values.credentialsType) {
      case DeviceCredentialsType.ACCESS_TOKEN: {
        credentials.credentialsId = values.accessToken;
        break;
      }
      case DeviceCredentialsType.MQTT_BASIC: {
        credentials.credentialsId = randomSecret(40);
        credentials.credentialsValue = JSON.stringify({
          clientId: values.mqttClientId || null,
          password: values.mqttPassword || null,
          userName: values.mqttUserName || null,
        });
        break;
      }
      case DeviceCredentialsType.X509_CERTIFICATE: {
        credentials.credentialsId = randomSecret(40);
        credentials.credentialsValue = values.x509;
        break;
      }
      // No default
    }

    modalApi.lock();
    try {
      await saveDeviceCredentials(credentials);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data =
      modalApi.getData<{ deviceId?: string; readonly?: boolean }>() ?? {};
    record.value = null;
    readonly.value = !!data.readonly;
    loading.value = false;
    await formApi.resetForm();
    modalApi.setState({
      showConfirmButton: !readonly.value,
      title: $t('tb.device.credentials.title'),
    });
    if (data.deviceId) {
      loading.value = true;
      try {
        const credentials = await getDeviceCredentials(data.deviceId);
        record.value = credentials;
        await formApi.setValues(buildFormValues(credentials));
      } finally {
        loading.value = false;
      }
    }
  },
});

function iconButton(icon: string, onClick: () => void) {
  return h(IconifyIcon, {
    class: 'cursor-pointer',
    icon,
    onClick,
  });
}

function createCopyIcon(value?: string) {
  if (!value) return null;
  return h(
    Tooltip,
    { title: $t('tb.device.credentials.copy') },
    {
      default: () =>
        iconButton('lucide:copy', () =>
          copyToClipboard(value, $t('tb.device.credentials.copied')),
        ),
    },
  );
}

function createGenerateIcon(onClick: () => void, className = '') {
  if (readonly.value) return null;
  return h(
    Tooltip,
    { title: $t('tb.device.credentials.generate') },
    {
      default: () =>
        h(IconifyIcon, {
          class: `${className} cursor-pointer`.trim(),
          icon: 'lucide:refresh-cw',
          onClick,
        }),
    },
  );
}
</script>

<template>
  <Modal
    class="w-1/3"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form v-loading="loading" />
  </Modal>
</template>
