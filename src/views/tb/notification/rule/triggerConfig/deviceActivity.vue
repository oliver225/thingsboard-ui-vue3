<template>
  <div class="trigger-config-device-activity">
    <BasicForm @register="registerForm">
      <template #deviceEnable="{ model, field }">
        <div class="w-full flex">
          <Radio.Group
            v-model:value="model[field]"
            button-style="solid"
            style="margin: 1px auto"
            @change="handleDeviceEnableChange"
          >
            <Radio.Button value="device">{{ t('tb.notification.ruleTrigger.deviceActivity.device') }}</Radio.Button>
            <Radio.Button value="deviceProfile">{{
              t('tb.notification.ruleTrigger.deviceActivity.deviceProfile')
            }}</Radio.Button>
          </Radio.Group>
        </div>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="TriggerConfigDeviceActivity">
  import { isArray, isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { Radio } from 'ant-design-vue';
  import { getTenantDeviceInfoList } from '/@/api/tb/device';
  import { getDeviceProfileInfoList } from '/@/api/tb/deviceProfile';

  const { t } = useI18n('tb');

  const notifyOnOptions = [
    { value: 'ACTIVE', label: t('tb.notification.ruleTrigger.deviceActivity.online') },
    { value: 'INACTIVE', label: t('tb.notification.ruleTrigger.deviceActivity.offline') },
  ];

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.DEVICE_ACTIVITY,
      show: false,
    },
    {
      field: 'triggerConfig.deviceEnable',
      component: 'RadioButtonGroup',
      defaultValue: 'device',
      slot: 'deviceEnable',
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.deviceActivity.device'),
      subLabel: t('tb.notification.ruleTrigger.deviceActivity.allDevices'),
      field: 'triggerConfig.devices',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.notification.ruleTrigger.deviceActivity.allDevices'),
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: getTenantDeviceInfoList,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.deviceActivity.deviceProfile'),
      subLabel: t('tb.notification.ruleTrigger.deviceActivity.allDeviceProfiles'),
      field: 'triggerConfig.deviceProfiles',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.notification.ruleTrigger.deviceActivity.allDeviceProfiles'),
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: getDeviceProfileInfoList,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.alarm.notifyOn'),
      field: 'triggerConfig.notifyOn',
      component: 'Select',
      defaultValue: ['INACTIVE'],
      componentProps: {
        mode: 'multiple',
        options: notifyOnOptions,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.description'),
      field: 'additionalConfig.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });
  async function setTriggerFieldsValue(values: any) {
    if (!isEmpty(values.triggerConfig.devices)) {
      values.triggerConfig.deviceEnable = 'device';
    } else if (!isEmpty(values.triggerConfig.deviceProfiles)) {
      values.triggerConfig.deviceEnable = 'deviceProfile';
    } else {
      values.triggerConfig.deviceEnable = 'device';
    }
    await resetFields();
    await setFieldsValue(values);
    await updateSchema([
      {
        field: 'triggerConfig.devices',
        ifShow: values.triggerConfig.deviceEnable == 'device',
      },
      {
        field: 'triggerConfig.deviceProfiles',
        ifShow: values.triggerConfig.deviceEnable == 'deviceProfile',
      },
    ]);
  }

  async function validateTrigger(nameList?: NamePath[]) {
    let data = await validate(nameList);
    if (!isEmpty(data.triggerConfig.devices) && !isArray(data.triggerConfig.devices)) {
      data.triggerConfig.devices = data.triggerConfig.devices.split(',');
    }
    if (!isEmpty(data.triggerConfig.deviceProfiles) && !isArray(data.triggerConfig.deviceProfiles)) {
      data.triggerConfig.deviceProfiles = data.triggerConfig.deviceProfiles.split(',');
    }
    if (!isEmpty(data.triggerConfig.notifyOn) && !isArray(data.triggerConfig.notifyOn)) {
      data.triggerConfig.notifyOn = data.triggerConfig.notifyOn.split(',');
    }
    return data;
  }

  async function handleDeviceEnableChange({ target: { value } }) {
    const record = getFieldsValue();
    const triggerConfig = record.triggerConfig;
    await setFieldsValue({
      ...record,
      triggerConfig: {
        ...triggerConfig,
        devices: null,
        deviceProfiles: null,
      },
    });
    updateSchema([
      {
        field: 'triggerConfig.devices',
        ifShow: value == 'device',
      },
      {
        field: 'triggerConfig.deviceProfiles',
        ifShow: value == 'deviceProfile',
      },
    ]);
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  /* removed empty rule .trigger-config-device-activity */
</style>
