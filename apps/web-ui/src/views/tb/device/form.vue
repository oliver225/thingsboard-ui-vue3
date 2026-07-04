<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { Device, DeviceCredentials } from '#/api/tb/device';

import { computed, h, ref } from 'vue';

import { alert, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Steps, Tooltip } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCustomers } from '#/api/tb/customer';
import {
  getDeviceById,
  saveDevice,
  saveDeviceWithCredentials,
} from '#/api/tb/device';
import { getDeviceProfileInfos } from '#/api/tb/device-profile';
import {
  DeviceCredentialsType,
  deviceCredentialsTypeOptions,
  EntityType,
} from '#/enums';
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

const record = ref<Device | null>(null);
const currentStep = ref(0);
const loading = ref(false);

const stepsItems = computed(() => [
  { title: $t('tb.device.wizard.deviceDetails') },
  { title: $t('tb.device.credentials.title') },
]);

async function loadDeviceProfileOptions() {
  const pageData = await getDeviceProfileInfos({ page: 0, pageSize: 1000 });
  return pageData.data.map((profile) => ({
    label: profile.name,
    value: profile.id.id,
  }));
}

async function loadCustomerOptions() {
  const pageData = await getCustomers({ page: 0, pageSize: 1000 });
  return pageData.data.map((item) => ({
    label: item.title,
    value: item.id?.id,
  }));
}

const [DetailsForm, detailsFormApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    formItemClass: 'col-span-full',
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      componentProps: {
        size: 'large',
      },
      label: $t('tb.device.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.device.validation.nameRequired') }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadDeviceProfileOptions,
        showSearch: true,
        size: 'large',
        style: { width: '100%' },
      },
      fieldName: 'deviceProfileId',
      label: $t('tb.device.fields.deviceProfile'),
      rules: z
        .string()
        .min(1, { message: $t('tb.device.validation.profileRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'label',
      componentProps: {
        size: 'large',
      },
      label: $t('tb.device.fields.label'),
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'gateway',
      formItemClass: 'md:col-span-1',
      label: $t('tb.device.fields.isGateway'),
    },
    {
      component: 'Switch',
      defaultValue: false,
      dependencies: {
        if: (values) => !!values.gateway,
        triggerFields: ['gateway'],
      },
      formItemClass: 'md:col-span-1',
      fieldName: 'overwriteActivityTime',
      label: $t('tb.device.fields.overwriteActivityTime'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: loadCustomerOptions,
        showSearch: true,
        size: 'large',
        style: { width: '100%' },
      },
      fieldName: 'customerId',
      label: $t('tb.device.fields.customer'),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.device.fields.description'),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const credentialsSchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: () => ({
      allowClear: false,
      onChange: resetCredentialValues,
      options: deviceCredentialsTypeOptions(),
      size: 'large',
      style: { width: '100%' },
    }),
    fieldName: 'credentialsType',
    label: $t('tb.device.credentials.typeLabel'),
  },
  {
    component: 'Input',
    componentProps: { size: 'large' },
    dependencies: {
      if: (values) =>
        values.credentialsType === DeviceCredentialsType.ACCESS_TOKEN,
      triggerFields: ['credentialsType'],
    },
    fieldName: 'accessToken',
    label: $t('tb.device.credentials.accessToken'),
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
    componentProps: { rows: 6 },
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
    componentProps: { size: 'large' },
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
    componentProps: { size: 'large' },
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
    componentProps: { size: 'large' },
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

const [CredentialsForm, credentialsFormApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
  },
  schema: credentialsSchema,
  showDefaultActions: false,
});

function createCopyIcon(value?: string) {
  if (!value) return null;
  return h(
    Tooltip,
    { title: $t('tb.device.credentials.copy') },
    {
      default: () =>
        h(IconifyIcon, {
          class: 'cursor-pointer',
          icon: 'lucide:copy',
          onClick: () =>
            copyToClipboard(value, $t('tb.device.credentials.copied')),
        }),
    },
  );
}

function createGenerateIcon(onClick: () => void) {
  return h(
    Tooltip,
    { title: $t('tb.device.credentials.generate') },
    {
      default: () =>
        h(IconifyIcon, {
          class: 'cursor-pointer',
          icon: 'lucide:refresh-cw',
          onClick,
        }),
    },
  );
}

function resetCredentialValues() {
  credentialsFormApi.setValues({
    accessToken: randomSecret(20),
    mqttClientId: '',
    mqttPassword: '',
    mqttUserName: '',
    x509: '',
  });
}

function buildDevice(values: Record<string, any>): Device {
  return {
    ...record.value,
    additionalInfo: {
      ...record.value?.additionalInfo,
      description: values.description,
      gateway: values.gateway,
      overwriteActivityTime: values.overwriteActivityTime,
    },
    customerId: values.customerId
      ? { entityType: EntityType.CUSTOMER, id: values.customerId }
      : record.value?.customerId,
    deviceProfileId: {
      entityType: EntityType.DEVICE_PROFILE,
      id: values.deviceProfileId,
    },
    label: values.label,
    name: values.name,
  };
}

function buildCredentials(values: CredentialsFormValues): DeviceCredentials {
  const credentials: DeviceCredentials = {
    credentialsType: values.credentialsType,
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

  return credentials;
}

function validateCredentials(values: CredentialsFormValues): boolean {
  if (
    values.credentialsType === DeviceCredentialsType.ACCESS_TOKEN &&
    !values.accessToken
  ) {
    message.warning($t('tb.device.validation.credentialsRequired'));
    return false;
  }
  if (
    values.credentialsType === DeviceCredentialsType.X509_CERTIFICATE &&
    !values.x509
  ) {
    message.warning($t('tb.device.validation.credentialsRequired'));
    return false;
  }
  return true;
}

function showCreatedDialog() {
  alert({
    confirmText: $t('tb.common.confirm'),
    content: $t('tb.device.connectivity.createdCheckConnectivity'),
    icon: 'success',
    title: $t('tb.device.connectivity.checkConnectivity'),
  }).catch(() => {});
}

async function saveEditDevice() {
  const { valid } = await detailsFormApi.validate();
  if (!valid) return;
  const values = await detailsFormApi.getValues();

  modalApi.lock();
  try {
    await saveDevice(buildDevice(values));
    message.success($t('tb.common.saveSuccess'));
    modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

async function createDevice() {
  const detailsResult = await detailsFormApi.validate();
  if (!detailsResult.valid) {
    currentStep.value = 0;
    return;
  }
  const credentialsResult = await credentialsFormApi.validate();
  if (!credentialsResult.valid) {
    currentStep.value = 1;
    return;
  }

  const detailsValues = await detailsFormApi.getValues();
  const credentialsValues =
    await credentialsFormApi.getValues<CredentialsFormValues>();
  if (!validateCredentials(credentialsValues)) {
    currentStep.value = 1;
    return;
  }

  loading.value = true;
  modalApi.lock();
  try {
    await saveDeviceWithCredentials(
      buildDevice(detailsValues),
      buildCredentials(credentialsValues),
    );
    modalApi.close();
    emit('success');
    showCreatedDialog();
  } finally {
    loading.value = false;
    modalApi.unlock();
  }
}

async function onNext() {
  const { valid } = await detailsFormApi.validate();
  if (valid) {
    currentStep.value = 1;
  }
}

function onPrev() {
  currentStep.value = 0;
}

async function onConfirm() {
  if (record.value?.id?.id) {
    await saveEditDevice();
    return;
  }
  if (currentStep.value === 0) {
    await onNext();
    return;
  }
  await createDevice();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await onConfirm();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const { deviceId } = modalApi.getData<{ deviceId?: string }>() ?? {};
    record.value = null;
    currentStep.value = 0;
    loading.value = false;
    await detailsFormApi.resetForm();
    await credentialsFormApi.resetForm();
    await credentialsFormApi.setValues({
      accessToken: randomSecret(20),
      credentialsType: DeviceCredentialsType.ACCESS_TOKEN,
    });
    modalApi.setState({
      showConfirmButton: false,
      title: deviceId
        ? $t('tb.device.actions.edit')
        : $t('tb.device.actions.create'),
    });
    if (deviceId) {
      const device = await getDeviceById(deviceId);
      record.value = device;
      await detailsFormApi.setValues({
        customerId: device.customerId?.id,
        description: device.additionalInfo?.description,
        deviceProfileId: device.deviceProfileId?.id,
        gateway: device.additionalInfo?.gateway ?? false,
        label: device.label,
        name: device.name,
        overwriteActivityTime:
          device.additionalInfo?.overwriteActivityTime ?? false,
      });
    }
  },
});
</script>

<template>
  <Modal
    :centered="true"
    :fullscreen-button="false"
    class="w-[680px] max-w-[90vw]"
  >
    <div v-if="!record?.id?.id" class="mb-6">
      <Steps :current="currentStep" :items="stepsItems" size="small" />
    </div>

    <div v-show="record?.id?.id || currentStep === 0">
      <DetailsForm />
    </div>

    <div v-show="!record?.id?.id && currentStep === 1">
      <CredentialsForm />
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <Button v-if="!record?.id?.id && currentStep > 0" @click="onPrev">
          <template #icon>
            <IconifyIcon icon="lucide:chevron-left" />
          </template>
          {{ $t('tb.device.wizard.back') }}
        </Button>
        <span v-else></span>
        <div class="flex items-center gap-2">
          <Button @click="modalApi.close()">
            {{ $t('tb.common.cancel') }}
          </Button>
          <Button type="primary" :loading="loading" @click="onConfirm">
            {{
              !!record?.id?.id
                ? $t('tb.common.save')
                : currentStep === 0
                  ? $t('tb.device.wizard.nextCredentials')
                  : $t('tb.device.wizard.add')
            }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
