<template>
  <div class="mqtt-transport-form">
    <p class="text-help  ml-4">启用高级MQTT传输设置。</p>
    <BasicForm @register="registerForm">
      <template #sparkplug="{ model, field }">
        <Checkbox v-model:checked="model[field]" @change="handleSparkplugChange" />
        <span class="ml-2">MQTT Sparkplug B Edge of Network (EoN) node.</span>
        <p v-if="model[field] == true" class="text-help">允许来自具有Sparkplug B负载和主题格式的EoN节点的连接。</p>
      </template>
      <template #sendAckOnValidationException="{ model, field }">
        <Checkbox v-model:checked="model[field]" />
        <span class="ml-2">发布消息验证失败时发送PUBACK</span>
        <p class="text-help">默认情况下平台将关闭相关消息验证失败的MQTT会话，启用后平台将发布确认而不是关闭会话。</p>
      </template>
    </BasicForm>
    <p class="text-help  ml-4" v-if="sparkplug == true">
      将作为设备属性存储的SparkPlug指标的名称。所有其他指标将存储为设备遥测数据。</p>
  </div>
</template>
<script lang="ts" setup name="MQTTTransportForm">
import { ref } from 'vue';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { useI18n } from '/@/hooks/web/useI18n';
import { useUserStore } from '/@/store/modules/user';
import { Checkbox } from 'ant-design-vue';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('things');
const userStore = useUserStore();



const sparkplug = ref(false);

const inputFormSchemas: FormSchema[] = [
  {
    field: 'sparkplug',
    component: 'Checkbox',
    defaultValue: false,
    slot: 'sparkplug',
  },
  {
    label: t('SparkPlug Metric'),
    field: 'sparkplugAttributesMetricNames',
    defaultValue: ["Properties/*", "Device Control/*", "Node Control/*"],
    component: 'Select',
    componentProps: {
      mode: 'tags',
      open: false,
    },
    required: true,
    ifShow: sparkplug.value
  },
  {
    label: t('遥测数据Topic筛选器'),
    field: 'deviceTelemetryTopic',
    defaultValue: 'v1/devices/me/telemetry',
    component: 'Input',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    ifShow: !sparkplug.value
  },
  {
    label: t('属性数据Topic筛选器'),
    field: 'deviceAttributesTopic',
    defaultValue: 'v1/devices/me/attributes',
    component: 'Input',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    ifShow: !sparkplug.value
  },
  {
    label: t('属性订阅Topic筛选器'),
    field: 'deviceAttributesSubscribeTopic',
    defaultValue: 'v1/devices/me/attributes',
    component: 'Input',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    ifShow: !sparkplug.value
  },
  {
    label: t('MQTT报文格式'),
    field: 'transportPayloadTypeConfiguration.transportPayloadType',
    defaultValue: 'JSON',
    component: 'Select',
    componentProps: {
      options: [{ label: 'JSON', value: 'JSON' }, { label: 'Protobuf', value: 'PROTOBUF' }]
    },
    required: true,
    ifShow: !sparkplug.value
  },
  {
    field: 'sendAckOnValidationException',
    component: 'Checkbox',
    defaultValue: false,
    slot: 'sendAckOnValidationException',
    ifShow: !sparkplug.value
  }
];



const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
  colon: false,
  layout: 'vertical',
  schemas: inputFormSchemas,
  baseColProps: { lg: 24, md: 24 },
});

async function setConfigFieldsValue(values: any) {
  await resetFields();
  await setFieldsValue(values);
  await handleSparkplugChange({ target: { checked: values.sparkplug || false } });
}

defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });


async function handleSparkplugChange({ target: { checked } }) {
  sparkplug.value = checked;
  await updateSchema([{
    label: t('SparkPlug Metric'),
    field: 'sparkplugAttributesMetricNames',
    defaultValue: ["Properties/*", "Device Control/*", "Node Control/*"],
    component: 'Select',
    componentProps: {
      mode: 'tags',
      open: false,
    },
    required: true,
    ifShow: checked
  }, {
    label: t('遥测数据Topic筛选器'),
    field: 'deviceTelemetryTopic',
    defaultValue: 'v1/devices/me/telemetry',
    component: 'Input',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    ifShow: !checked
  },
  {
    label: t('属性数据Topic筛选器'),
    field: 'deviceAttributesTopic',
    defaultValue: 'v1/devices/me/attributes',
    component: 'Input',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    ifShow: !checked
  },
  {
    label: t('属性订阅Topic筛选器'),
    field: 'deviceAttributesSubscribeTopic',
    defaultValue: 'v1/devices/me/attributes',
    component: 'Input',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    ifShow: !checked
  },
  {
    label: t('MQTT报文格式'),
    field: 'transportPayloadTypeConfiguration.transportPayloadType',
    defaultValue: 'JSON',
    component: 'Select',
    componentProps: {
      options: [{ label: 'JSON', value: 'JSON' }, { label: 'Protobuf', value: 'PROTOBUF' }]
    },
    required: true,
    ifShow: !checked
  },
  {
    field: 'sendAckOnValidationException',
    component: 'Checkbox',
    defaultValue: false,
    slot: 'sendAckOnValidationException',
    ifShow: !checked
  }])

}

</script>