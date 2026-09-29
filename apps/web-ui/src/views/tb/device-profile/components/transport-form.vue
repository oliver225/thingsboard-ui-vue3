<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { DeviceProfile } from '#/api/tb/device-profile';

import { reactive, watch } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
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

function createDefaultValues() {
  return {
    coapDeviceType: CoapTransportDeviceType.DEFAULT,
    coapPayloadType: TransportPayloadType.JSON,
    deviceAttributesProtoSchema:
      'syntax ="proto3";\npackage attributes;\n\nmessage SensorConfiguration {\n  optional string firmwareVersion = 1;\n  optional string serialNumber = 2;\n}',
    deviceAttributesSubscribeTopic: 'v1/devices/me/attributes',
    deviceAttributesTopic: 'v1/devices/me/attributes',
    deviceRpcRequestProtoSchema:
      'syntax ="proto3";\npackage rpc;\n\nmessage RpcRequestMsg {\n  optional string method = 1;\n  optional int32 requestId = 2;\n  optional string params = 3;\n}',
    deviceRpcResponseProtoSchema:
      'syntax ="proto3";\npackage rpc;\n\nmessage RpcResponseMsg {\n  optional string payload = 1;\n}',
    deviceTelemetryProtoSchema:
      'syntax ="proto3";\npackage telemetry;\n\nmessage SensorDataReading {\n\n  optional double temperature = 1;\n  optional double humidity = 2;\n  InnerObject innerObject = 3;\n\n  message InnerObject {\n    optional string key1 = 1;\n    optional bool key2 = 2;\n    optional double key3 = 3;\n    optional int32 key4 = 4;\n    optional string key5 = 5;\n  }\n}\n',
    deviceTelemetryTopic: 'v1/devices/me/telemetry',
    edrxCycle: 0 as null | number,
    mqttEnableCompat: false,
    mqttPayloadType: TransportPayloadType.JSON,
    mqttUseJsonForDownlink: false,
    pagingTransmissionWindow: 0 as null | number,
    powerMode: PowerMode.DRX as null | PowerMode,
    psmActivityTimer: 0 as null | number,
    sendAckOnValidationException: false,
    sparkplug: false,
    sparkplugAttributesMetricNames: [
      'Node Control/*',
      'Device Control/*',
      'Properties/*',
    ] as string[],
    transportType: DeviceTransportType.DEFAULT,
  };
}

const state = reactive(createDefaultValues());
type TransportValues = ReturnType<typeof createDefaultValues>;

/** 保留当前协议未在表单中暴露的高级字段。 */
let preservedConfig: null | Record<string, any> = null;

const protoSchemaRule = z
  .string()
  .refine(
    (value) => value.trim().length > 0,
    $t('device-profile.validation.required'),
  );
const topicRule = z
  .string()
  .trim()
  .min(1, $t('device-profile.validation.topicRequired'))
  .refine(
    (value) =>
      value
        .split('/')
        .every(
          (segment, index, segments) =>
            (!segment.includes('+') || segment === '+') &&
            (!segment.includes('#') ||
              (segment === '#' && index === segments.length - 1)),
        ),
    $t('device-profile.validation.topicInvalid'),
  );

async function handleTransportTypeChange(type: DeviceTransportType) {
  resetToDefault(type);
  const formValues = { ...state };
  await formApi.reset();
  await formApi.setValues(formValues);
}

/** 切换传输类型时重置为该类型默认配置(镜像 createDeviceProfileTransportConfiguration) */
function resetToDefault(type: DeviceTransportType) {
  Object.assign(state, createDefaultValues(), { transportType: type });
  preservedConfig = null;
  switch (type) {
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

function populateTransportConfiguration(config: Record<string, any>) {
  preservedConfig = config;
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
      state.powerMode = client.powerMode ?? PowerMode.DRX;
      state.psmActivityTimer = client.psmActivityTimer ?? 0;
      state.edrxCycle = client.edrxCycle ?? 0;
      state.pagingTransmissionWindow = client.pagingTransmissionWindow ?? 0;
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
  state.deviceTelemetryProtoSchema =
    payload.deviceTelemetryProtoSchema ?? state.deviceTelemetryProtoSchema;
  state.deviceAttributesProtoSchema =
    payload.deviceAttributesProtoSchema ?? state.deviceAttributesProtoSchema;
  state.deviceRpcRequestProtoSchema =
    payload.deviceRpcRequestProtoSchema ?? state.deviceRpcRequestProtoSchema;
  state.deviceRpcResponseProtoSchema =
    payload.deviceRpcResponseProtoSchema ?? state.deviceRpcResponseProtoSchema;
}

function toProtoPayload(payloadType: TransportPayloadType) {
  const originalPayload =
    state.transportType === DeviceTransportType.MQTT
      ? preservedConfig?.transportPayloadTypeConfiguration
      : preservedConfig?.coapDeviceTypeConfiguration
          ?.transportPayloadTypeConfiguration;
  const payload: Record<string, any> = {
    ...originalPayload,
    transportPayloadType: payloadType,
  };
  if (payloadType === TransportPayloadType.PROTOBUF) {
    payload.deviceTelemetryProtoSchema = state.deviceTelemetryProtoSchema;
    payload.deviceAttributesProtoSchema = state.deviceAttributesProtoSchema;
    payload.deviceRpcRequestProtoSchema = state.deviceRpcRequestProtoSchema;
    payload.deviceRpcResponseProtoSchema = state.deviceRpcResponseProtoSchema;
  }
  if (payloadType === TransportPayloadType.JSON) {
    delete payload.deviceTelemetryProtoSchema;
    delete payload.deviceAttributesProtoSchema;
    delete payload.deviceRpcRequestProtoSchema;
    delete payload.deviceRpcResponseProtoSchema;
  }
  return payload;
}

function buildTransportConfiguration(): Record<string, any> {
  switch (state.transportType) {
    case DeviceTransportType.COAP: {
      const coapDeviceTypeConfiguration: Record<string, any> = {
        ...(preservedConfig?.coapDeviceTypeConfiguration?.coapDeviceType ===
        state.coapDeviceType
          ? preservedConfig.coapDeviceTypeConfiguration
          : {}),
        coapDeviceType: state.coapDeviceType,
      };
      if (state.coapDeviceType === CoapTransportDeviceType.DEFAULT) {
        const payload = toProtoPayload(state.coapPayloadType);
        payload.enableCompatibilityWithJsonPayloadFormat = false;
        coapDeviceTypeConfiguration.transportPayloadTypeConfiguration = payload;
      }
      const clientSettings: Record<string, any> = {
        ...preservedConfig?.clientSettings,
        psmActivityTimer: null,
        edrxCycle: null,
        pagingTransmissionWindow: null,
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
        ...preservedConfig,
        clientSettings,
        coapDeviceTypeConfiguration,
        type: DeviceTransportType.COAP,
      };
    }
    case DeviceTransportType.MQTT: {
      const payload = toProtoPayload(state.mqttPayloadType);
      payload.enableCompatibilityWithJsonPayloadFormat =
        state.mqttPayloadType === TransportPayloadType.PROTOBUF &&
        state.mqttEnableCompat;
      payload.useJsonPayloadFormatForDefaultDownlinkTopics =
        payload.enableCompatibilityWithJsonPayloadFormat &&
        state.mqttUseJsonForDownlink;
      return {
        ...preservedConfig,
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

function isMqtt(formValues: Partial<TransportValues>) {
  return formValues.transportType === DeviceTransportType.MQTT;
}

function isStandardMqtt(formValues: Partial<TransportValues>) {
  return isMqtt(formValues) && !formValues.sparkplug;
}

function isCoap(formValues: Partial<TransportValues>) {
  return formValues.transportType === DeviceTransportType.COAP;
}

function usesProtobuf(formValues: Partial<TransportValues>) {
  return (
    (isStandardMqtt(formValues) &&
      formValues.mqttPayloadType === TransportPayloadType.PROTOBUF) ||
    (isCoap(formValues) &&
      formValues.coapDeviceType === CoapTransportDeviceType.DEFAULT &&
      formValues.coapPayloadType === TransportPayloadType.PROTOBUF)
  );
}

function visibleWhen(
  predicate: (formValues: Partial<TransportValues>) => boolean,
) {
  return {
    if: predicate,
    triggerFields: [
      'transportType',
      'sparkplug',
      'mqttPayloadType',
      'coapDeviceType',
      'coapPayloadType',
      'powerMode',
      'mqttEnableCompat',
    ],
  };
}

const schema: VbenFormSchema<TransportValues>[] = [
  {
    component: 'Select',
    componentProps: {
      options: deviceTransportTypeOptions(),
      onChange: handleTransportTypeChange,
    },
    fieldName: 'transportType',
    label: $t('device-profile.fields.transportType'),
  },
  {
    component: 'TbSwitch',
    componentProps: {
      title: $t('device-profile.options.transport.sparkplug'),
      description: $t('device-profile.options.transport.sparkplugHint'),
    },
    fieldName: 'sparkplug',
    dependencies: visibleWhen(isMqtt),
  },
  {
    component: 'Select',
    componentProps: {
      mode: 'tags',
      open: false,
      placeholder: $t('device-profile.options.transport.sparkplugMetricNames'),
    },
    fieldName: 'sparkplugAttributesMetricNames',
    label: $t('device-profile.options.transport.sparkplugMetricNames'),
    help: $t('device-profile.options.transport.sparkplugMetricNamesHint'),
    dependencies: visibleWhen(
      (formValues) => isMqtt(formValues) && !!formValues.sparkplug,
    ),
  },
  {
    component: 'VbenInput',
    componentProps: { class: 'font-mono text-sm', spellcheck: false },
    fieldName: 'deviceTelemetryTopic',
    label: $t('device-profile.options.transport.telemetryTopic'),
    dependencies: visibleWhen(isStandardMqtt),
    rules: topicRule,
  },
  {
    component: 'VbenInput',
    componentProps: { class: 'font-mono text-sm', spellcheck: false },
    fieldName: 'deviceAttributesTopic',
    label: $t('device-profile.options.transport.attributesTopic'),
    dependencies: {
      if: isStandardMqtt,
      triggerFields: ['transportType', 'sparkplug', 'deviceTelemetryTopic'],
      rules: (formValues) =>
        topicRule.refine(
          (value) => value !== formValues.deviceTelemetryTopic?.trim(),
          $t('device-profile.validation.topicDuplicate'),
        ),
    },
  },
  {
    component: 'VbenInput',
    componentProps: { class: 'font-mono text-sm', spellcheck: false },
    fieldName: 'deviceAttributesSubscribeTopic',
    label: $t('device-profile.options.transport.attributesSubscribeTopic'),
    dependencies: visibleWhen(isStandardMqtt),
    rules: topicRule,
  },
  {
    component: 'VbenSelect',
    componentProps: { options: transportPayloadTypeOptions() },
    fieldName: 'mqttPayloadType',
    label: $t('device-profile.options.transport.payloadType'),
    dependencies: visibleWhen(isStandardMqtt),
  },
  {
    component: 'VbenSelect',
    componentProps: { options: coapTransportDeviceTypeOptions() },
    fieldName: 'coapDeviceType',
    label: $t('device-profile.options.transport.coapDeviceType'),
    dependencies: visibleWhen(isCoap),
  },
  {
    component: 'VbenSelect',
    componentProps: { options: transportPayloadTypeOptions() },
    fieldName: 'coapPayloadType',
    label: $t('device-profile.options.transport.payloadType'),
    dependencies: visibleWhen(
      (formValues) =>
        isCoap(formValues) &&
        formValues.coapDeviceType === CoapTransportDeviceType.DEFAULT,
    ),
  },
  ...[
    {
      fieldName: 'deviceTelemetryProtoSchema',
      label: $t('device-profile.options.transport.telemetryProtoSchema'),
    },
    {
      fieldName: 'deviceAttributesProtoSchema',
      label: $t('device-profile.options.transport.attributesProtoSchema'),
    },
    {
      fieldName: 'deviceRpcRequestProtoSchema',
      label: $t('device-profile.options.transport.rpcRequestProtoSchema'),
    },
    {
      fieldName: 'deviceRpcResponseProtoSchema',
      label: $t('device-profile.options.transport.rpcResponseProtoSchema'),
    },
  ].map((field): VbenFormSchema<TransportValues> => ({
    ...field,
    component: 'CodeEditor',
    componentProps: {
      ariaLabel: field.label,
      height: 220,
      language: 'protobuf',
      minHeight: 160,
    },
    dependencies: visibleWhen(usesProtobuf),
    rules: protoSchemaRule,
  })),
  {
    component: 'TbSwitch',
    componentProps: {
      title: $t('device-profile.options.transport.enableJsonCompat'),
    },
    fieldName: 'mqttEnableCompat',
    dependencies: visibleWhen(
      (formValues) => isStandardMqtt(formValues) && usesProtobuf(formValues),
    ),
  },
  {
    component: 'TbSwitch',
    componentProps: {
      title: $t('device-profile.options.transport.useJsonForDownlink'),
    },
    fieldName: 'mqttUseJsonForDownlink',
    dependencies: visibleWhen(
      (formValues) =>
        isStandardMqtt(formValues) &&
        usesProtobuf(formValues) &&
        !!formValues.mqttEnableCompat,
    ),
  },
  {
    component: 'TbSwitch',
    componentProps: {
      title: $t(
        'device-profile.options.transport.sendAckOnValidationException',
      ),
    },
    fieldName: 'sendAckOnValidationException',
    dependencies: visibleWhen(isStandardMqtt),
  },
  {
    component: 'VbenSelect',
    componentProps: { options: powerModeOptions() },
    fieldName: 'powerMode',
    label: $t('device-profile.options.transport.powerMode'),
    dependencies: visibleWhen(isCoap),
    rules: 'required',
  },
  ...[
    {
      fieldName: 'psmActivityTimer',
      label: $t('device-profile.options.transport.psmActivityTimer'),
      mode: PowerMode.PSM,
    },
    {
      fieldName: 'edrxCycle',
      label: $t('device-profile.options.transport.edrxCycle'),
      mode: PowerMode.E_DRX,
    },
    {
      fieldName: 'pagingTransmissionWindow',
      label: $t('device-profile.options.transport.pagingTransmissionWindow'),
      mode: PowerMode.E_DRX,
    },
  ].map(({ mode, ...field }): VbenFormSchema<TransportValues> => ({
    ...field,
    component: 'InputNumber',
    componentProps: { min: 0, step: 1 },
    dependencies: visibleWhen(
      (formValues) => isCoap(formValues) && formValues.powerMode === mode,
    ),
    rules: z
      .number({
        error: $t('device-profile.validation.nonnegativeInteger'),
      })
      .int($t('device-profile.validation.nonnegativeInteger'))
      .min(0, $t('device-profile.validation.nonnegativeInteger')),
  })),
];

const [Form, formApi] = useVbenForm<TransportValues>({
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
  handleValuesChange: (formValues) => {
    Object.assign(state, formValues);
  },
  schema: schema.map((field) => ({
    ...field,
    defaultValue: state[field.fieldName as keyof TransportValues],
  })),
});

watch(
  () => props.disabled,
  (disabled) => formApi.setState({ commonConfig: { disabled } }),
);
watch(
  () => props.profile,
  async (profile) => {
    await formApi.reset();
    resetToDefault(
      (profile?.transportType as DeviceTransportType) ??
        DeviceTransportType.DEFAULT,
    );
    const configuration = profile?.profileData?.transportConfiguration;
    if (configuration) populateTransportConfiguration(configuration);
    await formApi.setValues({ ...state });
  },
  { immediate: true },
);

defineExpose({
  async getValues() {
    Object.assign(state, await formApi.getValues());
    return {
      transportType: state.transportType,
      transportConfiguration: buildTransportConfiguration(),
    };
  },
  async validate() {
    const { valid } = await formApi.validate();
    return valid;
  },
});
</script>

<template>
  <Form class="form-message-flow" />
  <p
    v-if="state.transportType === DeviceTransportType.DEFAULT"
    class="bg-muted/40 text-muted-foreground mb-5 rounded-lg border p-4 text-sm"
  >
    {{ $t('device-profile.messages.transportInfo.default') }}
  </p>
  <p
    v-else-if="
      state.transportType === DeviceTransportType.LWM2M ||
      state.transportType === DeviceTransportType.SNMP
    "
    class="bg-muted/40 text-muted-foreground mb-5 rounded-lg border p-4 text-sm"
  >
    {{ $t('device-profile.messages.transportInfo.unsupported') }}
  </p>
</template>
