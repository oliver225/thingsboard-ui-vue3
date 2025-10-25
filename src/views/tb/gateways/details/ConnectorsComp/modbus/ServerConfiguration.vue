<template>
  <div class="server-configuration">
    <!-- 功能开关 -->
    <div class="config-card">
      <div class="card-header">
        <div class="header-title">
          <Icon icon="ant-design:setting-outlined" class="header-icon" />
          <span>{{ t('tb.gateway.details.modbus.serverConfiguration.title') }}</span>
        </div>
        <div class="header-controls">
          <Button type="primary" size="small" @click="handleOpenValuesDrawer" :disabled="!enableConfig">
            {{ t('tb.gateway.details.modbus.serverConfiguration.values') }}
          </Button>
          <Switch v-model:checked="enableConfig" />
        </div>
      </div>
    </div>

    <!-- 服务器配置 -->
    <div class="config-card" :class="{ disabled: !enableConfig }">
      <div class="card-content">
        <Form ref="formRef" :model="formState" layout="vertical">
          <div class="space-y-4">
            <!-- 连接类型选择 -->
            <div class="flex items-center mb-4">
              <span class="text-base font-medium mr-4">
                {{ t('tb.gateway.details.modbus.serverConfiguration.serverConnection') }}
              </span>
              <Segmented v-model:value="formState.type" :options="MODBUS_TYPE_OPTIONS" :disabled="!enableConfig" />
            </div>

            <!-- 基本连接信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.host')"
                name="host"
                :rules="[{ required: true, message: t('tb.gateway.details.modbus.serverConfiguration.hostRequired') }]"
                v-if="formState.type !== MODBUS_TYPE.SERIAL"
              >
                <Input v-model:value="formState.host" placeholder="127.0.0.1" :disabled="!enableConfig" />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.port')"
                name="port"
                :rules="[{ required: true, message: t('tb.gateway.details.modbus.serverConfiguration.portRequired') }]"
              >
                <Input
                  v-if="formState.type === MODBUS_TYPE.SERIAL"
                  v-model:value="formState.port"
                  placeholder="Set"
                  :disabled="!enableConfig"
                />
                <InputNumber
                  v-else
                  v-model:value="formState.port"
                  :min="1"
                  :max="65535"
                  placeholder="5026"
                  class="!w-full"
                  :disabled="!enableConfig"
                />
              </FormItem>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.method')" name="method">
                <Select
                  v-model:value="formState.method"
                  :options="currentMethodOptions"
                  :placeholder="t('tb.gateway.details.modbus.serverConfiguration.selectMethod')"
                  :disabled="!enableConfig"
                />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.unitId')"
                name="unitId"
                :rules="[
                  { required: true, message: t('tb.gateway.details.modbus.serverConfiguration.unitIdRequired') },
                ]"
              >
                <InputNumber
                  v-model:value="formState.unitId"
                  :min="0"
                  :max="255"
                  placeholder="0"
                  class="!w-full"
                  :disabled="!enableConfig"
                />
              </FormItem>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.deviceName')"
                name="deviceName"
                :rules="[
                  { required: true, message: t('tb.gateway.details.modbus.serverConfiguration.deviceNameRequired') },
                ]"
              >
                <Input
                  v-model:value="formState.deviceName"
                  placeholder="Modbus Slave Example"
                  :disabled="!enableConfig"
                />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.deviceProfile')" name="deviceType">
                <Input v-model:value="formState.deviceType" placeholder="default" :disabled="!enableConfig" />
              </FormItem>
            </div>

            <!-- Poll period 和 Send data to platform -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.pollPeriod')" name="pollPeriod">
                <InputNumber
                  v-model:value="formState.pollPeriod"
                  :min="100"
                  placeholder="5000"
                  class="!w-full"
                  :disabled="!enableConfig"
                />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.baudrate')"
                name="baudrate"
                v-if="formState.type === MODBUS_TYPE.SERIAL"
              >
                <Select
                  v-model:value="formState.baudrate"
                  :options="SERIAL_BAUDRATE_OPTIONS"
                  :placeholder="t('tb.gateway.details.modbus.serverConfiguration.selectBaudrate')"
                  :disabled="!enableConfig"
                />
              </FormItem>
            </div>

            <div class="flex items-center gap-2 mt-4">
              <Switch v-model:checked="formState.sendDataToThingsBoard" :disabled="!enableConfig" />
              <span class="text-sm font-medium">{{
                t('tb.gateway.details.modbus.serverConfiguration.sendDataToPlatform')
              }}</span>
            </div>
          </div>
        </Form>
      </div>
    </div>

    <!-- 高级设置 -->
    <div class="config-card" :class="{ disabled: !enableConfig }">
      <div class="card-header expandable" @click="advancedConfigCollapsed = !advancedConfigCollapsed">
        <div class="header-title">
          <Icon icon="ant-design:control-outlined" class="header-icon" />
          <span>{{ t('tb.gateway.details.modbus.serverConfiguration.advancedSettings') }}</span>
        </div>
        <Icon
          :icon="advancedConfigCollapsed ? 'ant-design:down-outlined' : 'ant-design:up-outlined'"
          class="expand-icon"
        />
      </div>

      <div v-show="!advancedConfigCollapsed" class="card-content">
        <Form :model="formState" layout="vertical">
          <!-- TCP/UDP 模式下的高级设置 -->
          <div v-if="formState.type !== MODBUS_TYPE.SERIAL">
            <!-- Byte Order 和 Word Order -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.byteOrder')" name="byteOrder">
                <Select v-model:value="formState.byteOrder" :options="ORDER_OPTIONS" :disabled="!enableConfig" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.wordOrder')" name="wordOrder">
                <Select v-model:value="formState.wordOrder" :options="ORDER_OPTIONS" :disabled="!enableConfig" />
              </FormItem>
            </div>

            <!-- TLS Connection 开关 -->
            <div class="flex items-center gap-2 mb-4">
              <Switch v-model:checked="enableTls" :disabled="!enableConfig" />
              <span class="text-sm font-medium">{{
                t('tb.gateway.details.modbus.serverConfiguration.tlsConnection')
              }}</span>
            </div>

            <!-- TLS Connection 配置 -->
            <div v-if="enableTls" class="bg-gray-50 p-4 rounded-lg mb-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                  :label="t('tb.gateway.details.modbus.serverConfiguration.certificateFile')"
                  name="security.certfile"
                >
                  <Input
                    v-model:value="formState.security!.certfile"
                    placeholder="Path to certificate file"
                    :disabled="!enableConfig"
                  />
                </FormItem>
                <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.keyFile')" name="security.keyfile">
                  <Input
                    v-model:value="formState.security!.keyfile"
                    placeholder="Path to key file"
                    :disabled="!enableConfig"
                  />
                </FormItem>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.password')" name="security.password">
                  <Input.Password
                    v-model:value="formState.security!.password"
                    placeholder="Password"
                    :disabled="!enableConfig"
                  />
                </FormItem>
                <FormItem
                  :label="t('tb.gateway.details.modbus.serverConfiguration.serverHostname')"
                  name="security.server_hostname"
                >
                  <Input
                    v-model:value="formState.security!.server_hostname"
                    placeholder="Server hostname"
                    :disabled="!enableConfig"
                  />
                </FormItem>
              </div>
            </div>

            <!-- 设备信息字段 -->
            <div class="space-y-4">
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.vendorName')"
                name="identity.vendorName"
              >
                <Input v-model:value="formState.identity.vendorName" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.productCode')"
                name="identity.productCode"
              >
                <Input v-model:value="formState.identity.productCode" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.vendorUrl')" name="identity.vendorUrl">
                <Input v-model:value="formState.identity.vendorUrl" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.productName')"
                name="identity.productName"
              >
                <Input v-model:value="formState.identity.productName" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.modelName')" name="identity.modelName">
                <Input v-model:value="formState.identity.modelName" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
            </div>
          </div>

          <!-- Serial 模式下的高级设置 -->
          <div v-else>
            <!-- Byte Order 和 Word Order -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.byteOrder')" name="byteOrder">
                <Select v-model:value="formState.byteOrder" :options="ORDER_OPTIONS" :disabled="!enableConfig" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.wordOrder')" name="wordOrder">
                <Select v-model:value="formState.wordOrder" :options="ORDER_OPTIONS" :disabled="!enableConfig" />
              </FormItem>
            </div>

            <!-- 设备信息字段 -->
            <div class="space-y-4">
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.vendorName')"
                name="identity.vendorName"
              >
                <Input v-model:value="formState.identity.vendorName" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.productCode')"
                name="identity.productCode"
              >
                <Input v-model:value="formState.identity.productCode" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.vendorUrl')" name="identity.vendorUrl">
                <Input v-model:value="formState.identity.vendorUrl" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.productName')"
                name="identity.productName"
              >
                <Input v-model:value="formState.identity.productName" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.modelName')" name="identity.modelName">
                <Input v-model:value="formState.identity.modelName" placeholder="Set" :disabled="!enableConfig" />
              </FormItem>
            </div>
          </div>
        </Form>
      </div>
    </div>

    <!-- Values 配置弹窗 -->
    <ServerConfigurationDrawer @register="registerValuesDrawer" @save="handleValuesSave" />
  </div>
</template>

<script lang="ts" setup name="ServerConfiguration">
  import { ref, watch, PropType, computed } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Switch, Segmented, Button } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';
  import { useDrawer } from '/@/components/Drawer';
  import { useI18n } from '/@/hooks/web/useI18n';
  import ServerConfigurationDrawer from './ServerConfigurationDrawer.vue';

  import {
    ModbusServer,
    MODBUS_TYPE,
    MODBUS_TYPE_OPTIONS,
    MODBUS_METHOD,
    MODBUS_METHOD_OPTIONS,
    MODBUS_METHOD_SERIAL_OPTIONS,
    BYTE_ORDER,
    ORDER_OPTIONS,
    WORD_ORDER,
    SERIAL_BAUDRATE,
    SERIAL_BAUDRATE_OPTIONS,
  } from './type';

  const props = defineProps({
    config: {
      type: Object as PropType<Partial<ModbusServer>>,
      default: () => ({}),
    },
  });

  const formRef = ref<FormInstance>();
  const enableConfig = ref(true);
  const advancedConfigCollapsed = ref(true);
  const enableTls = ref(false);
  const { t } = useI18n();

  // Values drawer
  const [registerValuesDrawer, { openDrawer: openValuesDrawer }] = useDrawer();

  // 根据连接类型动态选择 Method 选项
  const currentMethodOptions = computed(() => {
    return formState.value.type === MODBUS_TYPE.SERIAL ? MODBUS_METHOD_SERIAL_OPTIONS : MODBUS_METHOD_OPTIONS;
  });

  const initialState: ModbusServer = {
    type: MODBUS_TYPE.TCP,
    host: '127.0.0.1',
    port: 5026,
    method: MODBUS_METHOD.SOCKET,
    deviceName: 'Modbus Slave Example',
    deviceType: 'default',
    pollPeriod: 5000,
    sendDataToThingsBoard: false,
    byteOrder: BYTE_ORDER.LITTLE,
    wordOrder: WORD_ORDER.LITTLE,
    unitId: 0,
    timeout: 35,
    connectAttemptTimeMs: 5000,
    connectAttemptCount: 5,
    waitAfterFailedAttemptsMs: 300000,
    retries: true,
    retryOnEmpty: true,
    retryOnInvalid: true,
    // 串口默认值
    baudrate: SERIAL_BAUDRATE.BAUD_4800,

    identity: {
      // 设备信息字段
      vendorName: '',
      productCode: '',
      vendorUrl: '',
      productName: '',
      modelName: '',
    },

    values: {
      holding_registers: {
        attributes: [],
        timeseries: [],
        attributeUpdates: [],
        rpc: [],
      },
      coils_initializer: {
        attributes: [],
        timeseries: [],
        attributeUpdates: [],
        rpc: [],
      },
      input_registers: {
        attributes: [],
        timeseries: [],
        attributeUpdates: [],
        rpc: [],
      },
      discrete_inputs: {
        attributes: [],
        timeseries: [],
        attributeUpdates: [],
        rpc: [],
      },
    },
  };

  const formState = ref<ModbusServer>(cloneDeep(initialState));

  // 使用一个标记来防止在初始化期间重置折叠状态
  const isInitializing = ref(true);

  watch(
    () => [props.config],
    () => {
      formState.value = cloneDeep(initialState);

      // 只在首次初始化时重置折叠状态
      if (isInitializing.value) {
        advancedConfigCollapsed.value = true;
        isInitializing.value = false;
      }

      enableTls.value = false;
      if (props.config && Object.keys(props.config).length > 0) {
        formState.value = {
          ...formState.value,
          ...props.config,
        };
        enableTls.value = !!props.config.security;
      }
    },
    { immediate: true, deep: true },
  );

  // 监听连接类型变化，自动调整相关字段
  watch(
    () => formState.value.type,
    (newType) => {
      if (newType === MODBUS_TYPE.SERIAL) {
        formState.value.method = MODBUS_METHOD.ASCII;
        formState.value.port = '';
        // Serial 类型不支持 TLS，重置 TLS 状态
        enableTls.value = false;
        delete (formState.value as any).security;
      } else {
        formState.value.method = MODBUS_METHOD.SOCKET;
        formState.value.port = 5026;
      }
    },
  );

  // 监听 TLS 开关状态，初始化 security 对象
  watch(enableTls, (newValue) => {
    if (newValue) {
      if (!formState.value.security) {
        formState.value.security = {
          certfile: '',
          keyfile: '',
          password: '',
          server_hostname: '',
        };
      }
    }
  });

  async function getConfiguration() {
    try {
      await formRef.value?.validate();

      const result = cloneDeep(formState.value);

      // 处理 TLS security 配置
      if (enableTls.value && formState.value.security) {
        result.security = cloneDeep(formState.value.security);
      } else {
        delete (result as any).security;
      }

      return {
        configurationJson: {
          slave: result,
        },
      };
    } catch (error) {
      throw new Error(t('tb.gateway.details.modbus.serverConfiguration.validationFailed'));
    }
  }

  function resetToInitial() {
    formState.value = cloneDeep(initialState);
    advancedConfigCollapsed.value = true;
    isInitializing.value = true; // 重置初始化标记，允许下次重置折叠状态
    enableTls.value = false;
    if (props.config && Object.keys(props.config).length > 0) {
      formState.value = {
        ...formState.value,
        ...props.config,
      };
      enableTls.value = !!props.config.security;
    }
  }

  function handleValuesSave(values: any) {
    formState.value.values = cloneDeep(values);
  }

  function handleOpenValuesDrawer() {
    openValuesDrawer(true, {
      values: cloneDeep(formState.value.values),
    });
  }

  defineExpose({ getConfiguration, resetToInitial });
</script>

<style scoped>
  .server-configuration {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;
  }

  /* 配置卡片 */
  .config-card {
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .config-card.disabled {
    opacity: 0.6;
    background: #fafafa;
  }

  .config-card:hover {
    border-color: #d9d9d9;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  /* 卡片头部 */
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
  }

  .card-header.expandable {
    cursor: pointer;
    user-select: none;
  }

  .card-header.expandable:hover {
    background: #f5f5f5;
  }

  .header-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 14px;
    color: #262626;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    margin-right: 8px;
    font-size: 16px;
    color: #1890ff;
  }

  .expand-icon {
    font-size: 12px;
    color: #8c8c8c;
    transition: transform 0.3s ease;
  }

  /* 卡片内容 */
  .card-content {
    padding: 20px;
  }

  .description {
    margin: 0;
    color: #8c8c8c;
    font-size: 13px;
    line-height: 1.4;
  }

  /* 表单区域 */
  .form-section {
    margin-bottom: 24px;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 13px;
    font-weight: 500;
    color: #595959;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f0f0f0;
  }

  /* 表单网格 */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  /* 连接类型选择器 */
  .connection-type-selector {
    width: 100%;
    max-width: 300px;
  }

  /* 开关组件 */
  .switch-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .switch-item:last-child {
    margin-bottom: 0;
  }

  .switch-label {
    font-size: 13px;
    color: #595959;
    user-select: none;
  }

  .switch-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .server-configuration {
      padding: 0 12px;
    }

    .card-content {
      padding: 16px;
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .connection-type-selector {
      max-width: 100%;
    }
  }

  /* 表单项样式优化 */
  :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  :deep(.ant-form-item-label) {
    padding-bottom: 4px;
  }

  :deep(.ant-form-item-label > label) {
    color: #595959;
    font-size: 13px;
    font-weight: 500;
  }

  :deep(.ant-input),
  :deep(.ant-input-number),
  :deep(.ant-select-selector) {
    border-radius: 6px;
    border-color: #d9d9d9;
    transition: all 0.3s ease;
  }

  :deep(.ant-input:hover),
  :deep(.ant-input-number:hover),
  :deep(.ant-select:hover .ant-select-selector) {
    border-color: #40a9ff;
  }

  :deep(.ant-input:focus),
  :deep(.ant-input-number:focus),
  :deep(.ant-select-focused .ant-select-selector) {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  /* Segmented 组件样式 */
  :deep(.ant-segmented) {
    background: #f5f5f5;
    border-radius: 6px;
    padding: 2px;
  }

  :deep(.ant-segmented-item) {
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
  }

  :deep(.ant-segmented-item-selected) {
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
</style>
