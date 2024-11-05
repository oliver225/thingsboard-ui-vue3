<template>
  <div class="device-profile-transport-form">
    <BasicForm @register="registerForm">
    </BasicForm>
    <p class="text-help ml-4" v-if="TransportType.DEFAULT == currentTransportType"> 支持基本MQTT、HTTP和CoAP传输。</p>
    <MQTT ref="mqttFrom" v-if="TransportType.MQTT == currentTransportType" />
    <COAP ref="coapFrom" v-if="TransportType.COAP == currentTransportType" />
  </div>
</template>
<script lang="ts" setup name="DeviceProfileTransportForm">
import { ref } from 'vue';
import MQTT from './mqtt.vue';
import COAP from './coap.vue';
import { sleep } from '/@/utils';
import { useI18n } from '/@/hooks/web/useI18n';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { TRANSPORT_TYPE_OPTIONS, TransportType } from '/@/enums/deviceEnum';
import { NamePath } from 'ant-design-vue/es/form/interface';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('tb');

const record = ref<any>({});

const currentTransportType = ref(TransportType.DEFAULT);

const mqttFrom = ref<any>(null);
const coapFrom = ref<any>(null);


const inputFormSchemas: FormSchema[] = [
  {
    label: t('传输方式'),
    field: 'type',
    component: 'Select',
    defaultValue: TransportType.DEFAULT,
    componentProps: {
      placeholder: '请选择传输方式',
      options: TRANSPORT_TYPE_OPTIONS,
      onChange: handleTransportTypeChange,
    },
    required: true,
  },
];

const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
  labelWidth: 100,
  schemas: inputFormSchemas,
  baseColProps: { lg: 24, md: 24 },
});

async function setConfigFieldsValue(values: any) {
  await resetFields();
  record.value = values;
  handleTransportTypeChange(values.type || TransportType.DEFAULT);
  await setFieldsValue(values);
}

async function validateFieldsValue(nameList?: NamePath[]) {
  try {
    let result = { type: currentTransportType.value };
    if (mqttFrom.value) {
      const mqttData = await mqttFrom.value.validate(nameList);
      result = { ...result, ...mqttData };
    }
    if (coapFrom.value) {
      const coapData = await coapFrom.value.validate(nameList);
      result = { ...result, ...coapData };
    }
    return result;
  } catch (error: any) {
    throw error;
  }

}

defineExpose({ getFieldsValue, validate: validateFieldsValue, resetFields, setFieldsValue: setConfigFieldsValue });



async function handleTransportTypeChange(type: TransportType) {
  currentTransportType.value = type;
  await sleep(100);
  if (TransportType.MQTT == type && mqttFrom.value) {
    mqttFrom.value.setFieldsValue(record.value)
  }
  if (TransportType.COAP == type && coapFrom.value) {
    coapFrom.value.setFieldsValue(record.value)
  }
}

</script>
<style lang="less">
.device-profile-transport-form {}
</style>