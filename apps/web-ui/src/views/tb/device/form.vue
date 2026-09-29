<script lang="ts" setup>
import type { Device, DeviceCredentials } from '#/api/tb/device';
import type { DeviceProfileInfo } from '#/api/tb/device-profile';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import {
  useVbenModal,
  VbenButton,
  VbenInputPassword,
  VbenSegmented,
  VbenTooltip,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input as VbenInput } from '@vben-core/shadcn-ui';

import { message, Steps } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getDeviceById,
  getDeviceCredentials,
  saveDevice,
  saveDeviceCredentials,
  saveDeviceWithCredentials,
} from '#/api/tb/device';
import { getDeviceProfileInfoById } from '#/api/tb/device-profile';
import {
  Authority,
  DeviceCredentialsType,
  deviceCredentialsTypeOptions,
  DeviceTransportType,
  EntityType,
} from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard, randomSecret } from '#/utils/common';

interface DeviceFormValues {
  customerId?: string;
  description?: string;
  deviceProfileId: string;
  gateway: boolean;
  label?: string;
  name: string;
  overwriteActivityTime: boolean;
}

interface CredentialsFormValues {
  clientId?: string;
  credentialsId?: string;
  credentialsType: DeviceCredentialsType;
  credentialsValue?: string;
  lwm2mCredentials?: string;
  password?: string;
  userName?: string;
}

const emit = defineEmits<{ created: [device: Device]; success: [] }>();

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const credentialsOnly = ref(false);
const savedCredentials = ref<DeviceCredentials>();
const credentialsReadOnly = computed(
  () => credentialsOnly.value && !hasAccessByRoles([Authority.TENANT_ADMIN]),
);
const record = ref<Device | null>(null);
const currentStep = ref(0);
const selectedDeviceProfile = ref<DeviceProfileInfo>();
const generatedCredentialFields = [
  'credentialsId',
  'clientId',
  'password',
] as const;

const [Form, formApi] = useVbenForm<DeviceFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('device.features.form.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('device.fields.name'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('device.validation.nameRequired') })
        .max(255, { message: $t('device.validation.nameMaxLength') }),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('device.features.form.labelPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'label',
      label: $t('device.fields.label'),
      rules: z
        .string()
        .max(255, {
          message: $t('device.validation.labelMaxLength'),
        })
        .optional(),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      componentProps: {
        allowClear: false,
        entityType: 'DEVICE_PROFILE',
        placeholder: $t('device.validation.profileRequired'),
      },
      defaultValue: '',
      fieldName: 'deviceProfileId',
      label: $t('device.fields.deviceProfile'),
      rules: z.string().min(1, {
        message: $t('device.validation.profileRequired'),
      }),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'CUSTOMER',
        placeholder: $t('device.features.form.customerPlaceholder'),
      },
      dependencies: {
        resolve: () => ({ if: !record.value?.id }),
        triggerFields: ['customerId'],
      },
      fieldName: 'customerId',
      label: $t('device.fields.customer'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('device.fields.isGateway'),
        description: $t('device.features.form.gatewayDescription'),
      },
      defaultValue: false,
      fieldName: 'gateway',
      hideLabel: true,
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('device.fields.overwriteActivityTime'),
        description: $t(
          'device.features.form.overwriteActivityTimeDescription',
        ),
      },
      defaultValue: false,
      dependencies: {
        resolve: ({ values: formValues }) => ({ if: formValues.gateway }),
        triggerFields: ['gateway'],
      },
      fieldName: 'overwriteActivityTime',
      hideLabel: true,
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('device.features.form.descriptionPlaceholder'),
      },
      fieldName: 'description',
      label: $t('device.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});
const deviceTransportType = computed(
  () =>
    selectedDeviceProfile.value?.transportType ?? DeviceTransportType.DEFAULT,
);
const credentialsTypeOptions = computed(() => {
  if (
    credentialsOnly.value &&
    deviceTransportType.value === DeviceTransportType.LWM2M
  ) {
    return [
      {
        label: $t('device.features.credentials.type.LWM2M_CREDENTIALS'),
        value: DeviceCredentialsType.LWM2M_CREDENTIALS,
      },
    ];
  }
  return deviceCredentialsTypeOptions().filter(({ value }) => {
    switch (deviceTransportType.value) {
      case DeviceTransportType.COAP: {
        return value !== DeviceCredentialsType.MQTT_BASIC;
      }
      case DeviceTransportType.LWM2M: {
        return false;
      }
      case DeviceTransportType.SNMP: {
        return value === DeviceCredentialsType.ACCESS_TOKEN;
      }
      default: {
        return true;
      }
    }
  });
});

const [CredentialsForm, credentialsFormApi] =
  useVbenForm<CredentialsFormValues>({
    layout: 'vertical',
    commonConfig: {
      colon: false,
      componentProps: { class: 'w-full' },
      labelClass: 'text-sm font-medium',
      formItemClass: 'min-w-0 pb-5',
    },
    wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
    showDefaultActions: false,
    schema: [
      {
        component: VbenSegmented,
        modelPropName: 'modelValue',
        componentProps: () => ({
          tabs: credentialsTypeOptions.value,
          class: 'mx-auto w-full max-w-lg p-[2px]',
          'aria-label': $t('device.features.credentials.typeLabel'),
          'onUpdate:modelValue': resetCredentials,
        }),
        defaultValue: DeviceCredentialsType.ACCESS_TOKEN,
        fieldName: 'credentialsType',
        hideLabel: true,
        label: $t('device.features.credentials.typeLabel'),
        formItemClass: 'sm:col-span-2',
        rules: z.enum(DeviceCredentialsType),
      },
      {
        component: 'VbenInput',
        componentProps: {
          autocomplete: 'off',
          class: 'font-mono',
          placeholder: $t('device.features.form.accessTokenPlaceholder'),
        },
        dependencies: {
          resolve: ({ values: formValues }) => ({
            if:
              formValues.credentialsType === DeviceCredentialsType.ACCESS_TOKEN,
          }),
          triggerFields: ['credentialsType'],
        },
        fieldName: 'credentialsId',
        label: $t('device.features.credentials.accessToken'),
        formItemClass: 'sm:col-span-2',
        description: $t('device.features.form.accessTokenDescription'),
        rules: z
          .string()
          .trim()
          .min(1, { message: $t('device.validation.credentialsRequired') })
          .max(32, {
            message: $t('device.validation.accessTokenMaxLength'),
          }),
      },
      {
        component: 'Textarea',
        componentProps: {
          rows: 6,
          class: 'font-mono text-xs',
          placeholder: $t('device.features.form.certificatePlaceholder'),
        },
        dependencies: {
          resolve: ({ values: formValues }) => ({
            if:
              formValues.credentialsType ===
              DeviceCredentialsType.X509_CERTIFICATE,
          }),
          triggerFields: ['credentialsType'],
        },
        fieldName: 'credentialsValue',
        label: $t('device.features.credentials.x509'),
        formItemClass: 'sm:col-span-2',
        description: $t('device.features.form.certificateDescription'),
        rules: z
          .string()
          .trim()
          .min(1, {
            message: $t('device.validation.credentialsRequired'),
          }),
      },
      {
        component: 'VbenInput',
        componentProps: {
          autocomplete: 'off',
          placeholder: $t('device.features.form.clientIdPlaceholder'),
        },
        dependencies: {
          resolve: ({ values: formValues }) => ({
            if: formValues.credentialsType === DeviceCredentialsType.MQTT_BASIC,
            rules: formValues.userName?.trim()
              ? z.string().optional()
              : z
                  .string()
                  .trim()
                  .min(1, {
                    message: $t('device.validation.mqttIdentityRequired'),
                  }),
          }),
          triggerFields: ['credentialsType', 'userName'],
        },
        fieldName: 'clientId',
        label: $t('device.features.credentials.clientId'),
        formItemClass: 'sm:col-span-2',
        description: $t('device.features.form.mqttDescription'),
      },
      {
        component: 'VbenInput',
        componentProps: {
          autocomplete: 'off',
          placeholder: $t('device.features.form.userNamePlaceholder'),
        },
        dependencies: {
          resolve: ({ values: formValues }) => ({
            if: formValues.credentialsType === DeviceCredentialsType.MQTT_BASIC,
            rules: formValues.password
              ? z
                  .string()
                  .trim()
                  .min(1, {
                    message: $t('device.validation.mqttUserNameRequired'),
                  })
              : z.string().optional(),
          }),
          triggerFields: ['credentialsType', 'password'],
        },
        formItemClass: 'sm:col-span-2',
        fieldName: 'userName',
        label: $t('device.features.credentials.userName'),
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          autocomplete: 'new-password',
          placeholder: $t('device.features.form.passwordPlaceholder'),
        },
        dependencies: {
          resolve: ({ values: formValues }) => ({
            if: formValues.credentialsType === DeviceCredentialsType.MQTT_BASIC,
          }),
          triggerFields: ['credentialsType'],
        },
        fieldName: 'password',
        label: $t('device.features.credentials.password'),
        formItemClass: 'sm:col-span-2',
      },
      {
        component: 'JsonEditor',
        componentProps: {
          ariaLabel: $t('device.features.credentials.lwm2mJson'),
          height: 300,
          required: true,
          rootType: 'object',
          showValidationMessage: false,
        },
        fieldName: 'lwm2mCredentials',
        label: $t('device.features.credentials.lwm2mJson'),
        formItemClass: 'sm:col-span-2',
        dependencies: {
          triggerFields: ['credentialsType'],
          resolve: ({ values: formValues }) => ({
            if:
              formValues.credentialsType ===
              DeviceCredentialsType.LWM2M_CREDENTIALS,
            required: true,
          }),
        },
        rules: 'jsonObjectRequired',
      },
    ],
  });

async function resetCredentials(
  credentialsType: DeviceCredentialsType,
): Promise<void> {
  await credentialsFormApi.setValues({
    credentialsType,
    credentialsId:
      credentialsType === DeviceCredentialsType.ACCESS_TOKEN
        ? randomSecret(20)
        : '',
    credentialsValue: '',
    clientId: '',
    userName: '',
    password: '',
    lwm2mCredentials: '',
  });
  await credentialsFormApi.clearValidation();
}

function toCredentialsPayload(
  formValues: CredentialsFormValues,
): DeviceCredentials {
  switch (formValues.credentialsType) {
    case DeviceCredentialsType.LWM2M_CREDENTIALS: {
      return {
        credentialsType: formValues.credentialsType,
        // The API stores JSON text; keep the validated draft without re-encoding.
        credentialsValue: formValues.lwm2mCredentials,
      };
    }
    case DeviceCredentialsType.MQTT_BASIC: {
      return {
        credentialsType: formValues.credentialsType,
        credentialsValue: JSON.stringify({
          clientId: formValues.clientId?.trim() || null,
          userName: formValues.userName?.trim() || null,
          password: formValues.password || null,
        }),
      };
    }
    case DeviceCredentialsType.X509_CERTIFICATE: {
      return {
        credentialsType: formValues.credentialsType,
        credentialsValue: formValues.credentialsValue?.trim(),
      };
    }
    default: {
      return {
        credentialsType: formValues.credentialsType,
        credentialsId: formValues.credentialsId?.trim(),
      };
    }
  }
}

const [Modal, modalApi] = useVbenModal<{
  deviceId?: string;
  mode?: 'credentials';
}>({
  async onConfirm() {
    if (modalState.value.submitting) return;
    modalApi.lock();
    try {
      if (credentialsOnly.value) {
        if (credentialsReadOnly.value || !savedCredentials.value) return;
        const { valid } = await credentialsFormApi.validate();
        if (!valid) return;
        const formValues = await credentialsFormApi.getValues();
        const {
          credentialsId: _credentialsId,
          credentialsValue: _credentialsValue,
          ...identity
        } = savedCredentials.value;
        await saveDeviceCredentials({
          ...identity,
          ...toCredentialsPayload(formValues),
        });
        message.success($t('tb.common.saveSuccess'));
        await modalApi.close();
        emit('success');
        return;
      }
      const { valid } = await formApi.validate();
      if (!valid) {
        currentStep.value = 0;
        return;
      }
      const formValues = await formApi.getValues();
      if (!record.value?.id) {
        // 凭据类型取决于传输协议，进入凭据步骤前读取当前选中的配置。
        if (selectedDeviceProfile.value?.id.id !== formValues.deviceProfileId) {
          selectedDeviceProfile.value = await getDeviceProfileInfoById(
            formValues.deviceProfileId,
          );
        }
        const options = credentialsTypeOptions.value;
        const [defaultOption] = options;
        if (!defaultOption) {
          currentStep.value = 0;
          return;
        }
        const credentialsValues = await credentialsFormApi.getRawValues();
        if (
          !options.some(
            ({ value }) => value === credentialsValues.credentialsType,
          )
        ) {
          await resetCredentials(defaultOption.value);
        }
        if (currentStep.value === 0) {
          currentStep.value = 1;
          return;
        }
        const { valid: credentialsValid } = await credentialsFormApi.validate();
        if (!credentialsValid) return;
      }

      const device: Device = {
        ...record.value,
        additionalInfo: {
          ...record.value?.additionalInfo,
          description: formValues.description?.trim(),
          gateway: formValues.gateway,
          overwriteActivityTime:
            formValues.gateway && formValues.overwriteActivityTime,
        },
        customerId:
          !record.value?.id && formValues.customerId
            ? { entityType: EntityType.CUSTOMER, id: formValues.customerId }
            : record.value?.customerId,
        deviceProfileId: {
          entityType: EntityType.DEVICE_PROFILE,
          id: formValues.deviceProfileId,
        },
        label: formValues.label?.trim(),
        name: formValues.name.trim(),
      };

      if (record.value?.id) {
        await saveDevice(device);
        message.success($t('tb.common.saveSuccess'));
        await modalApi.close();
      } else {
        const credentialsValues = await credentialsFormApi.getValues();
        const createdDevice = await saveDeviceWithCredentials(
          device,
          toCredentialsPayload(credentialsValues),
        );
        await modalApi.close();
        emit('created', createdDevice);
      }
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { deviceId, mode } = modalApi.getData() ?? {};
    credentialsOnly.value = mode === 'credentials';
    savedCredentials.value = undefined;
    selectedDeviceProfile.value = undefined;
    record.value = null;
    currentStep.value = 0;
    let title = deviceId
      ? $t('device.actions.edit')
      : $t('device.actions.create');
    if (credentialsOnly.value) {
      title = credentialsReadOnly.value
        ? $t('device.features.credentials.view')
        : $t('device.features.credentials.manage');
    }
    modalApi.setState({
      title,
      showConfirmButton: !credentialsReadOnly.value,
    });
    modalApi.lock();
    try {
      await credentialsFormApi.reset();
      credentialsFormApi.setState({
        commonConfig: { disabled: credentialsReadOnly.value },
      });
      if (credentialsOnly.value && deviceId) {
        const [device, credentials] = await Promise.all([
          getDeviceById(deviceId),
          getDeviceCredentials(deviceId),
        ]);
        record.value = device;
        if (device.deviceProfileId?.id) {
          selectedDeviceProfile.value = await getDeviceProfileInfoById(
            device.deviceProfileId.id,
          );
        }
        savedCredentials.value = credentials;
        const mqtt =
          credentials.credentialsType === DeviceCredentialsType.MQTT_BASIC
            ? JSON.parse(credentials.credentialsValue || '{}')
            : {};
        await credentialsFormApi.setValues({
          credentialsType: credentials.credentialsType,
          credentialsId: credentials.credentialsId ?? '',
          credentialsValue: credentials.credentialsValue ?? '',
          clientId: mqtt.clientId ?? '',
          userName: mqtt.userName ?? '',
          password: mqtt.password ?? '',
          lwm2mCredentials:
            credentials.credentialsType ===
            DeviceCredentialsType.LWM2M_CREDENTIALS
              ? (credentials.credentialsValue ?? '')
              : '',
        });
        await credentialsFormApi.clearValidation();
        return;
      }
      await formApi.reset();
      await resetCredentials(DeviceCredentialsType.ACCESS_TOKEN);
      if (deviceId) {
        const device = await getDeviceById(deviceId);
        record.value = device;
        await formApi.setValues({
          description: device.additionalInfo?.description,
          deviceProfileId: device.deviceProfileId?.id,
          name: device.name,
          label: device.label,
          customerId: device.customerId?.id,
          gateway: device.additionalInfo?.gateway ?? false,
          overwriteActivityTime:
            device.additionalInfo?.overwriteActivityTime ?? false,
        });
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="flex min-h-0 flex-col overflow-hidden px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>

    <Steps
      v-if="!credentialsOnly && !record?.id"
      class="mb-6 shrink-0"
      :current="currentStep"
      :items="[
        { title: $t('device.features.wizard.deviceDetails') },
        { title: $t('device.features.credentials.title') },
      ]"
      size="small"
    />

    <div class="min-h-0 flex-1 overflow-y-auto px-1">
      <div v-show="!credentialsOnly && (record?.id || currentStep === 0)">
        <Form v-if="!credentialsOnly" />
      </div>
      <div v-show="credentialsOnly || (!record?.id && currentStep === 1)">
        <CredentialsForm>
          <template
            v-for="fieldName in generatedCredentialFields"
            :key="fieldName"
            #[fieldName]="{ componentProps, disabled, isInValid, modelValue }"
          >
            <component
              :is="fieldName === 'password' ? VbenInputPassword : VbenInput"
              v-bind="componentProps"
              :class="{ 'border-destructive': isInValid }"
            />
            <div class="ml-1 flex shrink-0 items-center gap-1">
              <VbenTooltip v-if="fieldName === 'credentialsId'" side="top">
                <template #trigger>
                  <VbenButton
                    type="button"
                    class="h-10 w-10 rounded-md px-1 text-lg"
                    variant="outline"
                    :disabled="!modelValue || modalState.loading"
                    :aria-label="$t('device.features.credentials.copy')"
                    @click="
                      modelValue &&
                      copyToClipboard(
                        modelValue,
                        $t('device.features.credentials.copied'),
                      )
                    "
                  >
                    <IconifyIcon
                      icon="lucide:copy"
                      class="size-4"
                      aria-hidden="true"
                    />
                  </VbenButton>
                </template>
                {{ $t('device.features.credentials.copy') }}
              </VbenTooltip>
              <VbenTooltip v-if="!credentialsReadOnly" side="top">
                <template #trigger>
                  <VbenButton
                    type="button"
                    variant="outline"
                    class="h-10 w-10 rounded-md px-1 text-lg"
                    :disabled="disabled"
                    :aria-label="$t('device.features.credentials.generate')"
                    @click="
                      credentialsFormApi.setFieldValue(
                        fieldName,
                        randomSecret(20),
                      )
                    "
                  >
                    <IconifyIcon
                      icon="lucide:refresh-cw"
                      class="size-4"
                      aria-hidden="true"
                    />
                  </VbenButton>
                </template>
                {{ $t('device.features.credentials.generate') }}
              </VbenTooltip>
            </div>
          </template>
        </CredentialsForm>
      </div>
    </div>

    <template #prepend-footer>
      <VbenButton
        v-if="!credentialsOnly && !record?.id && currentStep === 1"
        class="mr-auto"
        variant="outline"
        :disabled="modalState.submitting"
        @click="currentStep = 0"
      >
        <IconifyIcon
          icon="lucide:chevron-left"
          class="mr-1 size-4"
          aria-hidden="true"
        />
        {{ $t('device.features.wizard.back') }}
      </VbenButton>
    </template>
    <template #confirmText>
      {{
        record?.id
          ? $t('tb.common.save')
          : currentStep === 0
            ? $t('device.features.wizard.nextCredentials')
            : $t('device.actions.create')
      }}
    </template>
  </Modal>
</template>
