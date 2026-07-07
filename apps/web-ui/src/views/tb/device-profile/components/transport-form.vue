<script lang="ts" setup>
/**
 * 设备配置 - 第二步「传输配置」。
 * 支持 DEFAULT / MQTT / COAP 的完整配置;LWM2M / SNMP 的高级参数暂不支持在此编辑,
 * 编辑时原样保留原有配置(见 preservedConfig)。
 * 逻辑对齐 ui-ngx device-profile-transport-configuration 各子组件。
 */
import type { FormInstance } from 'antdv-next';

import type { DeviceProfile } from '#/api/tb/device-profile';

import { reactive, ref, watch } from 'vue';

import {
  Checkbox,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
} from 'antdv-next';

import {
  CoapTransportDeviceType,
  coapTransportDeviceTypeOptions,
  DeviceTransportType,
  deviceTransportTypeOptions,
  PowerMode,
  powerModeOptions,
  TransportPayloadType,
  transportPayloadTypeOptions,
} from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{
  disabled?: boolean;
  profile?: DeviceProfile | null;
}>();

const formRef = ref<FormInstance>();

const state = reactive({
  coapDeviceType: CoapTransportDeviceType.DEFAULT,
  coapPayloadType: TransportPayloadType.JSON,
  deviceAttributesProtoSchema: '',
  deviceAttributesSubscribeTopic: 'v1/devices/me/attributes',
  deviceAttributesTopic: 'v1/devices/me/attributes',
  deviceRpcRequestProtoSchema: '',
  deviceRpcResponseProtoSchema: '',
  deviceTelemetryProtoSchema: '',
  deviceTelemetryTopic: 'v1/devices/me/telemetry',
  edrxCycle: undefined as number | undefined,
  mqttEnableCompat: false,
  mqttPayloadType: TransportPayloadType.JSON,
  mqttUseJsonForDownlink: false,
  pagingTransmissionWindow: undefined as number | undefined,
  powerMode: PowerMode.DRX as null | PowerMode,
  psmActivityTimer: undefined as number | undefined,
  sendAckOnValidationException: false,
  sparkplug: false,
  sparkplugAttributesMetricNames: [
    'Node Control/*',
    'Device Control/*',
    'Properties/*',
  ] as string[],
  transportType: DeviceTransportType.DEFAULT,
});

/** LWM2M / SNMP 等暂不支持编辑的传输配置原样保留 */
let preservedConfig: null | Record<string, any> = null;

const topicRule = [
  { message: $t('tb.deviceProfile.validation.topicRequired'), required: true },
];

watch(
  () => props.profile,
  (profile) => {
    resetToDefault(
      (profile?.transportType as DeviceTransportType) ??
        DeviceTransportType.DEFAULT,
    );
    const config = profile?.profileData?.transportConfiguration;
    if (config) {
      populate(config);
    }
  },
  { immediate: true },
);

function onTransportTypeChange(value: DeviceTransportType) {
  resetToDefault(value);
}

/** 切换传输类型时重置为该类型默认配置(镜像 createDeviceProfileTransportConfiguration) */
function resetToDefault(type: DeviceTransportType) {
  state.transportType = type;
  preservedConfig = null;
  switch (type) {
    case DeviceTransportType.COAP: {
      state.coapDeviceType = CoapTransportDeviceType.DEFAULT;
      state.coapPayloadType = TransportPayloadType.JSON;
      state.powerMode = PowerMode.DRX;
      state.psmActivityTimer = undefined;
      state.edrxCycle = undefined;
      state.pagingTransmissionWindow = undefined;
      break;
    }
    case DeviceTransportType.LWM2M: {
      preservedConfig = {
        bootstrap: [],
        clientLwM2mSettings: {
          clientOnlyObserveAfterConnect: 1,
          defaultObjectIDVer: 'V1_0',
          fwUpdateStrategy: 1,
          powerMode: 'DRX',
          swUpdateStrategy: 1,
        },
        observeAttr: {
          attribute: [],
          attributeLwm2m: {},
          keyName: {},
          observe: [],
          observeStrategy: 'SINGLE',
          telemetry: [],
        },
      };
      break;
    }
    case DeviceTransportType.MQTT: {
      state.deviceTelemetryTopic = 'v1/devices/me/telemetry';
      state.deviceAttributesTopic = 'v1/devices/me/attributes';
      state.deviceAttributesSubscribeTopic = 'v1/devices/me/attributes';
      state.mqttPayloadType = TransportPayloadType.JSON;
      state.mqttEnableCompat = false;
      state.mqttUseJsonForDownlink = false;
      state.sparkplug = false;
      state.sparkplugAttributesMetricNames = [
        'Node Control/*',
        'Device Control/*',
        'Properties/*',
      ];
      state.sendAckOnValidationException = false;
      break;
    }
    case DeviceTransportType.SNMP: {
      preservedConfig = {
        communicationConfigs: null,
        retries: 0,
        timeoutMs: 500,
      };
      break;
    }
    // No default
  }
}

function populate(config: Record<string, any>) {
  switch (state.transportType) {
    case DeviceTransportType.COAP: {
      const coapCfg = config.coapDeviceTypeConfiguration ?? {};
      state.coapDeviceType =
        coapCfg.coapDeviceType ?? CoapTransportDeviceType.DEFAULT;
      const payload = coapCfg.transportPayloadTypeConfiguration ?? {};
      state.coapPayloadType =
        payload.transportPayloadType ?? TransportPayloadType.JSON;
      readProtoSchemas(payload);
      const client = config.clientSettings ?? {};
      state.powerMode = client.powerMode ?? null;
      state.psmActivityTimer = client.psmActivityTimer;
      state.edrxCycle = client.edrxCycle;
      state.pagingTransmissionWindow = client.pagingTransmissionWindow;
      break;
    }
    case DeviceTransportType.LWM2M:
    case DeviceTransportType.SNMP: {
      preservedConfig = config;
      break;
    }
    case DeviceTransportType.MQTT: {
      state.deviceTelemetryTopic =
        config.deviceTelemetryTopic ?? state.deviceTelemetryTopic;
      state.deviceAttributesTopic =
        config.deviceAttributesTopic ?? state.deviceAttributesTopic;
      state.deviceAttributesSubscribeTopic =
        config.deviceAttributesSubscribeTopic ??
        state.deviceAttributesSubscribeTopic;
      state.sparkplug = config.sparkplug ?? false;
      state.sparkplugAttributesMetricNames =
        config.sparkplugAttributesMetricNames ??
        state.sparkplugAttributesMetricNames;
      state.sendAckOnValidationException =
        config.sendAckOnValidationException ?? false;
      const payload = config.transportPayloadTypeConfiguration ?? {};
      state.mqttPayloadType =
        payload.transportPayloadType ?? TransportPayloadType.JSON;
      state.mqttEnableCompat =
        payload.enableCompatibilityWithJsonPayloadFormat ?? false;
      state.mqttUseJsonForDownlink =
        payload.useJsonPayloadFormatForDefaultDownlinkTopics ?? false;
      readProtoSchemas(payload);
      break;
    }
    // No default
  }
}

function readProtoSchemas(payload: Record<string, any>) {
  state.deviceTelemetryProtoSchema = payload.deviceTelemetryProtoSchema ?? '';
  state.deviceAttributesProtoSchema = payload.deviceAttributesProtoSchema ?? '';
  state.deviceRpcRequestProtoSchema = payload.deviceRpcRequestProtoSchema ?? '';
  state.deviceRpcResponseProtoSchema =
    payload.deviceRpcResponseProtoSchema ?? '';
}

function buildProtoPayload(payloadType: TransportPayloadType) {
  const payload: Record<string, any> = {
    transportPayloadType: payloadType,
  };
  if (payloadType === TransportPayloadType.PROTOBUF) {
    payload.deviceTelemetryProtoSchema = state.deviceTelemetryProtoSchema;
    payload.deviceAttributesProtoSchema = state.deviceAttributesProtoSchema;
    payload.deviceRpcRequestProtoSchema = state.deviceRpcRequestProtoSchema;
    payload.deviceRpcResponseProtoSchema = state.deviceRpcResponseProtoSchema;
  }
  return payload;
}

function buildTransportConfiguration(): Record<string, any> {
  switch (state.transportType) {
    case DeviceTransportType.COAP: {
      const coapDeviceTypeConfiguration: Record<string, any> = {
        coapDeviceType: state.coapDeviceType,
      };
      if (state.coapDeviceType === CoapTransportDeviceType.DEFAULT) {
        const payload = buildProtoPayload(state.coapPayloadType);
        payload.enableCompatibilityWithJsonPayloadFormat = false;
        coapDeviceTypeConfiguration.transportPayloadTypeConfiguration = payload;
      }
      const clientSettings: Record<string, any> = {
        powerMode: state.powerMode,
      };
      if (state.powerMode === PowerMode.PSM) {
        clientSettings.psmActivityTimer = state.psmActivityTimer;
      } else if (state.powerMode === PowerMode.E_DRX) {
        clientSettings.edrxCycle = state.edrxCycle;
        clientSettings.pagingTransmissionWindow =
          state.pagingTransmissionWindow;
      }
      return {
        clientSettings,
        coapDeviceTypeConfiguration,
        type: DeviceTransportType.COAP,
      };
    }
    case DeviceTransportType.MQTT: {
      const payload = buildProtoPayload(state.mqttPayloadType);
      payload.enableCompatibilityWithJsonPayloadFormat = state.mqttEnableCompat;
      payload.useJsonPayloadFormatForDefaultDownlinkTopics =
        state.mqttEnableCompat && state.mqttUseJsonForDownlink;
      return {
        deviceAttributesSubscribeTopic: state.deviceAttributesSubscribeTopic,
        deviceAttributesTopic: state.deviceAttributesTopic,
        deviceTelemetryTopic: state.deviceTelemetryTopic,
        sendAckOnValidationException: state.sendAckOnValidationException,
        sparkplug: state.sparkplug,
        sparkplugAttributesMetricNames: state.sparkplug
          ? state.sparkplugAttributesMetricNames
          : [],
        transportPayloadTypeConfiguration: payload,
        type: DeviceTransportType.MQTT,
      };
    }
    default: {
      // LWM2M / SNMP:保留原有(或默认)配置
      return {
        ...preservedConfig,
        type: state.transportType,
      };
    }
  }
}

const isProtobufMqtt = () =>
  state.mqttPayloadType === TransportPayloadType.PROTOBUF;
const isProtobufCoap = () =>
  state.coapPayloadType === TransportPayloadType.PROTOBUF;

defineExpose({
  getValues() {
    return {
      transportConfiguration: buildTransportConfiguration(),
      transportType: state.transportType,
    };
  },
  async validate(): Promise<boolean> {
    try {
      await formRef.value?.validate();
      return true;
    } catch {
      return false;
    }
  },
});
</script>

<template>
  <Form
    ref="formRef"
    :disabled="disabled"
    :model="state"
    layout="vertical"
    size="large"
  >
    <FormItem
      :label="$t('tb.deviceProfile.fields.transportType')"
      name="transportType"
    >
      <Select
        v-model:value="state.transportType"
        :options="deviceTransportTypeOptions()"
        @change="onTransportTypeChange"
      />
    </FormItem>

    <!-- DEFAULT -->
    <div
      v-if="state.transportType === DeviceTransportType.DEFAULT"
      class="text-muted-foreground text-sm"
    >
      {{ $t('tb.deviceProfile.transportInfo.default') }}
    </div>

    <!-- MQTT -->
    <template v-else-if="state.transportType === DeviceTransportType.MQTT">
      <FormItem>
        <Checkbox v-model:checked="state.sparkplug">
          {{ $t('tb.deviceProfile.transport.sparkplug') }}
        </Checkbox>
      </FormItem>

      <!-- Sparkplug B EoN 节点模式:只配置作为属性存储的指标名 -->
      <template v-if="state.sparkplug">
        <div class="text-muted-foreground mb-3 text-xs">
          {{ $t('tb.deviceProfile.transport.sparkplugHint') }}
        </div>
        <FormItem
          :label="$t('tb.deviceProfile.transport.sparkplugMetricNames')"
        >
          <Select
            v-model:value="state.sparkplugAttributesMetricNames"
            mode="tags"
            :open="false"
            :placeholder="$t('tb.deviceProfile.transport.sparkplugMetricNames')"
          />
          <div class="text-muted-foreground mt-1 text-xs">
            {{ $t('tb.deviceProfile.transport.sparkplugMetricNamesHint') }}
          </div>
        </FormItem>
      </template>

      <!-- 标准 MQTT 主题过滤器模式 -->
      <template v-else>
        <div class="mb-2 font-medium">
          {{ $t('tb.deviceProfile.transport.mqttTopicFilters') }}
        </div>
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-3">
          <FormItem
            :label="$t('tb.deviceProfile.transport.telemetryTopic')"
            :rules="topicRule"
            name="deviceTelemetryTopic"
          >
            <Input v-model:value="state.deviceTelemetryTopic" />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.attributesTopic')"
            :rules="topicRule"
            name="deviceAttributesTopic"
          >
            <Input v-model:value="state.deviceAttributesTopic" />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.attributesSubscribeTopic')"
            :rules="topicRule"
            name="deviceAttributesSubscribeTopic"
          >
            <Input v-model:value="state.deviceAttributesSubscribeTopic" />
          </FormItem>
        </div>

        <FormItem :label="$t('tb.deviceProfile.transport.payloadType')">
          <Select
            v-model:value="state.mqttPayloadType"
            :options="transportPayloadTypeOptions()"
          />
        </FormItem>

        <template v-if="isProtobufMqtt()">
          <FormItem
            :label="$t('tb.deviceProfile.transport.telemetryProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceTelemetryProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.attributesProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceAttributesProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.rpcRequestProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceRpcRequestProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.rpcResponseProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceRpcResponseProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem>
            <Checkbox v-model:checked="state.mqttEnableCompat">
              {{ $t('tb.deviceProfile.transport.enableJsonCompat') }}
            </Checkbox>
          </FormItem>
          <FormItem v-if="state.mqttEnableCompat">
            <Checkbox v-model:checked="state.mqttUseJsonForDownlink">
              {{ $t('tb.deviceProfile.transport.useJsonForDownlink') }}
            </Checkbox>
          </FormItem>
        </template>

        <FormItem>
          <Checkbox v-model:checked="state.sendAckOnValidationException">
            {{ $t('tb.deviceProfile.transport.sendAckOnValidationException') }}
          </Checkbox>
        </FormItem>
      </template>
    </template>

    <!-- COAP -->
    <template v-else-if="state.transportType === DeviceTransportType.COAP">
      <FormItem :label="$t('tb.deviceProfile.transport.coapDeviceType')">
        <Select
          v-model:value="state.coapDeviceType"
          :options="coapTransportDeviceTypeOptions()"
        />
      </FormItem>

      <template v-if="state.coapDeviceType === CoapTransportDeviceType.DEFAULT">
        <FormItem :label="$t('tb.deviceProfile.transport.payloadType')">
          <Select
            v-model:value="state.coapPayloadType"
            :options="transportPayloadTypeOptions()"
          />
        </FormItem>
        <template v-if="isProtobufCoap()">
          <FormItem
            :label="$t('tb.deviceProfile.transport.telemetryProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceTelemetryProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.attributesProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceAttributesProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.rpcRequestProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceRpcRequestProtoSchema"
              :rows="4"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.deviceProfile.transport.rpcResponseProtoSchema')"
          >
            <Input.TextArea
              v-model:value="state.deviceRpcResponseProtoSchema"
              :rows="4"
            />
          </FormItem>
        </template>
      </template>

      <div class="mb-2 font-medium">
        {{ $t('tb.deviceProfile.transport.powerSavingMode') }}
      </div>
      <FormItem :label="$t('tb.deviceProfile.transport.powerMode')">
        <Select
          v-model:value="state.powerMode"
          allow-clear
          :options="powerModeOptions()"
        />
      </FormItem>
      <FormItem
        v-if="state.powerMode === PowerMode.PSM"
        :label="$t('tb.deviceProfile.transport.psmActivityTimer')"
      >
        <InputNumber
          v-model:value="state.psmActivityTimer"
          class="w-full"
          :min="0"
        />
      </FormItem>
      <template v-if="state.powerMode === PowerMode.E_DRX">
        <FormItem :label="$t('tb.deviceProfile.transport.edrxCycle')">
          <InputNumber
            v-model:value="state.edrxCycle"
            class="w-full"
            :min="0"
          />
        </FormItem>
        <FormItem
          :label="$t('tb.deviceProfile.transport.pagingTransmissionWindow')"
        >
          <InputNumber
            v-model:value="state.pagingTransmissionWindow"
            class="w-full"
            :min="0"
          />
        </FormItem>
      </template>
    </template>

    <!-- LWM2M / SNMP:暂不支持编辑 -->
    <div
      v-else
      class="border-warning/50 bg-warning/10 text-muted-foreground rounded-md border border-dashed p-3 text-sm"
    >
      {{ $t('tb.deviceProfile.transportInfo.unsupported') }}
    </div>
  </Form>
</template>
