<template>
  <div class="device-profile-provision-form">
    <BasicForm @register="registerForm">
    <template #provisionDeviceKey="{ model, field }">
    <Input
      v-model:value="model[field]"
      :placeholder="t('tb.deviceProfile.provision.deviceKeyNamePlaceholder')"
      style="width: 90%"
    >
          <template #suffix>
      <Tooltip :title="t('tb.deviceProfile.common.copy')" v-if="!isEmpty(model[field])">
              <Icon
                :icon="'ant-design:copy-outlined'"
                :size="18"
                class="cursor-pointer"
        @click="copyToClipboard(model[field], t('tb.deviceProfile.provision.copyDeviceKeyNameSuccess'))"
              />
            </Tooltip>
      <Tooltip :title="t('tb.deviceProfile.common.generate')">
              <Icon
                :icon="'ant-design:reload-outlined'"
                :size="18"
                class="cursor-pointer"
                @click="model[field] = randomSecret(20)"
              />
            </Tooltip>
          </template>
        </Input>
      </template>
      <template #provisionDeviceSecret="{ model, field }">
    <Input v-model:value="model[field]" :placeholder="t('tb.deviceProfile.provision.deviceKeyPlaceholder')">
          <template #suffix>
      <Tooltip :title="t('tb.deviceProfile.common.copy')" v-if="!isEmpty(model[field])">
              <Icon
                :icon="'ant-design:copy-outlined'"
                :size="18"
                class="cursor-pointer"
        @click="copyToClipboard(model[field], t('tb.deviceProfile.provision.copyDeviceKeySuccess'))"
              />
            </Tooltip>
      <Tooltip :title="t('tb.deviceProfile.common.generate')">
              <Icon
                :icon="'ant-design:reload-outlined'"
                :size="18"
                class="cursor-pointer"
                @click="model[field] = randomSecret(20)"
              />
            </Tooltip>
          </template>
        </Input>
      </template>
      <template #allowCreateNewDevicesByX509Certificate="{ model, field }">
        <Checkbox v-model:checked="model[field]" />
    <span class="ml-2">{{ t('tb.deviceProfile.provision.createNewDevices') }}</span>
    <p class="text-help">{{ t('tb.deviceProfile.provision.createNewDevicesHelp') }}</p>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="DeviceProfileProvisionForm">
  import { ref } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isEmpty } from 'lodash-es';
  import { copyToClipboard } from '/@/utils';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { PROVISION_TYPE_OPTIONS, ProvisionType } from '/@/enums/deviceEnum';
  import { Input, Tooltip, Checkbox } from 'ant-design-vue';
  import { useUserStore } from '/@/store/modules/user';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const userStore = useUserStore();

  const currentProvisionType = ref(ProvisionType.DISABLED);

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('tb.deviceProfile.provision.strategy'),
      field: 'type',
      component: 'Select',
      defaultValue: ProvisionType.DISABLED,
      componentProps: {
        placeholder: t('tb.deviceProfile.transport.typePlaceholder'),
        options: PROVISION_TYPE_OPTIONS,
        onChange: handleProvisionTypeChange,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.deviceProfile.provision.deviceKeyName'),
      field: 'provisionDeviceKey',
      component: 'Input',
      slot: 'provisionDeviceKey',
      required: true,
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('tb.deviceProfile.provision.deviceKey'),
      field: 'provisionDeviceSecret',
      component: 'Input',
      slot: 'provisionDeviceSecret',
      required: true,
      colProps: { lg: 12, md: 12 },
    },
    {
      field: 'allowCreateNewDevicesByX509Certificate',
      component: 'Checkbox',
      defaultValue: false,
      slot: 'allowCreateNewDevicesByX509Certificate',
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.deviceProfile.provision.pem'),
      field: 'certificateValue',
      component: 'InputTextArea',
      componentProps: {
        rows: 4,
        placeholder: t('tb.deviceProfile.provision.pemPlaceholder'),
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.deviceProfile.provision.cnRegex'),
      subLabel: t('tb.deviceProfile.provision.cnRegexSubLabel'),
      field: 'certificateRegExPattern',
      component: 'Input',
      required: true,
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
    colon: false,
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  async function setConfigFieldsValue(values: any) {
    await resetFields();
    handleProvisionTypeChange(values.type || ProvisionType.DISABLED);
    await setFieldsValue(values);
  }

  defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });

  async function handleProvisionTypeChange(value: ProvisionType) {
    currentProvisionType.value = value;
    await updateSchema([
      {
        label: t('tb.deviceProfile.provision.deviceKeyName'),
        field: 'provisionDeviceKey',
        component: 'Input',
        defaultValue: randomSecret(20),
        slot: 'provisionDeviceKey',
        required: true,
        ifShow: value == ProvisionType.ALLOW_CREATE_NEW_DEVICES || value == ProvisionType.CHECK_PRE_PROVISIONED_DEVICES,
        colProps: { lg: 12, md: 12 },
      },
      {
        label: t('tb.deviceProfile.provision.deviceKey'),
        field: 'provisionDeviceSecret',
        component: 'Input',
        defaultValue: randomSecret(20),
        slot: 'provisionDeviceSecret',
        required: true,
        ifShow: value == ProvisionType.ALLOW_CREATE_NEW_DEVICES || value == ProvisionType.CHECK_PRE_PROVISIONED_DEVICES,
        colProps: { lg: 12, md: 12 },
      },
      {
        field: 'allowCreateNewDevicesByX509Certificate',
        component: 'Checkbox',
        defaultValue: false,
        slot: 'allowCreateNewDevicesByX509Certificate',
        ifShow: value == ProvisionType.X509_CERTIFICATE_CHAIN,
        colProps: { lg: 24, md: 24 },
      },
      {
        label: t('tb.deviceProfile.provision.pem'),
        field: 'certificateValue',
        component: 'InputTextArea',
        componentProps: {
          rows: 4,
          placeholder: t('tb.deviceProfile.provision.pemPlaceholder'),
        },
        required: true,
        ifShow: value == ProvisionType.X509_CERTIFICATE_CHAIN,
        colProps: { lg: 24, md: 24 },
      },
      {
        label: t('tb.deviceProfile.provision.cnRegex'),
        subLabel: t('tb.deviceProfile.provision.cnRegexSubLabel'),
        field: 'certificateRegExPattern',
        component: 'Input',
        required: true,
        colProps: { lg: 24, md: 24 },
        ifShow: value == ProvisionType.X509_CERTIFICATE_CHAIN,
      },
    ]);
  }

  function randomSecret(length: number) {
    let str = '';
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < length; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  }
</script>
<style lang="less"></style>
