<script lang="ts" setup>
import type { DeviceProfile } from '#/api/tb/device-profile';

import { h, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { DeviceProvisionType, deviceProvisionTypeOptions } from '#/enums';
import { $t } from '#/locales';
import { randomSecret } from '#/utils/common';

interface ProvisionValues {
  type: DeviceProvisionType;
  provisionDeviceKey: string;
  provisionDeviceSecret: string;
  certificateValue: string;
  certificateRegExPattern: string;
  allowCreateNewDevicesByX509Certificate: boolean;
}

interface ProvisionConfiguration {
  type: DeviceProvisionType;
  provisionDeviceKey?: string;
  provisionDeviceSecret?: string;
  certificateRegExPattern?: string;
  allowCreateNewDevicesByX509Certificate?: boolean;
}

const props = defineProps<{
  disabled?: boolean;
  profile?: DeviceProfile | null;
}>();
const requiredRule = z
  .string()
  .trim()
  .min(1, $t('device-profile.validation.required'));
const keySecretDependencies = {
  if: (formValues: Partial<ProvisionValues>) => usesKeySecret(formValues.type),
  triggerFields: ['type'],
};
const certificateDependencies = {
  if: (formValues: Partial<ProvisionValues>) =>
    formValues.type === DeviceProvisionType.X509_CERTIFICATE_CHAIN,
  triggerFields: ['type'],
};

function usesKeySecret(type?: DeviceProvisionType) {
  return (
    type === DeviceProvisionType.ALLOW_CREATE_NEW_DEVICES ||
    type === DeviceProvisionType.CHECK_PRE_PROVISIONED_DEVICES
  );
}

function renderSecretActions(
  fieldName: 'provisionDeviceKey' | 'provisionDeviceSecret',
) {
  return h('div', { class: 'flex gap-1' }, [
    h(
      VbenButton,
      {
        variant: 'outline',
        size: 'icon',
        type: 'button',
        disabled: props.disabled,
        'aria-label': $t('device-profile.options.provision.copy'),
        title: $t('device-profile.options.provision.copy'),
        onClick: async () => {
          const formValues = await formApi.getValues();
          if (!formValues[fieldName]) return;
          try {
            await navigator.clipboard.writeText(formValues[fieldName]);
            message.success($t('tb.common.copySuccess'));
          } catch {
            message.error($t('device-profile.options.provision.copyFailed'));
          }
        },
      },
      () => h(IconifyIcon, { icon: 'lucide:copy', class: 'size-4' }),
    ),
    h(
      VbenButton,
      {
        variant: 'outline',
        size: 'icon',
        type: 'button',
        disabled: props.disabled,
        'aria-label': $t('device-profile.options.provision.generate'),
        title: $t('device-profile.options.provision.generate'),
        onClick: () => formApi.setFieldValue(fieldName, randomSecret(20)),
      },
      () => h(IconifyIcon, { icon: 'lucide:refresh-cw', class: 'size-4' }),
    ),
  ]);
}

const [Form, formApi] = useVbenForm<ProvisionValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    disabled: props.disabled,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  schema: [
    {
      component: 'Select',
      componentProps: {
        options: deviceProvisionTypeOptions(),
        onChange: handleProvisionTypeChange,
      },
      defaultValue: DeviceProvisionType.DISABLED,
      fieldName: 'type',
      label: $t('device-profile.options.provision.strategy'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'off',
        spellcheck: false,
        class: 'font-mono',
      },
      defaultValue: '',
      fieldName: 'provisionDeviceKey',
      label: $t('device-profile.options.provision.deviceKey'),
      dependencies: keySecretDependencies,
      rules: requiredRule,
      suffix: () => renderSecretActions('provisionDeviceKey'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'off',
        spellcheck: false,
        class: 'font-mono',
      },
      defaultValue: '',
      fieldName: 'provisionDeviceSecret',
      label: $t('device-profile.options.provision.deviceSecret'),
      dependencies: keySecretDependencies,
      rules: requiredRule,
      suffix: () => renderSecretActions('provisionDeviceSecret'),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('device-profile.options.provision.allowCreateNewDevices'),
      },
      defaultValue: true,
      fieldName: 'allowCreateNewDevicesByX509Certificate',
      dependencies: certificateDependencies,
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 7,
        class: 'font-mono text-sm',
        spellcheck: false,
        placeholder: '-----BEGIN CERTIFICATE-----',
      },
      defaultValue: '',
      fieldName: 'certificateValue',
      label: $t('device-profile.options.provision.certificateValue'),
      dependencies: certificateDependencies,
      rules: requiredRule,
    },
    {
      component: 'VbenInput',
      componentProps: { class: 'font-mono', spellcheck: false },
      defaultValue: '(.*)',
      fieldName: 'certificateRegExPattern',
      label: $t('device-profile.options.provision.cnRegex'),
      dependencies: certificateDependencies,
      rules: requiredRule,
    },
  ],
});

async function handleProvisionTypeChange(type: DeviceProvisionType) {
  const formValues = await formApi.getValues();
  // 策略之间不携带无关凭据，对齐 Angular 的字段重置逻辑。
  await formApi.setValues({
    provisionDeviceKey: usesKeySecret(type)
      ? formValues.provisionDeviceKey || randomSecret(20)
      : '',
    provisionDeviceSecret: usesKeySecret(type)
      ? formValues.provisionDeviceSecret || randomSecret(20)
      : '',
    certificateValue:
      type === DeviceProvisionType.X509_CERTIFICATE_CHAIN
        ? formValues.certificateValue
        : '',
    certificateRegExPattern: '(.*)',
    allowCreateNewDevicesByX509Certificate: true,
  });
}

watch(
  () => props.disabled,
  (disabled) => formApi.setState({ commonConfig: { disabled } }),
);
watch(
  () => props.profile,
  async (profile) => {
    await formApi.reset();
    if (!profile) return;
    const configuration = profile.profileData?.provisionConfiguration ?? {};
    const type =
      (profile.provisionType as DeviceProvisionType) ??
      DeviceProvisionType.DISABLED;
    await formApi.setValues({
      type,
      provisionDeviceKey:
        profile.provisionDeviceKey ?? configuration.provisionDeviceKey ?? '',
      provisionDeviceSecret: usesKeySecret(type)
        ? (configuration.provisionDeviceSecret ?? '')
        : '',
      certificateValue:
        type === DeviceProvisionType.X509_CERTIFICATE_CHAIN
          ? (configuration.provisionDeviceSecret ?? '')
          : '',
      certificateRegExPattern: configuration.certificateRegExPattern ?? '(.*)',
      allowCreateNewDevicesByX509Certificate:
        configuration.allowCreateNewDevicesByX509Certificate ?? true,
    });
  },
  { immediate: true },
);

defineExpose({
  async getValues() {
    const formValues = await formApi.getValues();
    const provisionConfiguration: ProvisionConfiguration = {
      type: formValues.type,
    };
    if (usesKeySecret(formValues.type)) {
      provisionConfiguration.provisionDeviceKey =
        formValues.provisionDeviceKey.trim();
      provisionConfiguration.provisionDeviceSecret =
        formValues.provisionDeviceSecret.trim();
    } else if (formValues.type === DeviceProvisionType.X509_CERTIFICATE_CHAIN) {
      provisionConfiguration.provisionDeviceSecret =
        formValues.certificateValue.trim();
      provisionConfiguration.certificateRegExPattern =
        formValues.certificateRegExPattern;
      provisionConfiguration.allowCreateNewDevicesByX509Certificate =
        formValues.allowCreateNewDevicesByX509Certificate;
    }
    return { provisionConfiguration };
  },
  async validate() {
    const { valid } = await formApi.validate();
    return valid;
  },
});
</script>

<template>
  <Form class="form-message-flow" />
</template>
