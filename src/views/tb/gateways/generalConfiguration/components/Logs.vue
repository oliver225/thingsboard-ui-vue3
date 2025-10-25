<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- Global formats -->
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
      <Row :gutter="16">
        <Col :span="24">
          <Form.Item
            :label="t('tb.gateway.logs.global.dateFormat')"
            name="dateFormat"
            :rules="[{ required: true, message: t('tb.gateway.logs.global.dateFormatRequired') }]"
            :help="t('tb.gateway.logs.global.dateFormatHelp')"
          >
            <Input v-model:value="formState.dateFormat" />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16" class="mt-3">
        <Col :span="24">
          <Form.Item
            :label="t('tb.gateway.logs.global.logFormat')"
            name="logFormat"
            :rules="[{ required: true, message: t('tb.gateway.logs.global.logFormatRequired') }]"
            :help="t('tb.gateway.logs.global.logFormatHelp')"
          >
            <Textarea v-model:value="formState.logFormat" :rows="3" />
          </Form.Item>
        </Col>
      </Row>
    </div>

    <!-- Remote logging -->
    <div class="border border-solid border-neutral-300 rounded-md py-1 px-4 mb-4">
      <div class="flex items-center space-x-2 py-2">
        <Switch v-model:checked="remoteState.enable" />
        <span>{{ t('tb.gateway.logs.remote.title') }}</span>
        <Tooltip :title="t('tb.gateway.logs.remote.tip')">
          <a>
            <Icon :icon="'ant-design:info-circle-outlined'" />
          </a>
        </Tooltip>
      </div>
      <div class="mt-2" v-show="remoteState.enable">
        <Row :gutter="16">
          <Col :span="24">
            <Form.Item :label="t('tb.gateway.logs.remote.level')" name="level">
              <Select v-model:value="remoteState.level" :options="LEVEL_OPTIONS" />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>

    <!-- Local logging -->
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
      <p class="text-base font-bold mb-2">{{ t('tb.gateway.logs.local.title') }}</p>
      <Segmented v-model:value="localTab" block :options="LOCAL_TABS" />
      <div class="mt-4">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.logs.local.level')"
              :name="['local', localTab, 'level']"
              :rules="[{ required: true, message: t('tb.gateway.logs.remote.level') + ' ' + t('common.required') }]"
            >
              <Select v-model:value="formState.local[localTab].level" :options="LEVEL_OPTIONS" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.logs.local.filePath')"
              :name="['local', localTab, 'filePath']"
              :rules="[{ required: true, message: t('tb.gateway.logs.local.filePathRequired') }]"
              :help="
                t('tb.gateway.logs.local.fullPath', {
                  path: `${formState.local?.[localTab]?.filePath}/${formState.local?.[localTab]?.fileName}`,
                })
              "
            >
              <Input v-model:value="formState.local[localTab].filePath" />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item
              :label="t('tb.gateway.logs.local.period')"
              :name="['local', localTab, 'periodValue']"
              :rules="[{ required: true, message: t('tb.gateway.logs.local.periodRequired') }]"
            >
              <InputNumber v-model:value="formState.local[localTab].periodValue" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label=" " :name="['local', localTab, 'periodUnit']">
              <Select v-model:value="formState.local[localTab].periodUnit" :options="PERIOD_UNIT_OPTIONS" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item
              :label="t('tb.gateway.logs.local.backupCount')"
              :name="['local', localTab, 'backupCount']"
              :rules="[{ required: true, message: t('tb.gateway.logs.local.backupCountRequired') }]"
              :help="t('tb.gateway.logs.local.backupCountHelp')"
            >
              <InputNumber v-model:value="formState.local[localTab].backupCount" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  </Form>
</template>

<script lang="ts" setup name="Logs">
  import { ref, watch, reactive, PropType, computed } from 'vue';
  import { Form, Input, Textarea, Switch, Select, Row, Col, Segmented, InputNumber, Tooltip } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';
  import { FormInstance } from 'ant-design-vue/lib/form';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { LogsConfigurationValue } from '/@/api/tb/gateways/types/configuration';
  import { DeviceCredentials } from '/@/api/tb/device';

  import { DEFAULT_LOGS_FORM } from './default';
  import { LEVEL_OPTIONS, PERIOD_UNIT_OPTIONS, LOCAL_TABS } from './enums';
  const { t } = useI18n('');

  // 页面表单状态的类型定义
  interface FormState {
    dateFormat: string;
    logFormat: string;
    local: Record<
      string,
      {
        level: string;
        filePath: string; // 仅路径部分
        fileName: string; // 仅文件名部分
        periodValue: number;
        periodUnit: string;
        backupCount: number;
      }
    >;
  }

  const props = defineProps({
    configuration: { type: Object as PropType<Partial<LogsConfigurationValue>>, default: () => ({}) },
    device: { type: Object as PropType<Partial<DeviceCredentials>>, default: () => ({}) },
    remoteLoggingLevel: { type: String, default: 'NONE' },
  });

  const formRef = ref<FormInstance>();

  const localTab = ref<string>('service');

  const formState = reactive<any>({});

  const remoteState = reactive({ enable: false, level: 'INFO' });

  watch(
    () => props.remoteLoggingLevel,
    (level) => {
      remoteState.enable = level !== 'NONE';
      remoteState.level = level !== 'NONE' ? level : 'INFO';
    },
    { immediate: true },
  );

  watch(
    () => props.configuration,
    (newValue) => {
      if (newValue && Object.keys(newValue).length > 0) {
        Object.assign(formState, transformToUI(newValue as LogsConfigurationValue));
      } else {
        Object.assign(formState, transformToUI(cloneDeep(DEFAULT_LOGS_FORM)));
      }
    },
    { immediate: true, deep: true },
  );

  // 将API数据转换为UI表单状态
  function transformToUI(config: LogsConfigurationValue): FormState {
    const localState: FormState['local'] = {};

    for (const tab of LOCAL_TABS) {
      const logger = config.loggers?.[tab.value];
      const handlerName = logger?.handlers?.[0];
      const handler = handlerName ? config.handlers?.[handlerName] : undefined;

      const fullPath = handler?.filename || '';
      const lastSlash = fullPath.lastIndexOf('/');
      const filePath = lastSlash > -1 ? fullPath.substring(0, lastSlash) : fullPath;
      const fileName = lastSlash > -1 ? fullPath.substring(lastSlash + 1) : '';

      localState[tab.value] = {
        level: logger?.level || 'INFO',
        filePath: filePath ?? './logs',
        fileName: fileName ?? tab.value,
        periodValue: handler?.interval || 3,
        periodUnit: handler?.when || 'D',
        backupCount: handler?.backupCount || 7,
      };
    }

    const LogFormatter = config.formatters?.LogFormatter;

    return {
      dateFormat: LogFormatter?.datefmt || '%Y-%m-%d %H:%M:%S',
      logFormat:
        LogFormatter?.format ||
        '%(asctime)s.%(msecs)03d - |%(levelname)s| - [%(filename)s] - %(module)s - %(funcName)s - %(lineno)d - %(message)s',
      local: localState,
    };
  }

  // 将UI表单状态转换为API数据
  function transformToAPI(form: FormState): LogsConfigurationValue {
    const config = cloneDeep(DEFAULT_LOGS_FORM);

    // 更新 formatters
    config.formatters.LogFormatter.datefmt = form.dateFormat;
    config.formatters.LogFormatter.format = form.logFormat;

    // 更新 local loggers and handlers
    for (const tab of LOCAL_TABS) {
      const loggerKey = tab.value;
      const localCfg = form.local[loggerKey];

      if (config.loggers?.[loggerKey]) {
        config.loggers[loggerKey].level = localCfg.level;
      }

      const handlerName = config.loggers?.[loggerKey]?.handlers?.[0];
      if (handlerName && config.handlers?.[handlerName]) {
        const handler = config.handlers[handlerName];
        handler.filename = `${localCfg.filePath}/${localCfg.fileName}`.replace(/\/\/+/g, '/');
        handler.backupCount = localCfg.backupCount;
        handler.interval = localCfg.periodValue;
        handler.when = localCfg.periodUnit;
      }
    }

    return config;
  }

  async function getConfiguration() {
    await formRef.value?.validate();
    let logsConfig = transformToAPI(formState);

    // 使用特殊键将 RemoteLoggingLevel 的更新传递给父组件
    (logsConfig as any).__special_keys__ = {
      RemoteLoggingLevel: remoteState.enable ? remoteState.level : 'NONE',
    };

    return logsConfig;
  }

  defineExpose({ getConfiguration });
</script>
