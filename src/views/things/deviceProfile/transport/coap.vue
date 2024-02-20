<template>
  <div class="coap-transport-form">
    <p class="text-help  ml-4">启用高级COAP传输设置。</p>
    <BasicForm @register="registerForm">
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="COAPTransportForm">
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { useI18n } from '/@/hooks/web/useI18n';
import { useUserStore } from '/@/store/modules/user';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('things');
const userStore = useUserStore();

const inputFormSchemas: FormSchema[] = [
  {
    label: t('设备类型'),
    field: 'coapDeviceTypeConfiguration.coapDeviceType',
    defaultValue: 'DEFAULT',
    component: 'Select',
    componentProps: {
      options: [
        { label: '默认', value: 'DEFAULT' },
        { label: 'Efento NB-IoT', value: 'EFENTO' }
      ],
      onChange: handleCoapDeviceTypeChange
    },
    required: true,
    colProps: { lg: 24, md: 24 }
  },
  {
    label: t('COAP报文格式'),
    labelWidth: 140,
    field: 'coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.transportPayloadType',
    defaultValue: 'JSON',
    component: 'Select',
    componentProps: {
      options: [{ label: 'JSON', value: 'JSON' }, { label: 'Protobuf', value: 'PROTOBUF' }]
    },
    colProps: { lg: 24, md: 24 },
    required: true,
    ifShow: true,
  },
  {
    label: t('节能模式'),
    field: 'clientSettings.powerMode',
    defaultValue: 'DRX',
    component: 'Select',
    componentProps: {
      options: [
        { label: '节能模式(PSM)', value: 'PSM' },
        { label: '非连续接收(DRX)', value: 'DRX' },
        { label: '连续接收(eDRX)', value: 'E_DRX' }
      ],
      onChange: handlePowerModeChange
    },
    required: true,
    colProps: { lg: 24, md: 24 }
  },
  {
    label: t('PSM活动计时器'),
    labelWidth: 140,
    field: 'clientSettings.psmActivityTimer',
    defaultValue: 10000,
    component: 'InputNumber',
    componentProps: {
      min: 2,
      formatter: value => `${value}毫秒`,
      parser: value => value.replace('毫秒', ''),
    },
    required: true,
    ifShow: false,
    colProps: { lg: 24, md: 24 }
  },
  {
    label: t('eDRX循环'),
    field: 'clientSettings.edrxCycle',
    defaultValue: 81000,
    component: 'InputNumber',
    componentProps: {
      min: 6,
      formatter: value => `${value}毫秒`,
      parser: value => value.replace('毫秒', ''),
    },
    required: true,
    ifShow: false,
  },
  {
    label: t('分页传输窗口'),
    labelWidth: 160,
    field: 'clientSettings.pagingTransmissionWindow',
    defaultValue: 10000,
    component: 'InputNumber',
    componentProps: {
      min: 2,
      formatter: value => `${value}毫秒`,
      parser: value => value.replace('毫秒', ''),
    },
    required: true,
    ifShow: false,
  }
];


const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
  labelWidth: 100,
  schemas: inputFormSchemas,
  baseColProps: { lg: 12, md: 24 },
});

async function setConfigFieldsValue(values: any) {
  await resetFields();
  await handleCoapDeviceTypeChange(values.coapDeviceType || 'DEFAULT');
  await handlePowerModeChange(values.coapDeviceType || 'DRX');
  await setFieldsValue(values);
}

defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });

async function handleCoapDeviceTypeChange(type: string) {
  await updateSchema([
    {
      label: t('COAP报文格式'),
      labelWidth: 140,
      field: 'coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.transportPayloadType',
      defaultValue: 'JSON',
      component: 'Select',
      componentProps: {
        options: [{ label: 'JSON', value: 'JSON' }, { label: 'Protobuf', value: 'PROTOBUF' }]
      },
      colProps: { lg: 24, md: 24 },
      required: true,
      ifShow: type == 'DEFAULT',
    },
  ])
}

async function handlePowerModeChange(powerMode: string) {
  await updateSchema([
    {
      label: t('PSM活动计时器'),
      labelWidth: 140,
      field: 'clientSettings.psmActivityTimer',
      defaultValue: 10000,
      component: 'InputNumber',
      componentProps: {
        min: 2,
        formatter: value => `${value}毫秒`,
        parser: value => value.replace('毫秒', ''),
      },
      required: true,
      ifShow: powerMode == 'PSM',
      colProps: { lg: 24, md: 24 }
    },
    {
      label: t('eDRX循环'),
      field: 'clientSettings.edrxCycle',
      defaultValue: 81000,
      component: 'InputNumber',
      componentProps: {
        min: 6,
        formatter: value => `${value}毫秒`,
        parser: value => value.replace('毫秒', ''),
      },
      required: true,
      ifShow: powerMode == 'E_DRX',
    },
    {
      label: t('分页传输窗口'),
      labelWidth: 160,
      field: 'clientSettings.pagingTransmissionWindow',
      defaultValue: 10000,
      component: 'InputNumber',
      componentProps: {
        min: 2,
        formatter: value => `${value}毫秒`,
        parser: value => value.replace('毫秒', ''),
      },
      required: true,
      ifShow: powerMode == 'E_DRX',
    }
  ]);
}

</script>