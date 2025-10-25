<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- 基本配置 -->
    <div class="mb-2">
      <div class="flex items-center mb-4">
        <div class="w-1 h-4 bg-blue-500 mr-2"></div>
        <span class="text-sm font-medium">{{ t('tb.gateway.details.general.basicConfig') }}</span>
      </div>

      <FormItem :label="t('tb.gateway.details.connector.name')" name="name" :rules="nameRules">
        <Input v-model:value="formState.name" placeholder="MQTT Connector" />
      </FormItem>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem :label="t('tb.gateway.details.connector.logLevel')" name="logLevel">
          <Select
            v-model:value="formState.logLevel"
            :options="LOGGING_LEVEL_OPTIONS"
            :placeholder="t('tb.gateway.details.connector.logLevelPlaceholder')"
          />
        </FormItem>
        <FormItem :label="t('tb.gateway.details.connector.enableRemoteLogging')" name="enableRemoteLogging">
          <div class="flex items-center gap-2">
            <Switch v-model:checked="formState.enableRemoteLogging" />
            <span class="text-sm text-gray-600">{{
              formState.enableRemoteLogging
                ? t('tb.gateway.details.connector.enabled')
                : t('tb.gateway.details.connector.disabled')
            }}</span>
          </div>
        </FormItem>
      </div>
    </div>
    <!-- 上报策略配置 -->
    <div class="mb-2">
      <div class="flex items-center mb-4">
        <div class="w-1 h-4 bg-green-500 mr-2"></div>
        <span class="text-sm font-medium">{{ t('tb.gateway.details.general.reportStrategy') }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4">
        <div class="flex items-center gap-2">
          <Switch v-model:checked="formState.__isReportStrategy" />
          <span class="text-sm font-medium">{{ t('tb.gateway.details.general.enableReportStrategy') }}</span>
        </div>
        <Tooltip :title="t('tb.gateway.details.connector.remoteLoggingTip')">
          <Icon icon="ant-design:info-circle-outlined" class="text-gray-400 cursor-help" />
        </Tooltip>
      </div>
      <div v-if="formState.__isReportStrategy && formState.reportStrategy" class="mt-4">
        <div class="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
          <div class="flex items-start">
            <Icon icon="ant-design:clock-circle-outlined" class="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-green-700">{{ t('tb.gateway.details.general.reportStrategyTip') }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormItem :label="t('tb.gateway.details.connector.reportType')" :name="['reportStrategy', 'type']">
            <Select
              v-model:value="formState.reportStrategy.type"
              :options="REPORT_TYPE_OPTIONS"
              :placeholder="t('tb.gateway.details.connector.reportTypePlaceholder')"
            />
          </FormItem>
          <FormItem
            v-if="
              SHOW_REPORT_PERIOD.includes(
                formState?.reportStrategy?.type as REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD,
              )
            "
            :label="t('tb.gateway.details.connector.reportPeriod')"
            :name="['reportStrategy', 'reportPeriod']"
            :rules="[{ required: true, message: t('tb.gateway.details.connector.reportPeriodRequired') }]"
          >
            <InputNumber
              v-model:value="formState.reportStrategy.reportPeriod"
              :addon-after="t('tb.gateway.details.connector.milliseconds')"
              :min="0"
              placeholder="60000"
              class="w-full"
            />
          </FormItem>
        </div>
      </div>

      <!-- 禁用状态提示 -->
      <div v-else class="mt-4">
        <div class="bg-gray-50 border-l-4 border-gray-400 p-3">
          <div class="flex items-start">
            <Icon icon="ant-design:pause-circle-outlined" class="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-gray-600">{{ t('tb.gateway.details.general.reportStrategyDisabled') }}</div>
          </div>
        </div>
      </div>
    </div>
  </Form>
</template>
<script lang="ts" setup name="General">
  import { ref, watch, PropType } from 'vue';
  import { Switch, Form, Input, FormItem, Select, InputNumber, Tooltip } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';
  import dayjs from 'dayjs';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { REPORT_TYPE, REPORT_TYPE_OPTIONS, SHOW_REPORT_PERIOD } from '/@/enums/gateway';

  import { CONNECTOR_MODE, ConnectorBaseInfo, CONNECTORS_TYPE, LOGGING_LEVEL_ENUM } from '../types';
  import { LOGGING_LEVEL_OPTIONS } from '../types';

  const props = defineProps({
    connector: {
      type: Object as PropType<Partial<ConnectorBaseInfo>>,
      default: () => ({}),
    },
    version: {
      type: String,
      default: '',
    },
    connectorNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  });

  const formRef = ref<FormInstance>();
  const { t } = useI18n('');

  const initialState = {
    type: CONNECTORS_TYPE.MQTT,
    name: '',
    logLevel: LOGGING_LEVEL_ENUM.INFO,
    useDefaults: true,
    mode: CONNECTOR_MODE.BASIC,

    configVersion: '',
    configurationJson: {},
    configuration: '',
    ts: 0,
    sendDataOnlyOnChange: false,

    __isReportStrategy: false,
    enableRemoteLogging: false,
    reportStrategy: {
      type: REPORT_TYPE.ON_REPORT_PERIOD,
      reportPeriod: 60000,
    },
  };

  const formState = ref<ConnectorBaseInfo>(cloneDeep(initialState));

  watch(
    () => [props.connector],
    () => {
      formState.value = cloneDeep(initialState);
      if (props.connector) {
        formState.value = {
          ...formState.value,
          ...props.connector,
          __isReportStrategy: !!props.connector.reportStrategy,
        };
      }
    },
    { immediate: true, deep: true },
  );

  const nameRules = [
    { required: true, message: t('tb.gateway.details.connector.nameRequired') },
    {
      validator: async (_rule, value: string) => {
        const currentName = String(value || '').trim();
        const originalName = props.connector?.name; // 当前连接器的原始名称

        // 如果输入的名称就是当前连接器的原始名称，则允许通过
        if (originalName && currentName === originalName) {
          return Promise.resolve();
        }

        // 检查是否与其他连接器名称重复
        const exists = props.connectorNames?.some((c) => c === currentName);
        if (exists) return Promise.reject(t('tb.gateway.details.general.nameExists'));
        return Promise.resolve();
      },
      trigger: ['blur', 'change'],
    },
  ] as any;
  async function getConfiguration() {
    const data = await formRef.value?.validate();
    if (!data) {
      throw new Error('Form validation failed');
    }

    const localData = cloneDeep(formState.value);

    if (!localData.enableRemoteLogging) {
      delete localData.enableRemoteLogging;
    }

    if (!formState.value.__isReportStrategy) {
      delete localData.reportStrategy;
    }

    delete localData.__isReportStrategy;
    delete localData.configurationJson;

    localData.configVersion = props.version;
    localData.ts = dayjs().valueOf();
    localData.configuration = `${(localData.name || '').trim()}.json`;

    return cloneDeep(localData);
  }

  defineExpose({ getConfiguration });
</script>
<style></style>
