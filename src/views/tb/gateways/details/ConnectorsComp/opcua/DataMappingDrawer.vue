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
                ? t('tb.gateway.details.opcua.dataMapping.addTitle')
                : t('tb.gateway.details.opcua.dataMapping.editTitle')
            }}
          </span>
          <span class="text-sm text-gray-500">{{ t('tb.gateway.details.opcua.dataMapping.subtitle') }}</span>
        </div>
      </div>
    </template>

    <Form ref="formRef" :model="formState" layout="vertical" class="mt-4">
      <Tabs v-model:activeKey="activeTab" type="card">
        <!-- 设备配置 Tab -->
        <TabPane key="device" :tab="t('tb.gateway.details.opcua.dataMapping.deviceConfigTab')">
          <div class="p-4 text-sm text-gray-600 bg-blue-50 rounded mb-4">
            {{ t('tb.gateway.details.opcua.dataMapping.description') }}
          </div>

          <div>
            <div class="mb-2">
              <label class="text-sm text-gray-700">
                {{ t('tb.gateway.details.opcua.dataMapping.deviceNodeLabel') }}
                <span class="text-red-500">*</span>
              </label>
            </div>
            <!-- Device node -->
            <div class="flex w-full gap-2">
              <FormItem :name="['deviceNodeSource']" class="mb-0" style="width: 140px">
                <Select v-model:value="formState.deviceNodeSource" :options="DEVICE_INFO_SOURCE_OPTIONS" />
              </FormItem>
              <FormItem :name="['deviceNodePattern']" class="!mb-0 flex-1" :rules="[{ required: true, message: '' }]">
                <Input v-model:value="formState.deviceNodePattern" class="flex-1" />
              </FormItem>
            </div>
          </div>

          <!-- 设备信息配置 -->
          <div class="mb-6">
            <div class="flex items-center mb-3">
              <div class="w-1 h-4 bg-blue-500 mr-2"></div>
              <span class="text-sm font-medium">
                {{ t('tb.gateway.details.opcua.dataMapping.deviceInfoSection') }}
              </span>
            </div>

            <!-- 设备名称 -->
            <div class="mb-4">
              <div class="mb-2">
                <label class="text-sm text-gray-700">
                  {{ t('tb.gateway.details.opcua.dataMapping.nameLabel') }}
                  <span class="text-red-500">*</span>
                </label>
              </div>
              <div class="flex w-full gap-2">
                <FormItem :name="['deviceInfo', 'deviceNameExpressionSource']" class="mb-0" style="width: 140px">
                  <Select
                    v-model:value="formState.deviceInfo.deviceNameExpressionSource"
                    :options="DEVICE_INFO_SOURCE_OPTIONS"
                  />
                </FormItem>
                <FormItem
                  :name="['deviceInfo', 'deviceNameExpression']"
                  class="!mb-0 flex-1"
                  :rules="[{ required: true, message: t('tb.gateway.details.opcua.dataMapping.nameRequired') }]"
                >
                  <Input
                    v-model:value="formState.deviceInfo.deviceNameExpression"
                    :placeholder="t('tb.gateway.details.opcua.dataMapping.namePlaceholder')"
                  />
                </FormItem>
              </div>
            </div>

            <!-- 设备配置文件 -->
            <div class="mb-4">
              <div class="mb-2">
                <label class="text-sm text-gray-700">
                  {{ t('tb.gateway.details.opcua.dataMapping.profileLabel') }}
                  <span class="text-red-500">*</span>
                </label>
              </div>
              <div class="flex w-full gap-2">
                <FormItem :name="['deviceInfo', 'deviceProfileExpressionSource']" class="mb-0" style="width: 140px">
                  <Select
                    v-model:value="formState.deviceInfo.deviceProfileExpressionSource"
                    :options="DEVICE_INFO_SOURCE_OPTIONS"
                  />
                </FormItem>
                <FormItem :name="['deviceInfo', 'deviceProfileExpression']" class="!mb-0 flex-1">
                  <Input
                    v-model:value="formState.deviceInfo.deviceProfileExpression"
                    :placeholder="t('tb.gateway.details.opcua.dataMapping.profilePlaceholder')"
                  />
                </FormItem>
              </div>
            </div>
          </div>

          <!-- 上报策略配置 -->
          <div :class="enableReportStrategy ? 'mb-2' : 'mb-6'">
            <div class="flex items-center mb-3">
              <div class="w-1 h-4 bg-orange-500 mr-2"></div>
              <span class="text-sm font-medium">
                {{ t('tb.gateway.details.opcua.dataMapping.reportStrategySection') }}
              </span>
            </div>

            <div class="flex items-center mb-3">
              <Switch v-model:checked="enableReportStrategy" class="ml-3" @change="onReportStrategyToggle" />
              <span class="ml-2 text-xs text-gray-500">
                {{ t('tb.gateway.details.opcua.dataMapping.enableReportStrategy') }}
              </span>
            </div>

            <div v-if="enableReportStrategy" class="grid grid-cols-2 gap-4">
              <FormItem
                :label="t('tb.gateway.details.opcua.dataMapping.reportType')"
                :name="['reportStrategy', 'type']"
                :rules="[{ required: true, message: t('tb.gateway.details.opcua.dataMapping.reportTypeRequired') }]"
              >
                <Select
                  v-model:value="formState.reportStrategy!.type"
                  :options="REPORT_TYPE_OPTIONS"
                  :placeholder="t('tb.gateway.details.opcua.dataMapping.reportType')"
                />
              </FormItem>
              <FormItem
                v-if="SHOW_REPORT_PERIOD.includes(formState?.reportStrategy?.type as any)"
                :label="t('tb.gateway.details.opcua.dataMapping.reportPeriod')"
                :name="['reportStrategy', 'reportPeriod']"
                :rules="[{ required: true, message: t('tb.gateway.details.opcua.dataMapping.reportPeriodRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.reportStrategy!.reportPeriod"
                  :addon-after="t('tb.gateway.details.opcua.dataMapping.milliseconds')"
                  :min="1000"
                  :step="1000"
                  :placeholder="t('tb.gateway.details.opcua.dataMapping.reportPeriodPlaceholder')"
                  class="w-full"
                />
              </FormItem>
            </div>
          </div>
        </TabPane>

        <!-- Attributes Tab -->
        <TabPane key="attributes" :tab="t('tb.gateway.details.opcua.dataMapping.attributesSection')">
          <AttributesTable v-model:data="formState.attributes" />
        </TabPane>

        <!-- Time series Tab -->
        <TabPane key="timeseries" :tab="t('tb.gateway.details.opcua.dataMapping.timeSeriesSection')">
          <TimeseriesTable v-model:data="formState.timeseries" />
        </TabPane>

        <!-- Attribute updates Tab -->
        <TabPane key="attributeUpdates" :tab="t('tb.gateway.details.opcua.dataMapping.attributeUpdatesSection')">
          <AttributeUpdatesTable v-model:data="formState.attributes_updates" />
        </TabPane>

        <!-- RPC methods Tab -->
        <TabPane key="rpcMethods" :tab="t('tb.gateway.details.opcua.dataMapping.rpcMethodsSection')">
          <RpcMethodsTable v-model:data="formState.rpc_methods" />
        </TabPane>
      </Tabs>
    </Form>
  </BasicDrawer>
</template>

<script lang="ts" setup name="DataMappingDrawer">
  import { ref, unref } from 'vue';
  import { Form, FormItem, Input, Select, Switch, InputNumber, Tooltip, Tabs, TabPane } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { REPORT_TYPE, REPORT_TYPE_OPTIONS, SHOW_REPORT_PERIOD } from '/@/enums/gateway';

  import AttributesTable from './table/AttributesTable.vue';
  import TimeseriesTable from './table/TimeseriesTable.vue';
  import AttributeUpdatesTable from './table/AttributeUpdatesTable.vue';
  import RpcMethodsTable from './table/RpcMethodsTable.vue';

  import { MappingConfig, DEVICE_INFO_SOURCE, DEVICE_INFO_SOURCE_OPTIONS } from './type';

  const emit = defineEmits(['save', 'register']);
  const { t } = useI18n();

  const mode = ref<'add' | 'edit'>('add');
  const formRef = ref<FormInstance>();
  const enableReportStrategy = ref(false);
  const activeTab = ref('device');

  const initialState: MappingConfig = {
    deviceNodePattern: '',
    deviceNodeSource: DEVICE_INFO_SOURCE.PATH,
    deviceInfo: {
      deviceNameExpression: '',
      deviceNameExpressionSource: DEVICE_INFO_SOURCE.PATH,
      deviceProfileExpression: 'Device',
      deviceProfileExpressionSource: DEVICE_INFO_SOURCE.CONSTANT,
    },
    attributes: [],
    timeseries: [],
    rpc_methods: [],
    attributes_updates: [],
  };

  const formState = ref<MappingConfig>(cloneDeep(initialState));

  const [registerDrawer, { closeDrawer }] = useDrawerInner(async (data) => {
    // 重置表单状态
    formState.value = cloneDeep(initialState);
    enableReportStrategy.value = false;
    activeTab.value = 'device';

    if (data?.mapping && Object.keys(data.mapping).length > 0) {
      formState.value = {
        ...formState.value,
        ...data.mapping,
      };
      enableReportStrategy.value = !!data.mapping.reportStrategy;

      // 如果启用了 reportStrategy 但对象不存在，创建默认对象
      if (enableReportStrategy.value && !formState.value.reportStrategy) {
        formState.value.reportStrategy = {
          type: REPORT_TYPE.ON_REPORT_PERIOD,
          reportPeriod: 30000,
        };
      }
    }

    if (data?.mode) {
      mode.value = data.mode;
    }
  });

  function onReportStrategyToggle(checked: boolean | string | number) {
    if (checked) {
      // 启用上报策略，创建默认对象
      formState.value.reportStrategy = {
        type: REPORT_TYPE.ON_REPORT_PERIOD,
        reportPeriod: 30000,
      };
    } else {
      // 关闭上报策略，删除对象
      delete formState.value.reportStrategy;
    }
  }

  async function handleSubmit() {
    try {
      await unref(formRef)?.validate();

      const result = cloneDeep(formState.value);
      if (!enableReportStrategy.value) {
        delete result.reportStrategy;
      }

      emit('save', result);
      closeDrawer();
    } catch (error) {
      console.error(t('tb.gateway.details.opcua.dataMapping.validationFailed'), error);
    }
  }
</script>

<style scoped>
  :deep(.scrollbar__view) {
    margin: 0 !important;
  }
</style>
