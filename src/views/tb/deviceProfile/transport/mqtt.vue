<template>
  <div class="mqtt-transport-form">
  <p class="text-xs text-neutral-500">{{ t('tb.deviceProfile.mqtt.enableAdvanced') }}</p>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item name="type" :hidden="true">
        <Input v-model:value="formState.type" />
      </Form.Item>
      <Form.Item name="sparkplug">
        <Checkbox v-model:checked="formState.sparkplug" @change="handleSparkplugChange" />
        <span class="ml-2">{{ t('tb.deviceProfile.mqtt.sparkplugNode') }}</span>
        <p class="text-xs text-neutral-500" v-show="formState.sparkplug == true">
          {{ t('tb.deviceProfile.mqtt.sparkplugNodeDesc') }}
        </p>
      </Form.Item>

      <Form.Item
        :label="t('tb.deviceProfile.mqtt.sparkplugAttrMetricNames')"
        name="sparkplugAttributesMetricNames"
        v-show="formState.sparkplug == true"
      >
        <Select v-model:value="formState.sparkplugAttributesMetricNames" size="large" :mode="'tags'" />
        <p class="text-xs text-neutral-500">{{ t('tb.deviceProfile.mqtt.sparkplugAttrMetricNamesDesc') }}</p>
      </Form.Item>

      <CollapseContainer
        :title="t('tb.deviceProfile.mqtt.topicFilters')"
        :canExpan="false"
        class="border border-solid border-neutral-300 mb-4"
        v-show="formState.sparkplug == false"
      >
        <Row :gutter="4">
          <Col :span="8">
            <Form.Item :label="t('tb.deviceProfile.mqtt.telemetryTopic')" name="deviceTelemetryTopic" :rules="[{ required: true }]">
              <Input v-model:value="formState.deviceTelemetryTopic" size="large" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item :label="t('tb.deviceProfile.mqtt.attributesTopic')" name="deviceAttributesTopic" :rules="[{ required: true }]">
              <Input v-model:value="formState.deviceAttributesTopic" size="large" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item :label="t('tb.deviceProfile.mqtt.attributesSubscribeTopic')" name="deviceAttributesSubscribeTopic" :rules="[{ required: true }]">
              <Input v-model:value="formState.deviceAttributesSubscribeTopic" size="large" />
            </Form.Item>
          </Col>
        </Row>
        <div class="text-xs">
          <p>{{ t('tb.deviceProfile.mqtt.topicWildcardHelp1') }}</p>
          <p>{{ t('tb.deviceProfile.mqtt.topicWildcardHelp2') }}</p>
          <p>{{ t('tb.deviceProfile.mqtt.topicWildcardHelp3') }}</p>
        </div>
      </CollapseContainer>
      <CollapseContainer
        :title="t('tb.deviceProfile.mqtt.payload')"
        :canExpan="false"
        class="border border-solid border-neutral-300 mb-4"
        v-show="formState.sparkplug == false"
      >
        <Form.Item :name="['transportPayloadTypeConfiguration', 'transportPayloadType']">
          <Select
            v-model:value="formState.transportPayloadTypeConfiguration.transportPayloadType"
            :allowClear="false"
            size="large"
            @change="handleTransportPayloadType"
            :options="[
              { label: 'JSON', value: 'JSON' },
              { label: 'PROTOBUF', value: 'PROTOBUF' },
            ]"
          />
        </Form.Item>
        <template v-if="formState.transportPayloadTypeConfiguration.transportPayloadType == 'PROTOBUF'">
          <Form.Item :name="['transportPayloadTypeConfiguration', 'enableCompatibilityWithJsonPayloadFormat']">
            <Checkbox
              v-model:checked="formState.transportPayloadTypeConfiguration.enableCompatibilityWithJsonPayloadFormat"
            />
            <span class="ml-2">{{ t('tb.deviceProfile.mqtt.enableCompatibility') }}</span>
            <p class="text-xs text-neutral-500">{{ t('tb.deviceProfile.mqtt.enableCompatibilityDesc') }}</p>
          </Form.Item>
          <Form.Item
            :name="['transportPayloadTypeConfiguration', 'useJsonPayloadFormatForDefaultDownlinkTopics']"
            v-show="formState.transportPayloadTypeConfiguration.enableCompatibilityWithJsonPayloadFormat == true"
          >
            <Checkbox
              v-model:checked="formState.transportPayloadTypeConfiguration.useJsonPayloadFormatForDefaultDownlinkTopics"
            />
            <span class="ml-2">{{ t('tb.deviceProfile.mqtt.useJsonDownlink') }}</span>
            <p class="text-xs text-neutral-500">{{ t('tb.deviceProfile.mqtt.useJsonDownlinkDesc') }}</p>
          </Form.Item>
          <Form.Item
            :label="t('tb.deviceProfile.mqtt.telemetryProto')"
            :name="['transportPayloadTypeConfiguration', 'deviceTelemetryProtoSchema']"
            :rules="[{ required: true }]"
          >
            <CodeEditor
              v-model:value="formState.transportPayloadTypeConfiguration.deviceTelemetryProtoSchema"
              :mode="MODE.JAVASCRIPT"
              class="border border-solid border-gray-400"
            />
          </Form.Item>
          <Form.Item
            :label="t('tb.deviceProfile.mqtt.attributesProto')"
            :name="['transportPayloadTypeConfiguration', 'deviceAttributesProtoSchema']"
            :rules="[{ required: true }]"
          >
            <CodeEditor
              v-model:value="formState.transportPayloadTypeConfiguration.deviceAttributesProtoSchema"
              :mode="MODE.JAVASCRIPT"
              class="border border-solid border-gray-400"
            />
          </Form.Item>
          <Form.Item
            :label="t('tb.deviceProfile.mqtt.rpcRequestProto')"
            :name="['transportPayloadTypeConfiguration', 'deviceRpcRequestProtoSchema']"
            :rules="[{ required: true }]"
          >
            <CodeEditor
              v-model:value="formState.transportPayloadTypeConfiguration.deviceRpcRequestProtoSchema"
              :mode="MODE.JAVASCRIPT"
              class="border border-solid border-gray-400"
            />
          </Form.Item>
          <Form.Item
            :label="t('tb.deviceProfile.mqtt.rpcResponseProto')"
            :name="['transportPayloadTypeConfiguration', 'deviceRpcResponseProtoSchema']"
            :rules="[{ required: true }]"
          >
            <CodeEditor
              v-model:value="formState.transportPayloadTypeConfiguration.deviceRpcResponseProtoSchema"
              :mode="MODE.JAVASCRIPT"
              class="border border-solid border-gray-400"
            />
          </Form.Item>
        </template>
      </CollapseContainer>

      <Form.Item name="sendAckOnValidationException" v-show="formState.sparkplug == false">
        <Checkbox v-model:checked="formState.sendAckOnValidationException" />
        <span class="ml-2">{{ t('tb.deviceProfile.mqtt.sendAckOnValidation') }}</span>
        <p class="text-xs text-neutral-500">{{ t('tb.deviceProfile.mqtt.sendAckOnValidationDesc') }}</p>
      </Form.Item>
    </Form>
  </div>
</template>
<script lang="ts" setup name="MQTTTransportForm">
  import { ref, reactive } from 'vue';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { CollapseContainer } from '/@/components/Container';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Checkbox, Form, Input, Select, Col, Row } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    deviceAttributesSubscribeTopic: 'v1/devices/me/attributes',
    deviceAttributesTopic: 'v1/devices/me/attributes',
    deviceTelemetryTopic: 'v1/devices/me/telemetry',
    sendAckOnValidationException: false,
    sparkplug: false,
    sparkplugAttributesMetricNames: ['Properties/*', 'Device Control/*', 'Node Control/*'],
    transportPayloadTypeConfiguration: {
      transportPayloadType: 'JSON', //PROTOBUF
      enableCompatibilityWithJsonPayloadFormat: false,
      useJsonPayloadFormatForDefaultDownlinkTopics: false,
      deviceAttributesProtoSchema:
        'syntax ="proto3";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}',
      deviceRpcRequestProtoSchema:
        'syntax ="proto3";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}',
      deviceRpcResponseProtoSchema:
        'syntax ="proto3";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}',
      deviceTelemetryProtoSchema:
        'syntax ="proto3";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}',
    },
    type: 'MQTT',
  });

  function clear() {
    formState.deviceAttributesSubscribeTopic = 'v1/devices/me/attributes';
    formState.deviceAttributesTopic = 'v1/devices/me/attributes';
    formState.deviceTelemetryTopic = 'v1/devices/me/telemetry';
    formState.sendAckOnValidationException = false;
    formState.formStatesparkplug = false;
    formState.formStatesparkplugAttributesMetricNames = ['Properties/*', 'Device Control/*', 'Node Control/*'];
    formState.transportPayloadTypeConfiguration = {
      transportPayloadType: 'JSON', //PROTOBUF
      enableCompatibilityWithJsonPayloadFormat: false,
      useJsonPayloadFormatForDefaultDownlinkTopics: false,
      deviceAttributesProtoSchema:
        'syntax ="proto3";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}',
      deviceRpcRequestProtoSchema:
        'syntax ="proto3";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}',
      deviceRpcResponseProtoSchema:
        'syntax ="proto3";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}',
      deviceTelemetryProtoSchema:
        'syntax ="proto3";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}',
    };
    formState.type = 'MQTT';
  }

  function handleSparkplugChange(event: any) {
    const checked = event.target.checked;
  }

  function handleTransportPayloadType(type: any) {
    if (type == 'PROTOBUF') {
      formState.transportPayloadTypeConfiguration.deviceAttributesProtoSchema =
        'syntax ="proto3";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}';
      formState.transportPayloadTypeConfiguration.deviceRpcRequestProtoSchema =
        'syntax ="proto3";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}';
      formState.transportPayloadTypeConfiguration.deviceRpcResponseProtoSchema =
        'syntax ="proto3";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}';
      formState.transportPayloadTypeConfiguration.deviceTelemetryProtoSchema =
        'syntax ="proto3";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}';
    }
  }

  async function setConfigFieldsValue(values: any) {
    clear();
    Object.keys(values).forEach((key) => {
      formState[key] = values[key];
    });
    formState.type = 'MQTT';
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
