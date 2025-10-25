<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
      <Row :gutter="16">
        <Form.Item
          :label="t('tb.gateway.grpcConfig.enable')"
          name="enable"
          :help="t('tb.gateway.grpcConfig.enableHelp')"
          style="margin-bottom: 0"
        >
          <Switch v-model:checked="formState.enabled" />
        </Form.Item>
      </Row>

      <Row :gutter="16">
        <Form.Item
          :label="t('tb.gateway.grpcConfig.keepalivePermitWithoutCalls')"
          name="keepalivePermitWithoutCalls"
          style="margin-bottom: 0"
          :help="t('tb.gateway.grpcConfig.keepalivePermitWithoutCallsHelp')"
        >
          <Switch v-model:checked="formState.keepalivePermitWithoutCalls" :disabled="disabled" />
        </Form.Item>
      </Row>

      <Row :gutter="16" class="mt-2">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.grpcConfig.serverPort')"
            name="serverPort"
            :rules="[{ required: formState.enabled, message: t('tb.gateway.grpcConfig.serverPortRequired') }]"
            :help="t('tb.gateway.grpcConfig.serverPortHelp')"
          >
            <InputNumber
              v-model:value="formState.serverPort"
              :min="0"
              :style="{ width: '100%' }"
              :disabled="disabled"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.grpcConfig.keepAliveTimeoutMs')"
            name="keepAliveTimeoutMs"
            :rules="[{ required: formState.enabled, message: t('tb.gateway.grpcConfig.keepAliveTimeoutMsRequired') }]"
            :help="t('tb.gateway.grpcConfig.keepAliveTimeoutMsHelp')"
          >
            <InputNumber
              v-model:value="formState.keepAliveTimeoutMs"
              :min="0"
              :style="{ width: '100%' }"
              :disabled="disabled"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.grpcConfig.keepAliveTimeMs')"
            name="keepAliveTimeMs"
            :rules="[{ required: formState.enabled, message: t('tb.gateway.grpcConfig.keepAliveTimeMsRequired') }]"
            :help="t('tb.gateway.grpcConfig.keepAliveTimeMsHelp')"
          >
            <InputNumber
              v-model:value="formState.keepAliveTimeMs"
              :min="0"
              :style="{ width: '100%' }"
              :disabled="disabled"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.grpcConfig.minTimeBetweenPingsMs')"
            name="minTimeBetweenPingsMs"
            :rules="[
              { required: formState.enabled, message: t('tb.gateway.grpcConfig.minTimeBetweenPingsMsRequired') },
            ]"
            :help="t('tb.gateway.grpcConfig.minTimeBetweenPingsMsHelp')"
          >
            <InputNumber
              v-model:value="formState.minTimeBetweenPingsMs"
              :min="0"
              :style="{ width: '100%' }"
              :disabled="disabled"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.grpcConfig.maxPingsWithoutData')"
            name="maxPingsWithoutData"
            :rules="[{ required: formState.enabled, message: t('tb.gateway.grpcConfig.maxPingsWithoutDataRequired') }]"
            :help="t('tb.gateway.grpcConfig.maxPingsWithoutDataHelp')"
          >
            <InputNumber
              v-model:value="formState.maxPingsWithoutData"
              :min="0"
              :style="{ width: '100%' }"
              :disabled="disabled"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.grpcConfig.minPingIntervalWithoutDataMs')"
            name="minPingIntervalWithoutDataMs"
            :rules="[
              { required: formState.enabled, message: t('tb.gateway.grpcConfig.minPingIntervalWithoutDataMsRequired') },
            ]"
            :help="t('tb.gateway.grpcConfig.minPingIntervalWithoutDataMsHelp')"
          >
            <InputNumber
              v-model:value="formState.minPingIntervalWithoutDataMs"
              :min="0"
              :style="{ width: '100%' }"
              :disabled="disabled"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  </Form>
</template>

<script lang="ts" setup name="GRPC">
  import { ref, reactive, watch, computed, PropType } from 'vue';
  import { Form, Row, Col, Switch, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { GrpcConfigurationValue } from '/@/api/tb/gateways/types/configuration';
  import { DeviceCredentials } from '/@/api/tb/device';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { DEFAULT_GRPC_FORM } from './default';

  const props = defineProps({
    configuration: { type: Object as PropType<Partial<GrpcConfigurationValue>>, default: () => ({}) },
    device: { type: Object as PropType<Partial<DeviceCredentials>>, default: () => ({}) },
  });

  const formRef = ref<FormInstance>();
  const formState = reactive<Partial<GrpcConfigurationValue>>({});
  const { t } = useI18n('');

  const disabled = computed(() => !formState.enabled);

  watch(
    () => props.configuration,
    (newValue) => {
      if (newValue && Object.keys(newValue).length > 0) {
        Object.assign(formState, newValue);
      } else {
        Object.assign(formState, cloneDeep(DEFAULT_GRPC_FORM));
      }
    },
    { immediate: true, deep: true },
  );

  async function getConfiguration() {
    if (formState.enabled) {
      await formRef.value?.validate();
    }

    return cloneDeep(formState);
  }

  defineExpose({ getConfiguration });
</script>
