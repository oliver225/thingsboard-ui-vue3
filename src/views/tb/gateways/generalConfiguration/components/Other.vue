<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- Checking device activity -->
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
      <div class="flex items-center space-x-2">
        <Switch
          v-if="formState.checkingDeviceActivity"
          v-model:checked="formState.checkingDeviceActivity.checkDeviceInactivity"
        />
        <span>{{ t('tb.gateway.otherConfig.checkingDeviceActivity') }}</span>
        <Tooltip :title="t('tb.gateway.otherConfig.checkingDeviceActivityHelp')">
          <a>
            <Icon icon="ant-design:info-circle-outlined" />
          </a>
        </Tooltip>
      </div>
      <div v-if="formState.checkingDeviceActivity?.checkDeviceInactivity" class="mt-2">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.otherConfig.inactivityTimeout')"
              :name="['checkingDeviceActivity', 'inactivityTimeoutSeconds']"
              :rules="[{ required: true, message: t('tb.gateway.otherConfig.inactivityTimeoutRequired') }]"
              :help="t('tb.gateway.otherConfig.inactivityTimeoutHelp')"
            >
              <InputNumber
                v-if="formState.checkingDeviceActivity"
                v-model:value="formState.checkingDeviceActivity.inactivityTimeoutSeconds"
                :min="0"
                :style="{ width: '100%' }"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.otherConfig.inactivityCheckPeriod')"
              :name="['checkingDeviceActivity', 'inactivityCheckPeriodSeconds']"
              :rules="[{ required: true, message: t('tb.gateway.otherConfig.inactivityCheckPeriodRequired') }]"
              :help="t('tb.gateway.otherConfig.inactivityCheckPeriodHelp')"
            >
              <InputNumber
                v-if="formState.checkingDeviceActivity"
                v-model:value="formState.checkingDeviceActivity.inactivityCheckPeriodSeconds"
                :min="0"
                :style="{ width: '100%' }"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>

    <!-- Advanced -->
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
      <p class="text-base font-bold mb-2">{{ t('tb.gateway.otherConfig.advanced') }}</p>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.otherConfig.minPackSendDelay')"
            name="minPackSendDelayMS"
            :rules="[{ required: true, message: t('tb.gateway.otherConfig.minPackSendDelayRequired') }]"
            :help="t('tb.gateway.otherConfig.minPackSendDelayHelp')"
          >
            <InputNumber v-model:value="formState.minPackSendDelayMS" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item :label="t('tb.gateway.otherConfig.qos')" name="qos" :help="t('tb.gateway.otherConfig.qosHelp')">
            <Select v-model:value="formState.qos" :options="qosOptions" />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.otherConfig.checkConnectorsConfiguration')"
            name="checkConnectorsConfigurationInSeconds"
            :rules="[{ required: true, message: t('tb.gateway.otherConfig.checkConnectorsConfigurationRequired') }]"
          >
            <InputNumber
              v-model:value="formState.checkConnectorsConfigurationInSeconds"
              :min="0"
              :style="{ width: '100%' }"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.otherConfig.maxPayloadSize')"
            name="maxPayloadSizeBytes"
            :rules="[{ required: true, message: t('tb.gateway.otherConfig.maxPayloadSizeRequired') }]"
            :help="t('tb.gateway.otherConfig.maxPayloadSizeHelp')"
          >
            <InputNumber v-model:value="formState.maxPayloadSizeBytes" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.otherConfig.minPackSizeToSend')"
            name="minPackSizeToSend"
            :rules="[{ required: true, message: t('tb.gateway.otherConfig.minPackSizeToSendRequired') }]"
            :help="t('tb.gateway.otherConfig.minPackSizeToSendHelp')"
          >
            <InputNumber v-model:value="formState.minPackSizeToSend" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  </Form>
</template>

<script lang="ts" setup name="Other">
  import { ref, reactive, watch, PropType } from 'vue';
  import { Form, Row, Col, Switch, InputNumber, Select, Tooltip } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';
  import { FormInstance } from 'ant-design-vue/lib/form';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { GeneralConfigurationValue } from '/@/api/tb/gateways/types/configuration';

  import { DEFAULT_OTHER_FORM } from './default';

  type Configuration = Pick<
    GeneralConfigurationValue,
    | 'checkingDeviceActivity'
    | 'minPackSendDelayMS'
    | 'qos'
    | 'checkConnectorsConfigurationInSeconds'
    | 'maxPayloadSizeBytes'
    | 'minPackSizeToSend'
  >;

  const props = defineProps({
    configuration: { type: Object as PropType<Partial<Configuration>>, default: () => ({}) },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();
  const formState = reactive<Partial<Configuration>>({});
  const { t } = useI18n('');

  const qosOptions = [
    { label: '0', value: 0 },
    { label: '1', value: 1 },
  ];

  watch(
    () => props.configuration,
    (newValue) => {
      if (newValue && Object.keys(newValue).length > 0) {
        Object.assign(formState, newValue);
      } else {
        Object.assign(formState, cloneDeep(DEFAULT_OTHER_FORM));
      }
    },
    { immediate: true, deep: true },
  );

  async function getConfiguration() {
    await formRef.value?.validate();

    // 只返回 Other 组件应该管理的字段
    return {
      checkingDeviceActivity: cloneDeep(formState.checkingDeviceActivity),
      minPackSendDelayMS: formState.minPackSendDelayMS,
      qos: formState.qos,
      checkConnectorsConfigurationInSeconds: formState.checkConnectorsConfigurationInSeconds,
      maxPayloadSizeBytes: formState.maxPayloadSizeBytes,
      minPackSizeToSend: formState.minPackSizeToSend,
    };
  }

  defineExpose({ getConfiguration });
</script>
