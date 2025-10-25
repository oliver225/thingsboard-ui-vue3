<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    width="90%"
    :showFooter="true"
    @ok="handleSubmit"
    :maskClosable="false"
    :contentWrapperStyle="{ margin: '0' }"
  >
    <template #title>
      <div class="flex items-center space-x-4">
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{
              mode === 'add'
                ? t('tb.gateway.details.modbus.deviceDrawer.addDevice')
                : t('tb.gateway.details.modbus.deviceDrawer.editDevice')
            }}
          </span>
          <span class="text-sm">{{ t('tb.gateway.details.modbus.deviceDrawer.deviceConfiguration') }}</span>
        </div>
      </div>
    </template>

    <Form ref="formRef" :model="formState" layout="vertical" class="mt-4">
      <Tabs v-model:activeKey="activeTab" type="card">
        <!-- 服务器连接配置 -->
        <TabPane key="connection" :tab="t('tb.gateway.details.modbus.deviceDrawer.serverConnection')">
          <div>
            <!-- 连接类型选择 -->
            <div>
              <div class="flex items-center mb-4">
                <span class="text-base font-medium mr-4">
                  {{ t('tb.gateway.details.modbus.deviceDrawer.serverConnection') }}
                </span>
                <Segmented v-model:value="formState.type" :options="MODBUS_TYPE_OPTIONS" />
              </div>
            </div>

            <!-- 基本连接信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.host')"
                name="host"
                :rules="[{ required: true, message: t('tb.gateway.details.modbus.serverConfiguration.hostRequired') }]"
                v-if="formState.type !== MODBUS_TYPE.SERIAL"
              >
                <Input v-model:value="formState.host" placeholder="127.0.0.1" />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.port')"
                name="port"
                :rules="[{ required: true, message: t('tb.gateway.details.modbus.serverConfiguration.portRequired') }]"
              >
                <InputNumber v-model:value="formState.port" :min="1" :max="65535" placeholder="5021" class="!w-full" />
              </FormItem>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.method')" name="method">
                <Select
                  v-model:value="formState.method"
                  :options="currentMethodOptions"
                  :placeholder="t('tb.gateway.details.modbus.serverConfiguration.selectMethod')"
                />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.modbus.serverConfiguration.unitId')"
                name="unitId"
                :rules="[
                  { required: true, message: t('tb.gateway.details.modbus.serverConfiguration.unitIdRequired') },
                ]"
              >
                <InputNumber v-model:value="formState.unitId" :min="0" :max="255" placeholder="1" class="!w-full" />
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
                <Input v-model:value="formState.deviceName" placeholder="Temp Sensor" />
              </FormItem>
              <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.deviceProfile')" name="deviceType">
                <Input v-model:value="formState.deviceType" placeholder="default" />
              </FormItem>
            </div>

            <!-- 串口配置 (仅当 type 为 serial 时显示) -->
            <div v-if="formState.type === 'serial'" class="bg-blue-50 p-4 rounded-lg mb-4">
              <div class="flex items-center gap-4 mb-4">
                <div class="flex items-center gap-2">
                  <Switch v-model:checked="formState.strict" size="small" />
                  <span class="text-sm font-medium">{{ t('tb.gateway.details.modbus.deviceDrawer.strict') }}</span>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.baudrate')" name="baudrate">
                  <Select
                    v-model:value="formState.baudrate"
                    :options="SERIAL_BAUDRATE_OPTIONS"
                    :placeholder="t('tb.gateway.details.modbus.serverConfiguration.selectBaudrate')"
                  />
                </FormItem>
                <FormItem :label="t('tb.gateway.details.modbus.deviceDrawer.bytesize')" name="bytesize">
                  <Select
                    v-model:value="formState.bytesize"
                    :options="SERIAL_BYTESIZE_OPTIONS"
                    :placeholder="t('tb.gateway.details.modbus.deviceDrawer.selectBytesize')"
                  />
                </FormItem>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem :label="t('tb.gateway.details.modbus.deviceDrawer.stopbits')" name="stopbits">
                  <InputNumber v-model:value="formState.stopbits" :min="1" placeholder="1" class="!w-full" />
                </FormItem>
                <FormItem :label="t('tb.gateway.details.modbus.deviceDrawer.parity')" name="parity">
                  <Select
                    v-model:value="formState.parity"
                    :options="SERIAL_PARITY_OPTIONS"
                    :placeholder="t('tb.gateway.details.modbus.deviceDrawer.selectParity')"
                  />
                </FormItem>
              </div>
            </div>

            <!-- 上报策略 -->
            <div class="bg-orange-50 p-4 rounded-lg mb-4">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <Switch v-model:checked="enableReportStrategy" size="small" />
                  <Icon icon="ant-design:clock-circle-outlined" class="text-orange-500" />
                  <span class="text-sm font-medium">{{
                    t('tb.gateway.details.modbus.deviceDrawer.reportStrategy')
                  }}</span>
                </div>
              </div>

              <div v-if="enableReportStrategy">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FormItem
                    :label="t('tb.gateway.details.modbus.deviceDrawer.reportType')"
                    :name="['reportStrategy', 'type']"
                  >
                    <Select
                      v-model:value="formState.reportStrategy.type"
                      :options="REPORT_TYPE_OPTIONS"
                      :placeholder="t('tb.gateway.details.modbus.deviceDrawer.selectReportType')"
                    />
                  </FormItem>
                  <FormItem
                    v-if="
                      SHOW_REPORT_PERIOD.includes(
                        formState?.reportStrategy?.type as REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD,
                      )
                    "
                    :label="t('tb.gateway.details.modbus.deviceDrawer.reportPeriod')"
                    :name="['reportStrategy', 'reportPeriod']"
                    :rules="[
                      { required: true, message: t('tb.gateway.details.modbus.deviceDrawer.reportPeriodRequired') },
                    ]"
                  >
                    <InputNumber
                      v-model:value="formState.reportStrategy.reportPeriod"
                      :addon-after="t('tb.gateway.details.modbus.deviceDrawer.milliseconds')"
                      :min="1000"
                      placeholder="30000"
                      class="w-full"
                    />
                  </FormItem>
                </div>
              </div>
            </div>

            <!-- 高级配置 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <div
                class="flex items-center justify-between cursor-pointer"
                @click="advancedConfigCollapsed = !advancedConfigCollapsed"
              >
                <div class="flex items-center">
                  <Icon icon="ant-design:setting-outlined" class="text-gray-500 mr-2" />
                  <span class="text-sm font-medium">{{
                    t('tb.gateway.details.modbus.deviceDrawer.advancedSettings')
                  }}</span>
                </div>
                <Icon
                  :icon="advancedConfigCollapsed ? 'ant-design:down-outlined' : 'ant-design:up-outlined'"
                  class="text-gray-500 transition-transform duration-200"
                />
              </div>

              <div v-show="!advancedConfigCollapsed" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.byteOrder')" name="byteOrder">
                    <Select v-model:value="formState.byteOrder" :options="ORDER_OPTIONS" />
                  </FormItem>
                  <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.wordOrder')" name="wordOrder">
                    <Select v-model:value="formState.wordOrder" :options="ORDER_OPTIONS" />
                  </FormItem>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem :label="t('tb.gateway.details.modbus.deviceDrawer.connectionTimeout')" name="timeout">
                    <InputNumber v-model:value="formState.timeout" :min="1" placeholder="35" class="!w-full" />
                  </FormItem>
                  <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.pollPeriod')" name="pollPeriod">
                    <InputNumber v-model:value="formState.pollPeriod" :min="100" placeholder="5000" class="!w-full" />
                  </FormItem>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem
                    :label="t('tb.gateway.details.modbus.deviceDrawer.connectAttemptTime')"
                    name="connectAttemptTimeMs"
                  >
                    <InputNumber
                      v-model:value="formState.connectAttemptTimeMs"
                      :min="1000"
                      placeholder="5000"
                      class="!w-full"
                    />
                  </FormItem>
                  <FormItem
                    :label="t('tb.gateway.details.modbus.deviceDrawer.connectAttemptCount')"
                    name="connectAttemptCount"
                  >
                    <InputNumber
                      v-model:value="formState.connectAttemptCount"
                      :min="1"
                      placeholder="5"
                      class="!w-full"
                    />
                  </FormItem>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <FormItem
                    :label="t('tb.gateway.details.modbus.deviceDrawer.waitAfterFailedAttempts')"
                    name="waitAfterFailedAttemptsMs"
                  >
                    <InputNumber
                      v-model:value="formState.waitAfterFailedAttemptsMs"
                      :min="1000"
                      placeholder="300000"
                      class="!w-full"
                    />
                  </FormItem>
                </div>

                <div class="flex flex-wrap items-center gap-6">
                  <div v-if="formState.type !== MODBUS_TYPE.SERIAL" class="flex items-center gap-4">
                    <div class="flex items-center gap-4">
                      <Switch v-model:checked="enableTls" size="small" />
                      <span class="text-sm font-medium">{{
                        t('tb.gateway.details.modbus.serverConfiguration.tlsConnection')
                      }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <Switch v-model:checked="formState.retries" size="small" />
                    <span class="text-sm font-medium">{{ t('tb.gateway.details.modbus.deviceDrawer.retries') }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <Switch v-model:checked="formState.retryOnEmpty" size="small" />
                    <span class="text-sm font-medium">{{
                      t('tb.gateway.details.modbus.deviceDrawer.retryOnEmpty')
                    }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <Switch v-model:checked="formState.retryOnInvalid" size="small" />
                    <span class="text-sm font-medium">{{
                      t('tb.gateway.details.modbus.deviceDrawer.retryOnInvalid')
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- TLS Connection -->
            <div
              v-if="formState.type !== MODBUS_TYPE.SERIAL"
              class="bg-gray-50 px-4 rounded-lg"
              v-show="!advancedConfigCollapsed"
            >
              <div v-if="enableTls">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem
                    :label="t('tb.gateway.details.modbus.serverConfiguration.certificateFile')"
                    name="security.certfile"
                  >
                    <Input v-model:value="formState.security!.certfile" placeholder="Path to certificate file" />
                  </FormItem>
                  <FormItem :label="t('tb.gateway.details.modbus.serverConfiguration.keyFile')" name="security.keyfile">
                    <Input v-model:value="formState.security!.keyfile" placeholder="Path to key file" />
                  </FormItem>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem
                    :label="t('tb.gateway.details.modbus.serverConfiguration.password')"
                    name="security.password"
                  >
                    <Input.Password v-model:value="formState.security!.password" placeholder="Password" />
                  </FormItem>
                  <FormItem
                    :label="t('tb.gateway.details.modbus.serverConfiguration.serverHostname')"
                    name="security.server_hostname"
                  >
                    <Input v-model:value="formState.security!.server_hostname" placeholder="Server hostname" />
                  </FormItem>
                </div>
              </div>
            </div>
          </div>
        </TabPane>

        <!-- 数据映射标签页 -->
        <TabPane key="attributes" :tab="t('tb.gateway.details.modbus.deviceDrawer.attributes')">
          <AttributesTable v-model:data="formState.attributes" />
        </TabPane>

        <TabPane key="timeseries" :tab="t('tb.gateway.details.modbus.deviceDrawer.timeSeries')">
          <TimeseriesTable v-model:data="formState.timeseries" />
        </TabPane>

        <TabPane key="attributeUpdates" :tab="t('tb.gateway.details.modbus.deviceDrawer.attributeUpdates')">
          <AttributeUpdatesTable v-model:data="formState.attributeUpdates" />
        </TabPane>

        <TabPane key="rpc" :tab="t('tb.gateway.details.modbus.deviceDrawer.rpcRequests')">
          <RpcTable v-model:data="formState.rpc" />
        </TabPane>
      </Tabs>
    </Form>
  </BasicDrawer>
</template>

<script lang="ts" setup name="SlaveConfigDrawer">
  import { ref, watch, computed, unref } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Segmented, Switch, Tabs, TabPane } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { REPORT_TYPE, REPORT_TYPE_OPTIONS, SHOW_REPORT_PERIOD } from '/@/enums/gateway';

  import AttributesTable from './table/AttributesTable.vue';
  import TimeseriesTable from './table/TimeseriesTable.vue';
  import AttributeUpdatesTable from './table/AttributeUpdatesTable.vue';
  import RpcTable from './table/RpcTable.vue';

  import { MODBUS_TYPE_OPTIONS } from './type';

  import {
    ModbusSlave,
    MODBUS_TYPE,
    MODBUS_METHOD,
    MODBUS_METHOD_OPTIONS,
    MODBUS_METHOD_SERIAL_OPTIONS,
    BYTE_ORDER,
    ORDER_OPTIONS,
    WORD_ORDER,
    SERIAL_BAUDRATE,
    SERIAL_BAUDRATE_OPTIONS,
    SERIAL_BYTESIZE,
    SERIAL_BYTESIZE_OPTIONS,
    SERIAL_PARITY,
    SERIAL_PARITY_OPTIONS,
    ModbusAttribute,
  } from './type';

  const emit = defineEmits(['save', 'register']);
  const { t } = useI18n();

  const mode = ref<'add' | 'edit'>('add');

  const formRef = ref<FormInstance>();
  const activeTab = ref('connection');
  const enableReportStrategy = ref(false);
  // 高级配置折叠状态
  const advancedConfigCollapsed = ref(true);

  // TLS 相关状态
  const enableTls = ref(false);

  // 根据连接类型动态选择 Method 选项
  const currentMethodOptions = computed(() => {
    return formState.value.type === MODBUS_TYPE.SERIAL ? MODBUS_METHOD_SERIAL_OPTIONS : MODBUS_METHOD_OPTIONS;
  });

  const initialState: ModbusSlave = {
    host: '127.0.0.1',
    port: 5021,
    type: MODBUS_TYPE.TCP,
    method: MODBUS_METHOD.SOCKET,
    timeout: 35,
    byteOrder: BYTE_ORDER.LITTLE,
    wordOrder: WORD_ORDER.LITTLE,
    retries: true,
    retryOnEmpty: true,
    retryOnInvalid: true,
    pollPeriod: 5000,
    unitId: 1,
    deviceName: '',
    deviceType: 'default',
    connectAttemptTimeMs: 5000,
    connectAttemptCount: 5,
    waitAfterFailedAttemptsMs: 300000,
    // 串口默认值
    baudrate: SERIAL_BAUDRATE.BAUD_4800,
    bytesize: SERIAL_BYTESIZE.FIVE,
    stopbits: 1,
    parity: SERIAL_PARITY.NONE,
    strict: true,
    reportStrategy: {
      type: REPORT_TYPE.ON_REPORT_PERIOD,
      reportPeriod: 30000,
    },
    attributes: [],
    timeseries: [],
    attributeUpdates: [],
    rpc: [],
  };

  const formState = ref<ModbusSlave>(cloneDeep(initialState));

  const [registerDrawer, { closeDrawer }] = useDrawerInner(async (data) => {
    // 重置表单状态
    formState.value = cloneDeep(initialState);
    enableReportStrategy.value = false;
    enableTls.value = false;
    activeTab.value = 'connection';
    advancedConfigCollapsed.value = true;

    if (data?.slave && Object.keys(data.slave).length > 0) {
      formState.value = {
        ...formState.value,
        ...data.slave,
      };
      enableReportStrategy.value = !!data.slave.reportStrategy;
      enableTls.value = !!data.slave.security;
    }

    if (data?.mode) {
      mode.value = data.mode;
    }
  });

  async function handleSubmit() {
    try {
      await unref(formRef)?.validate();

      const result = cloneDeep(formState.value);
      if (!enableReportStrategy.value) {
        delete (result as any).reportStrategy;
      }

      // 处理 TLS security 配置
      if (enableTls.value && formState.value.security) {
        result.security = cloneDeep(formState.value.security);
      } else {
        delete (result as any).security;
      }

      emit('save', result);
      closeDrawer();
    } catch (error) {
      console.error(t('tb.gateway.details.modbus.deviceDrawer.validationFailed'), error);
    }
  }

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

  // 监听连接类型变化，自动调整方法选项
  watch(
    () => formState.value.type,
    (newType) => {
      if (newType === MODBUS_TYPE.SERIAL) {
        formState.value.method = MODBUS_METHOD.ASCII;
        formState.value.port = '/dev/ttyUSB0';
        // Serial 类型不支持 TLS，重置 TLS 状态
        enableTls.value = false;
        delete (formState.value as any).security;
      } else {
        formState.value.method = MODBUS_METHOD.SOCKET;
        formState.value.port = 5021;
      }
    },
  );
</script>

<style scoped>
  :deep(.scrollbar__view) {
    margin: 0 !important;
  }
</style>
