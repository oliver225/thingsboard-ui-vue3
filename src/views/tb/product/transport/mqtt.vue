<template>
  <div class="mqtt-transport-form">
    <p class="text-xs text-neutral-500">启用高级MQTT传输设置。</p>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item name="type" :hidden="true">
        <Input v-model:value="formState.type" />
      </Form.Item>
      <Form.Item name="sparkplug">
        <Checkbox v-model:checked="formState.sparkplug" @change="handleSparkplugChange" />
        <span class="ml-2">MQTT Sparkplug B边缘网络（EoN）节点</span>
        <p class="text-xs text-neutral-500" v-show="formState.sparkplug == true">允许来自具备Sparkplug
          B负载和Topic格式的边缘网络（EoN）节点的连接。</p>
      </Form.Item>

      <Form.Item label="将SparkPlug指标存储为属性。" name="sparkplugAttributesMetricNames" v-show="formState.sparkplug == true">
        <Select v-model:value="formState.sparkplugAttributesMetricNames" size="large" :mode="'tags'" />
        <p class="text-xs text-neutral-500">将作为设备属性存储的SparkPlug指标的名称。其他指标将作为设备遥测数据进行存储。</p>
      </Form.Item>

      <CollapseContainer title="MQTT 设备 Topic 筛选器" :canExpan="false" class="border border-solid border-neutral-300 mb-4"
        v-show="formState.sparkplug == false">
        <Row :gutter="4">
          <Col :span="8">
          <Form.Item label="遥测数据Topic" name="deviceTelemetryTopic" :rules="[{ required: true }]">
            <Input v-model:value="formState.deviceTelemetryTopic" size="large" />
          </Form.Item>
          </Col>
          <Col :span="8">
          <Form.Item label="属性Topic" name="deviceAttributesTopic" :rules="[{ required: true }]">
            <Input v-model:value="formState.deviceAttributesTopic" size="large" />
          </Form.Item>
          </Col>
          <Col :span="8">
          <Form.Item label="订阅属性Topic" name="deviceAttributesSubscribeTopic" :rules="[{ required: true }]">
            <Input v-model:value="formState.deviceAttributesSubscribeTopic" size="large" />
          </Form.Item>
          </Col>
        </Row>
        <div class="text-xs">
          <p>支持单[+]和多级[#]通配符。</p>
          <p>[+] 适用于任何 Topic 过滤级别。例如：v1/devices/+/telemetry or +/devices/+/attributes。</p>
          <p>[#]可以替换 Topic 筛选器本身，并且必须是 Topic 的最后一个符号。例如：# or v1/devices/me/#。</p>
        </div>
      </CollapseContainer>
      <CollapseContainer title="MQTT 设备 Payload" :canExpan="false" class="border border-solid border-neutral-300 mb-4"
        v-show="formState.sparkplug == false">
        <Form.Item :name="['transportPayloadTypeConfiguration', 'transportPayloadType']">
          <Select v-model:value="formState.transportPayloadTypeConfiguration.transportPayloadType" :allowClear="false"
            size="large" @change="handleTransportPayloadType" :options="[
              { label: 'JSON', value: 'JSON' },
              { label: 'PROTOBUF', value: 'PROTOBUF' },
            ]" />
        </Form.Item>
        <template v-if="formState.transportPayloadTypeConfiguration.transportPayloadType == 'PROTOBUF'">
          <Form.Item :name="['transportPayloadTypeConfiguration', 'enableCompatibilityWithJsonPayloadFormat']">
            <Checkbox
              v-model:checked="formState.transportPayloadTypeConfiguration.enableCompatibilityWithJsonPayloadFormat" />
            <span class="ml-2">启用与其他payload格式兼容</span>
            <p class="text-xs text-neutral-500">
              启用后平台将默认使用Protobuf的payload格式，如果解析失败平台将尝试使用JSON的payload格式。对于固件更新期间的向后兼容性很有用，例如固件的初始版本使用Json而新版本使用Protobuf在设备队列的固件更新过程中，需要同时支持Protobuf和JSON。兼容模式会导致一点的性能下降，因此建议在所有设备更新后禁用此模式。
            </p>
          </Form.Item>
          <Form.Item :name="['transportPayloadTypeConfiguration', 'useJsonPayloadFormatForDefaultDownlinkTopics']"
            v-show="formState.transportPayloadTypeConfiguration.enableCompatibilityWithJsonPayloadFormat == true">
            <Checkbox
              v-model:checked="formState.transportPayloadTypeConfiguration.useJsonPayloadFormatForDefaultDownlinkTopics" />
            <span class="ml-2">缺省下行主题采用json格式</span>
            <p class="text-xs text-neutral-500">
              启用后平台将使用Json的playload格式通过以下主题推送属性和RPC：v1/devices/me/attributes/response/$request_id、v1/devices/me/attributes
              、v1/devices/me/rpc/request/$request_id、v1/devices/me/rpc/response/$request_id。此设置不会影响使用新(v2)主题发送的属性和rpc订阅：v2/a/res/$request_id、v2/a、v2/r
              /req/$request_id，v2/r/res/$request_id。其中$request_id是一个整数请求标识符。 </p>
          </Form.Item>
          <Form.Item label="遥测数据 proto schema" :name="['transportPayloadTypeConfiguration', 'deviceTelemetryProtoSchema']"
            :rules="[{ required: true }]">
            <CodeEditor v-model:value="formState.transportPayloadTypeConfiguration.deviceTelemetryProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400" />
          </Form.Item>
          <Form.Item label="属性 proto schema" :name="['transportPayloadTypeConfiguration', 'deviceAttributesProtoSchema']"
            :rules="[{ required: true }]">
            <CodeEditor v-model:value="formState.transportPayloadTypeConfiguration.deviceAttributesProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400 " />
          </Form.Item>
          <Form.Item label="RPC 请求 proto schema"
            :name="['transportPayloadTypeConfiguration', 'deviceRpcRequestProtoSchema']" :rules="[{ required: true }]">
            <CodeEditor v-model:value="formState.transportPayloadTypeConfiguration.deviceRpcRequestProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400" />
          </Form.Item>
          <Form.Item label="RPC 响应 proto schema"
            :name="['transportPayloadTypeConfiguration', 'deviceRpcResponseProtoSchema']" :rules="[{ required: true }]">
            <CodeEditor v-model:value="formState.transportPayloadTypeConfiguration.deviceRpcResponseProtoSchema"
              :mode="MODE.JS" class="border border-solid border-gray-400" />
          </Form.Item>
        </template>
      </CollapseContainer>

      <Form.Item name="sendAckOnValidationException" v-show="formState.sparkplug == false">
        <Checkbox v-model:checked="formState.sendAckOnValidationException" />
        <span class="ml-2">发布消息验证失败时发送PUBACK</span>
        <p class="text-xs text-neutral-500">默认情况下平台将关闭相关消息验证失败的MQTT会话，启用后平台将发布确认而不是关闭会话。</p>
      </Form.Item>


    </Form>
  </div>
</template>
<script lang="ts" setup name="MQTTTransportForm">
import { ref, reactive } from 'vue';
import { CodeEditor, MODE } from '/@/components/CodeEditor';
import { FormInstance } from 'ant-design-vue/lib/form';
import { CollapseContainer } from '/@/components/Container'
import { useI18n } from '/@/hooks/web/useI18n';
import { Checkbox, Form, Input, Select, Col, Row } from 'ant-design-vue';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('tb');

const formRef = ref<FormInstance>();

const formState = reactive<any>({
  deviceAttributesSubscribeTopic: "v1/devices/me/attributes",
  deviceAttributesTopic: "v1/devices/me/attributes",
  deviceTelemetryTopic: "v1/devices/me/telemetry",
  sendAckOnValidationException: false,
  sparkplug: false,
  sparkplugAttributesMetricNames: ["Properties/*", "Device Control/*", "Node Control/*"],
  transportPayloadTypeConfiguration: {
    transportPayloadType: "JSON",//PROTOBUF
    enableCompatibilityWithJsonPayloadFormat: false,
    useJsonPayloadFormatForDefaultDownlinkTopics: false,
    deviceAttributesProtoSchema: "syntax =\"proto3\";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}",
    deviceRpcRequestProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}",
    deviceRpcResponseProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}",
    deviceTelemetryProtoSchema: "syntax =\"proto3\";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}",
  },
  type: "MQTT",
});

function clear() {
  formState.deviceAttributesSubscribeTopic = "v1/devices/me/attributes";
  formState.deviceAttributesTopic = "v1/devices/me/attributes";
  formState.deviceTelemetryTopic = "v1/devices/me/telemetry";
  formState.sendAckOnValidationException = false;
  formState.formStatesparkplug = false;
  formState.formStatesparkplugAttributesMetricNames = ["Properties/*", "Device Control/*", "Node Control/*"];
  formState.transportPayloadTypeConfiguration = {
    transportPayloadType: "JSON",//PROTOBUF
    enableCompatibilityWithJsonPayloadFormat: false,
    useJsonPayloadFormatForDefaultDownlinkTopics: false,
    deviceAttributesProtoSchema: "syntax =\"proto3\";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}",
    deviceRpcRequestProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}",
    deviceRpcResponseProtoSchema: "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}",
    deviceTelemetryProtoSchema: "syntax =\"proto3\";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}",

  };
  formState.type = "MQTT";
}


function handleSparkplugChange(event: any) {
  const checked = event.target.checked;
}

function handleTransportPayloadType(type: any) {
  if (type == "PROTOBUF") {
    formState.transportPayloadTypeConfiguration.deviceAttributesProtoSchema = "syntax =\"proto3\";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}";
    formState.transportPayloadTypeConfiguration.deviceRpcRequestProtoSchema = "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}";
    formState.transportPayloadTypeConfiguration.deviceRpcResponseProtoSchema = "syntax =\"proto3\";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}";
    formState.transportPayloadTypeConfiguration.deviceTelemetryProtoSchema = "syntax =\"proto3\";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}";
  }
}


async function setConfigFieldsValue(values: any) {
  clear();
  Object.keys(values).forEach(key => {
    formState[key] = values[key];
  })
  formState.type = "MQTT";
}

async function validate() {
  return await formRef.value?.validate();
}

async function resetFields() {
  return formRef.value?.resetFields();
}

async function getFieldsValue() {
  const data = await formRef.value?.validate();
  return data;
}

defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });


</script>