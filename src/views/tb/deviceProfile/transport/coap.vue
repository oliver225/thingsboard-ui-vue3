<template>
  <div class="coap-transport-form">
    <p class="text-xs text-neutral-500">启用高级COAP传输设置。</p>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item name="type" :hidden="true">
        <Input v-model:value="formState.type" />
      </Form.Item>
      <Form.Item label="CoAP 设备类型" :name="['coapDeviceTypeConfiguration', 'coapDeviceType']">
        <Select v-model:value="formState.coapDeviceTypeConfiguration.coapDeviceType" :allowClear="false" size="large"
          @change="handleCoapDeviceTypeChange">
          <Select.Option value="DEFAULT">默认</Select.Option>
          <Select.Option value="EFENTO">Efento NB-IoT</Select.Option>
        </Select>
      </Form.Item>
      <CollapseContainer title="COAP 设备 Payload" :canExpan="false" class="border border-solid border-neutral-300 mb-4"
        v-if="formState.coapDeviceTypeConfiguration.coapDeviceType == 'DEFAULT'">
        <Form.Item :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'transportPayloadType']">
          <Select
            v-model:value="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.transportPayloadType"
            :allowClear="false" size="large" @change="handlePayloadTypeChange" :options="[
              { label: 'JSON', value: 'JSON' },
              { label: 'Protobuf', value: 'PROTOBUF' },
            ]" />
        </Form.Item>
        <template
          v-if="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration?.transportPayloadType == 'PROTOBUF'">
          <Form.Item
            :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'enableCompatibilityWithJsonPayloadFormat']">
            <Checkbox
              v-model:checked="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.enableCompatibilityWithJsonPayloadFormat" />
            <span class="ml-2">启用与其他payload格式兼容</span>
            <p class="text-xs text-neutral-500">
              启用后平台将默认使用Protobuf的payload格式，如果解析失败平台将尝试使用JSON的payload格式。对于固件更新期间的向后兼容性很有用，例如固件的初始版本使用Json而新版本使用Protobuf在设备队列的固件更新过程中，需要同时支持Protobuf和JSON。兼容模式会导致一点的性能下降，因此建议在所有设备更新后禁用此模式。
            </p>
          </Form.Item>
          <Form.Item
            :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'useJsonPayloadFormatForDefaultDownlinkTopics']"
            v-show="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.enableCompatibilityWithJsonPayloadFormat == true">
            <Checkbox
              v-model:checked="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.useJsonPayloadFormatForDefaultDownlinkTopics" />
            <span class="ml-2">缺省下行主题采用json格式</span>
            <p class="text-xs text-neutral-500">
              启用后平台将使用Json的playload格式通过以下主题推送属性和RPC：v1/devices/me/attributes/response/$request_id、v1/devices/me/attributes
              、v1/devices/me/rpc/request/$request_id、v1/devices/me/rpc/response/$request_id。此设置不会影响使用新(v2)主题发送的属性和rpc订阅：v2/a/res/$request_id、v2/a、v2/r
              /req/$request_id，v2/r/res/$request_id。其中$request_id是一个整数请求标识符。 </p>
          </Form.Item>
          <Form.Item label="遥测数据 proto schema"
            :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'deviceTelemetryProtoSchema']"
            :rules="[{ required: true }]">
            <CodeEditor
              v-model:value="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.deviceTelemetryProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400" />
          </Form.Item>
          <Form.Item label="属性 proto schema"
            :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'deviceAttributesProtoSchema']"
            :rules="[{ required: true }]">
            <CodeEditor
              v-model:value="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.deviceAttributesProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400 " />
          </Form.Item>
          <Form.Item label="RPC 请求 proto schema"
            :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'deviceRpcRequestProtoSchema']"
            :rules="[{ required: true }]">
            <CodeEditor
              v-model:value="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.deviceRpcRequestProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400" />
          </Form.Item>
          <Form.Item label="RPC 响应 proto schema"
            :name="['coapDeviceTypeConfiguration', 'transportPayloadTypeConfiguration', 'deviceRpcResponseProtoSchema']"
            :rules="[{ required: true }]">
            <CodeEditor
              v-model:value="formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration.deviceRpcResponseProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400" />
          </Form.Item>
        </template>
      </CollapseContainer>
      <CollapseContainer title="节能模式" :canExpan="false" class="border border-solid border-neutral-300 mb-4">
        <Form.Item :name="['clientSettings', 'powerMode']">
          <Select v-model:value="formState.clientSettings.powerMode" :allowClear="false" size="large">
            <Select.Option value="PSM">节能模式(PSM)</Select.Option>
            <Select.Option value="DRX">非连续接收(DRX)</Select.Option>
            <Select.Option value="E_DRX">连续接收(eDRX)</Select.Option>
          </Select>
        </Form.Item>
        <template v-if="formState.clientSettings.powerMode == 'PSM'">
          <Row :gutter="12">
            <Col :span="12">
            <Form.Item label="PSM活动计时器" :name="['clientSettings', 'psmActivityTimer']" :rules="[{ required: true }]">
              <InputNumber v-model:value="formState.clientSettings.psmActivityTimer" :defaultValue="10000" :min="2"
                :style="{ width: '100%' }" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="时间单位" :name="['clientSettings', 'psmActivityTimerUnit']">
              <Select v-model:value="formState.clientSettings.psmActivityTimerUnit" style="width:  90%"
                :defaultValue="'SECOND'">
                <Select.Option value="MILLISECONDS">毫秒</Select.Option>
                <Select.Option value="SECOND">秒</Select.Option>
                <Select.Option value="MINUTE">分钟</Select.Option>
                <Select.Option value="HOUR">小时</Select.Option>
              </Select>
            </Form.Item>
            </Col>
          </Row>
        </template>
        <template v-if="formState.clientSettings.powerMode == 'E_DRX'">
          <Row :gutter="12">
            <Col :span="12">
            <Form.Item label="eDRX循环" :name="['clientSettings', 'edrxCycle']" :rules="[{ required: true }]">
              <InputNumber v-model:value="formState.clientSettings.edrxCycle" :defaultValue="81000" :min="6"
                :style="{ width: '100%' }" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="时间单位" :name="['clientSettings', 'edrxCycleUnit']">
              <Select v-model:value="formState.clientSettings.edrxCycleUnit" style="width:  90%" :defaultValue="'SECOND'">
                <Select.Option value="MILLISECONDS">毫秒</Select.Option>
                <Select.Option value="SECOND">秒</Select.Option>
                <Select.Option value="MINUTE">分钟</Select.Option>
                <Select.Option value="HOUR">小时</Select.Option>
              </Select>
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="分页传输窗口" :name="['clientSettings', 'pagingTransmissionWindow']"
              :rules="[{ required: true }]">
              <InputNumber v-model:value="formState.clientSettings.pagingTransmissionWindow" :defaultValue="10000"
                :min="2" :style="{ width: '100%' }" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="时间单位" :name="['clientSettings', 'pagingTransmissionWindowUnit']">
              <Select v-model:value="formState.clientSettings.pagingTransmissionWindowUnit" style="width:  90%"
                :defaultValue="'SECOND'">
                <Select.Option value="MILLISECONDS">毫秒</Select.Option>
                <Select.Option value="SECOND">秒</Select.Option>
                <Select.Option value="MINUTE">分钟</Select.Option>
                <Select.Option value="HOUR">小时</Select.Option>
              </Select>
            </Form.Item>
            </Col>
          </Row>
        </template>
      </CollapseContainer>
    </Form>
  </div>
</template>
<script lang="ts" setup name="COAPTransportForm">
import { ref, reactive } from 'vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { CodeEditor, MODE } from '/@/components/CodeEditor';
import { CollapseContainer } from '/@/components/Container'
import { Checkbox, Form, Input, InputNumber, Select, Col, Row } from 'ant-design-vue';
import { useI18n } from '/@/hooks/web/useI18n';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('tb');

const formRef = ref<FormInstance>();


const formState = reactive<any>({
  type: "COAP",
  clientSettings: {
    powerMode: 'DRX', // DRX,PSM,E_DRX
    psmActivityTimer: 10000,
    edrxCycle: 81000,
    pagingTransmissionWindow: 10000,
    psmActivityTimerUnit: 'SECOND',
    edrxCycleUnit: 'SECOND',
    pagingTransmissionWindowUnit: 'SECOND',
  },
  coapDeviceTypeConfiguration: {
    coapDeviceType: 'DEFAULT', //EFENTO  DEFAULT
    transportPayloadTypeConfiguration: {
      transportPayloadType: "JSON",//PROTOBUF
      enableCompatibilityWithJsonPayloadFormat: false,
      useJsonPayloadFormatForDefaultDownlinkTopics: false,
      deviceAttributesProtoSchema: "syntax =\"proto3\";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}",
      deviceRpcRequestProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}",
      deviceRpcResponseProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}",
      deviceTelemetryProtoSchema: "syntax =\"proto3\";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}",
    },
  }
});

function clear() {
  formState.type = "COAP";
  formState.clientSettings = {
    powerMode: 'DRX', // DRX,PSM,E_DRX
    psmActivityTimer: 10000,
    edrxCycle: 81000,
    pagingTransmissionWindow: 10000,
    psmActivityTimerUnit: 'SECOND',
    edrxCycleUnit: 'SECOND',
    pagingTransmissionWindowUnit: 'SECOND',
  };
  formState.coapDeviceTypeConfiguration = {
    coapDeviceType: 'DEFAULT', //EFENTO  DEFAULT
    transportPayloadTypeConfiguration: {
      transportPayloadType: "JSON",//PROTOBUF
      enableCompatibilityWithJsonPayloadFormat: false,
      useJsonPayloadFormatForDefaultDownlinkTopics: false,
      deviceAttributesProtoSchema: "syntax =\"proto3\";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}",
      deviceRpcRequestProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}",
      deviceRpcResponseProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}",
      deviceTelemetryProtoSchema: "syntax =\"proto3\";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}",
    },
  }
}

function handleCoapDeviceTypeChange(coapDeviceType: any) {

}

function handlePayloadTypeChange(payloadType: any) {

}



async function setConfigFieldsValue(values: any) {
  clear();
  Object.keys(values).forEach(key => {
    formState[key] = values[key];
  })
  if (formState.clientSettings.psmActivityTimer) {
    formState.clientSettings.psmActivityTimerUnit = 'SECOND';
    formState.clientSettings.psmActivityTimer = formState.clientSettings.psmActivityTimer / 1000;
  }
  if (formState.clientSettings.edrxCycle) {
    formState.clientSettings.edrxCycleUnit = 'SECOND';
    formState.clientSettings.edrxCycle = formState.clientSettings.edrxCycle / 1000;

  }
  if (formState.clientSettings.pagingTransmissionWindow) {
    formState.clientSettings.pagingTransmissionWindowUnit = 'SECOND';
    formState.clientSettings.pagingTransmissionWindow = formState.clientSettings.pagingTransmissionWindow / 1000;
  }
  formState.type = "COAP";
  if (!formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration) {
    formState.coapDeviceTypeConfiguration.transportPayloadTypeConfiguration = {
      transportPayloadType: 'JSON',//PROTOBUF
      enableCompatibilityWithJsonPayloadFormat: false,
      useJsonPayloadFormatForDefaultDownlinkTopics: false,
      deviceAttributesProtoSchema: "syntax =\"proto3\";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}",
      deviceRpcRequestProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}",
      deviceRpcResponseProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}",
      deviceTelemetryProtoSchema: "syntax =\"proto3\";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}",
    }
  }
}


async function validate() {
  const data = await formRef.value?.validate();
  if (data && data.clientSettings.psmActivityTimer) {
    data.clientSettings.psmActivityTimer = formatTimer(formState.clientSettings.psmActivityTimer, formState.clientSettings.psmActivityTimerUnit);
  }
  if (data && data.clientSettings.edrxCycle) {
    data.clientSettings.edrxCycle = formatTimer(formState.clientSettings.edrxCycle, formState.clientSettings.edrxCycleUnit);
  }
  if (data && data.clientSettings.pagingTransmissionWindow) {
    data.clientSettings.pagingTransmissionWindow = formatTimer(formState.clientSettings.pagingTransmissionWindow, formState.clientSettings.pagingTransmissionWindowUnit);
  }
  return data;
}

async function resetFields() {
  return formRef.value?.resetFields();
}

function formatTimer(timer: number, type: string) {
  let result = timer;
  if (type == 'SECOND') {
    result = result * 1000;
  } else if (type == 'MINUTE') {
    result = result * 1000 * 60;
  } else if (type == 'HOUR') {
    result = result * 1000 * 60 * 60;
  }
  return result
}

async function getFieldsValue() {
  const data = await validate();

  return data;
}

defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });


</script>