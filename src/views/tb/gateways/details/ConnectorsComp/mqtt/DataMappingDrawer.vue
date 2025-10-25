<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    width="900px"
    :showFooter="true"
    @ok="handleSubmit"
    :maskClosable="false"
  >
    <template #title>
      <div class="flex items-center space-x-4">
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{
              editingIndex !== -1
                ? t('tb.gateway.details.mqtt.dataMappingDrawer.editTitle')
                : t('tb.gateway.details.mqtt.dataMappingDrawer.addTitle')
            }}
          </span>
          <span class="text-sm">Data Mapping</span>
        </div>
      </div>
    </template>
    <Form ref="formRef" :model="currentMapping" class="mt-4" layout="vertical">
      <!-- Topic Filter -->
      <FormItem
        label="Topic filter"
        name="topicFilter"
        :rules="[{ required: true, message: 'Topic filter is required!' }]"
      >
        <Input v-model:value="currentMapping.topicFilter" placeholder="sensor/data" />
      </FormItem>

      <!-- QoS -->
      <FormItem label="QoS" name="subscriptionQos" :rules="[{ required: true, message: 'Please select QoS level' }]">
        <Select v-model:value="currentMapping.subscriptionQos" :options="QOS_OPTIONS" />
      </FormItem>

      <!-- Payload Type -->
      <FormItem
        label="Payload type"
        :name="['converter', 'type']"
        :rules="[{ required: true, message: 'Please select payload type' }]"
      >
        <Segmented
          v-model:value="currentMapping.converter.type"
          :options="PAYLOAD_TYPE_OPTIONS"
          @change="onPayloadTypeChange"
        />
      </FormItem>

      <!-- 设备信息配置 -->
      <div class="mb-6">
        <div class="flex items-center mb-3">
          <div class="w-1 h-4 bg-blue-500 mr-2"></div>
          <span class="text-sm font-medium">{{ t('tb.gateway.details.mqtt.dataMappingDrawer.deviceInfoConfig') }}</span>
        </div>

        <!-- 设备名称 -->
        <div class="mb-4">
          <div class="mb-2">
            <label class="text-sm text-gray-700"
              >{{ t('tb.gateway.details.mqtt.dataMappingDrawer.deviceNameLabel') }}
              <span class="text-red-500">*</span></label
            >
          </div>
          <div class="flex w-full gap-2">
            <FormItem
              :name="['converter', 'deviceInfo', 'deviceNameExpressionSource']"
              :rules="[{ required: true, message: t('tb.gateway.details.mqtt.dataMappingDrawer.sourceRequired') }]"
              class="!mb-0"
              style="width: 140px"
            >
              <Select
                v-model:value="currentMapping.converter.deviceInfo.deviceNameExpressionSource"
                :options="getExpressionSourceOptions()"
                :placeholder="t('tb.gateway.details.mqtt.dataMappingDrawer.selectSource')"
              />
            </FormItem>
            <FormItem
              :name="['converter', 'deviceInfo', 'deviceNameExpression']"
              :rules="[
                {
                  required: true,
                  message: t('tb.gateway.details.mqtt.dataMappingDrawer.deviceNameExpressionRequiredMsg'),
                },
              ]"
              class="!mb-0 flex-1"
            >
              <Input
                v-model:value="currentMapping.converter.deviceInfo.deviceNameExpression"
                placeholder="${serialNumber}"
              />
            </FormItem>
          </div>
        </div>

        <!-- 设备配置文件 -->
        <div class="mb-4">
          <div class="mb-2">
            <label class="text-sm text-gray-700"
              >{{ t('tb.gateway.details.mqtt.dataMappingDrawer.deviceProfileLabel') }}
              <span class="text-red-500">*</span></label
            >
          </div>
          <div class="flex w-full gap-2">
            <FormItem
              :name="['converter', 'deviceInfo', 'deviceProfileExpressionSource']"
              :rules="[{ required: true, message: t('tb.gateway.details.mqtt.dataMappingDrawer.sourceRequired') }]"
              class="!mb-0"
              style="width: 140px"
            >
              <Select
                v-model:value="currentMapping.converter.deviceInfo.deviceProfileExpressionSource"
                :options="getExpressionSourceOptions()"
                :placeholder="t('tb.gateway.details.mqtt.dataMappingDrawer.selectSource')"
              />
            </FormItem>
            <FormItem
              :name="['converter', 'deviceInfo', 'deviceProfileExpression']"
              :rules="[
                {
                  required: true,
                  message: t('tb.gateway.details.mqtt.dataMappingDrawer.deviceProfileExpressionRequiredMsg'),
                },
              ]"
              class="!mb-0 flex-1"
            >
              <Input
                v-model:value="currentMapping.converter.deviceInfo.deviceProfileExpression"
                placeholder="${sensorType}"
              />
            </FormItem>
          </div>
        </div>
      </div>

      <!-- 上报策略配置 -->
      <div :class="showReportStrategy ? 'mb-2' : 'mb-6'">
        <div class="flex items-center mb-3">
          <div class="w-1 h-4 bg-orange-500 mr-2"></div>
          <span class="text-sm font-medium">{{
            t('tb.gateway.details.mqtt.dataMappingDrawer.reportStrategyConfig')
          }}</span>
        </div>

        <div class="flex items-center mb-3">
          <Switch v-model:checked="showReportStrategy" class="ml-3" @change="onReportStrategyToggle" />
          <span class="ml-2 text-xs text-gray-500">{{
            t('tb.gateway.details.mqtt.dataMappingDrawer.enableTimedReport')
          }}</span>
        </div>

        <div v-if="showReportStrategy" class="grid grid-cols-2 gap-4">
          <FormItem
            :label="t('tb.gateway.details.mqtt.dataMappingDrawer.reportTypeLabel')"
            :name="['reportStrategy', 'type']"
            :rules="[{ required: true, message: t('tb.gateway.details.mqtt.dataMappingDrawer.reportTypeRequired') }]"
          >
            <Select
              v-model:value="currentMapping.reportStrategy!.type"
              :options="REPORT_TYPE_OPTIONS"
              :placeholder="t('tb.gateway.details.mqtt.dataMappingDrawer.reportTypeLabel')"
            />
          </FormItem>
          <FormItem
            v-if="
              SHOW_REPORT_PERIOD.includes(
                currentMapping.reportStrategy!.type as REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD,
              )
            "
            :label="t('tb.gateway.details.mqtt.dataMappingDrawer.reportPeriodLabel')"
            :name="['reportStrategy', 'reportPeriod']"
            :rules="[{ required: true, message: t('tb.gateway.details.mqtt.dataMappingDrawer.reportPeriodRequired') }]"
          >
            <InputNumber
              v-model:value="currentMapping.reportStrategy!.reportPeriod"
              :min="1000"
              :step="1000"
              :addon-after="t('tb.gateway.details.mqtt.fieldConfigModal.milliseconds')"
              :placeholder="t('tb.gateway.details.mqtt.dataMappingDrawer.reportPeriodPlaceholder')"
              class="w-full"
            />
          </FormItem>
        </div>
      </div>

      <!-- 数据字段配置 -->
      <div v-if="currentMapping.converter.type !== CONVERTER_TYPE.CUSTOM" class="mb-6">
        <div class="flex items-center mb-3">
          <div class="w-1 h-4 bg-green-500 mr-2"></div>
          <span class="text-sm font-medium">{{ t('tb.gateway.details.mqtt.dataMappingDrawer.dataFieldsConfig') }}</span>
        </div>

        <!-- 设备属性 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <Icon icon="ant-design:tag-outlined" class="text-blue-500 mr-1" />
              <span class="text-sm font-medium">{{
                t('tb.gateway.details.mqtt.dataMappingDrawer.attributesSection')
              }}</span>
              <span class="ml-2 text-xs text-gray-500">{{
                t('tb.gateway.details.mqtt.dataMappingDrawer.attributesStaticDesc')
              }}</span>
            </div>
            <Button type="link" size="small" @click="openAttributesModal">{{
              t('tb.gateway.details.mqtt.dataMappingDrawer.configureAttributes')
            }}</Button>
          </div>
          <div class="min-h-[40px] p-3 bg-gray-50 rounded border-dashed border-2 border-gray-200">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="(attr, index) in currentMapping.converter.attributes"
                :key="index"
                closable
                @close="removeAttribute(index)"
                color="blue"
              >
                {{ attr.key }}
              </Tag>
              <span v-if="!currentMapping.converter.attributes?.length" class="text-xs text-gray-400">
                {{ t('tb.gateway.details.mqtt.dataMappingDrawer.noAttributeFields') }}
              </span>
            </div>
          </div>
        </div>

        <!-- 时序数据 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <Icon icon="ant-design:line-chart-outlined" class="text-green-500 mr-1" />
              <span class="text-sm font-medium">{{
                t('tb.gateway.details.mqtt.dataMappingDrawer.timeseriesSection')
              }}</span>
              <span class="ml-2 text-xs text-gray-500">{{
                t('tb.gateway.details.mqtt.dataMappingDrawer.timeseriesDynamicDesc')
              }}</span>
            </div>
            <Button type="link" size="small" @click="openTimeseriesModal">{{
              t('tb.gateway.details.mqtt.dataMappingDrawer.configureTimeseries')
            }}</Button>
          </div>
          <div class="min-h-[40px] p-3 bg-gray-50 rounded border-dashed border-2 border-gray-200">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="(ts, index) in currentMapping.converter.timeseries"
                :key="index"
                closable
                @close="removeTimeseries(index)"
                color="green"
              >
                {{ ts.key }}
              </Tag>
              <span v-if="!currentMapping.converter.timeseries?.length" class="text-xs text-gray-400">
                {{ t('tb.gateway.details.mqtt.dataMappingDrawer.noTimeseriesFields') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义转换器配置 -->
      <div v-if="currentMapping.converter.type === CONVERTER_TYPE.CUSTOM" class="mb-6">
        <div class="flex items-center mb-3">
          <div class="w-1 h-4 bg-purple-500 mr-2"></div>
          <span class="text-sm font-medium">{{
            t('tb.gateway.details.mqtt.dataMappingDrawer.customConverterConfig')
          }}</span>
        </div>

        <!-- 扩展类名 -->
        <FormItem
          :label="t('tb.gateway.details.mqtt.dataMappingDrawer.extensionClassName')"
          name="extension"
          :rules="[
            { required: true, message: t('tb.gateway.details.mqtt.dataMappingDrawer.extensionClassNameRequired') },
          ]"
          class="mb-4"
        >
          <Input v-model:value="currentMapping.converter.extension" placeholder="请输入扩展类名" />
        </FormItem>

        <!-- 扩展配置参数 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <Icon icon="ant-design:setting-outlined" class="text-purple-500 mr-1" />
              <span class="text-sm font-medium">{{
                t('tb.gateway.details.mqtt.dataMappingDrawer.extensionParams')
              }}</span>
              <span class="ml-2 text-xs text-gray-500">{{
                t('tb.gateway.details.mqtt.dataMappingDrawer.extensionParamsDesc')
              }}</span>
            </div>
            <Button type="link" size="small" @click="openExtensionConfigModal">{{
              t('tb.gateway.details.mqtt.dataMappingDrawer.addParameter')
            }}</Button>
          </div>

          <div class="min-h-[40px] p-3 bg-gray-50 rounded border-dashed border-2 border-gray-200">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="(key, index) in extensionConfigKeys"
                :key="index"
                closable
                @close="removeExtensionConfigKey(index)"
                color="purple"
              >
                {{ key.key }}
              </Tag>
              <span v-if="!extensionConfigKeys.length" class="text-xs text-gray-400">
                {{ t('tb.gateway.details.mqtt.dataMappingDrawer.noParameters') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Form>

    <!-- Field Config Modals -->
    <DataMappingModalFieldConfig @register="registerFieldConfigModal" @success="handleFieldConfigSuccess" />

    <!-- Extension Config Modal -->
    <ExtensionConfigModal @register="registerExtensionConfigModal" @success="handleExtensionConfigSuccess" />
  </BasicDrawer>
</template>

<script lang="ts" setup name="DataMappingModal">
  import { ref, unref } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Switch, Button, Tag, Segmented } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { useModal } from '/@/components/Modal';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { REPORT_TYPE_OPTIONS, SHOW_REPORT_PERIOD, REPORT_TYPE } from '/@/enums/gateway';

  import {
    MappingConfig,
    EXPRESSION_SOURCE_OPTIONS,
    QOS_OPTIONS,
    PAYLOAD_TYPE_OPTIONS,
    CONVERTER_TYPE,
    EXPRESSION_SOURCE_TYPE,
    EXPRESSION_SOURCE_OPTIONS_WITH_BYTES,
    CONVERTER_FIELD_TYPE,
  } from './type';
  import DataMappingModalFieldConfig from './FieldConfigModal.vue';
  import ExtensionConfigModal from './ExtensionConfigModal.vue';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n();

  const createDefaultMapping = (): MappingConfig => ({
    topicFilter: 'sensor/data',
    subscriptionQos: 1,
    reportStrategy: {
      type: REPORT_TYPE.ON_REPORT_PERIOD,
      reportPeriod: 30000,
    },
    converter: {
      type: CONVERTER_TYPE.JSON,
      deviceInfo: {
        deviceNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
        deviceNameExpression: '${serialNumber}',
        deviceProfileExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
        deviceProfileExpression: '${sensorType}',
      },
      sendDataOnlyOnChange: false,
      timeout: 60000,
      attributes: [],
      timeseries: [],
    },
  });

  const formRef = ref<FormInstance>();
  const editingIndex = ref(-1);
  const currentMapping = ref<MappingConfig>(createDefaultMapping());

  // Report strategy
  const showReportStrategy = ref(false);

  // Extension config for custom converter
  const extensionConfigKeys = ref<Array<{ key: string; value: string }>>([]);

  const [registerDrawer, { closeDrawer }] = useDrawerInner(async (data) => {
    if (data?.record) {
      editingIndex.value = data.index ?? -1;
      currentMapping.value = cloneDeep(data.record);
    } else {
      editingIndex.value = -1;
      currentMapping.value = createDefaultMapping();
    }

    // 确保deviceInfo始终存在
    if (!currentMapping.value.converter.deviceInfo) {
      currentMapping.value.converter.deviceInfo = {
        deviceNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
        deviceNameExpression: '${serialNumber}',
        deviceProfileExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
        deviceProfileExpression: '${sensorType}',
      };
    }

    // 确保 reportStrategy 字段存在
    if (currentMapping.value.reportStrategy && !currentMapping.value.reportStrategy.type) {
      currentMapping.value.reportStrategy.type = REPORT_TYPE.ON_REPORT_PERIOD;
    }
    if (currentMapping.value.reportStrategy && !currentMapping.value.reportStrategy.reportPeriod) {
      currentMapping.value.reportStrategy.reportPeriod = 30000;
    }

    // 根据是否有 reportStrategy 来设置 showReportStrategy
    showReportStrategy.value = !!currentMapping.value.reportStrategy;

    // 如果启用了 reportStrategy 但对象不存在，创建默认对象
    if (showReportStrategy.value && !currentMapping.value.reportStrategy) {
      currentMapping.value.reportStrategy = {
        type: REPORT_TYPE.ON_REPORT_PERIOD,
        reportPeriod: 30000,
      };
    }

    // Initialize extension config keys
    initializeExtensionConfigKeys();
  });

  const [registerFieldConfigModal, { openModal: openFieldConfigModalInner }] = useModal();
  const [registerExtensionConfigModal, { openModal: openExtensionConfigModalInner }] = useModal();

  async function handleSubmit() {
    try {
      await unref(formRef)?.validate();

      // 如果未启用上报策略，清除相关字段
      const finalMapping = cloneDeep(currentMapping.value);
      if (!showReportStrategy.value) {
        delete finalMapping.reportStrategy;
      }

      emit('success', {
        record: finalMapping,
        index: editingIndex.value,
      });

      closeDrawer();
    } catch (error) {
      console.error(t('tb.gateway.details.mqtt.dataMappingDrawer.validationFailed'), error);
    }
  }

  function onReportStrategyToggle(checked: boolean | string | number) {
    if (checked) {
      // 启用上报策略，创建默认对象
      currentMapping.value.reportStrategy = {
        type: REPORT_TYPE.ON_REPORT_PERIOD,
        reportPeriod: 30000,
      };
    } else {
      // 关闭上报策略，删除对象
      delete currentMapping.value.reportStrategy;
    }
  }

  function onPayloadTypeChange(type: string | number) {
    currentMapping.value.converter.type = String(type) as any;

    // 确保deviceInfo始终存在
    if (!currentMapping.value.converter.deviceInfo) {
      currentMapping.value.converter.deviceInfo = {
        deviceNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
        deviceNameExpression: '${serialNumber}',
        deviceProfileExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
        deviceProfileExpression: '${sensorType}',
      };
    }

    if (String(type) === CONVERTER_TYPE.CUSTOM) {
      currentMapping.value.converter.extension = '';
      currentMapping.value.converter.cached = true;
      currentMapping.value.converter.extensionConfig = {};
      delete currentMapping.value.converter.attributes;
      delete currentMapping.value.converter.timeseries;
      extensionConfigKeys.value = [];
    } else {
      if (!currentMapping.value.converter.attributes) {
        currentMapping.value.converter.attributes = [];
      }
      if (!currentMapping.value.converter.timeseries) {
        currentMapping.value.converter.timeseries = [];
      }
      delete currentMapping.value.converter.extension;
      delete currentMapping.value.converter.cached;
      delete currentMapping.value.converter.extensionConfig;
      extensionConfigKeys.value = [];
    }
  }

  // Attributes functions
  function openAttributesModal() {
    openFieldConfigModalInner(true, {
      fields: currentMapping.value.converter.attributes || [],
      fieldType: CONVERTER_FIELD_TYPE.ATTRIBUTES,
    });
  }

  function removeAttribute(index: number) {
    currentMapping.value.converter.attributes?.splice(index, 1);
  }

  // Timeseries functions
  function openTimeseriesModal() {
    openFieldConfigModalInner(true, {
      fields: currentMapping.value.converter.timeseries || [],
      fieldType: CONVERTER_FIELD_TYPE.TIMESERIES,
    });
  }

  function removeTimeseries(index: number) {
    currentMapping.value.converter.timeseries?.splice(index, 1);
  }

  // Handle field config modal success
  function handleFieldConfigSuccess(data: { fields: any[]; fieldType: string }) {
    if (data.fieldType === CONVERTER_FIELD_TYPE.ATTRIBUTES) {
      currentMapping.value.converter.attributes = data.fields;
    } else if (data.fieldType === CONVERTER_FIELD_TYPE.TIMESERIES) {
      currentMapping.value.converter.timeseries = data.fields;
    }
  }

  // Get expression source options based on converter type
  function getExpressionSourceOptions() {
    if (currentMapping.value.converter.type === CONVERTER_TYPE.BYTES) {
      return EXPRESSION_SOURCE_OPTIONS_WITH_BYTES;
    }
    return EXPRESSION_SOURCE_OPTIONS;
  }

  // Extension config functions
  function openExtensionConfigModal() {
    openExtensionConfigModalInner(true, {
      configItems: extensionConfigKeys.value,
    });
  }

  function removeExtensionConfigKey(index: number) {
    extensionConfigKeys.value.splice(index, 1);
    updateExtensionConfigObject();
  }

  function handleExtensionConfigSuccess(data: { configItems: Array<{ key: string; value: string }> }) {
    extensionConfigKeys.value = cloneDeep(data.configItems);
    updateExtensionConfigObject();
  }

  function updateExtensionConfigObject() {
    if (currentMapping.value.converter.type === CONVERTER_TYPE.CUSTOM) {
      const configObj = {};
      extensionConfigKeys.value.forEach((item) => {
        if (item.key && item.value) {
          configObj[item.key] = isNaN(Number(item.value)) ? item.value : Number(item.value);
        }
      });
      currentMapping.value.converter.extensionConfig = configObj;
    }
  }

  // Initialize extension config keys from object
  function initializeExtensionConfigKeys() {
    if (
      currentMapping.value.converter.type === CONVERTER_TYPE.CUSTOM &&
      currentMapping.value.converter.extensionConfig
    ) {
      extensionConfigKeys.value = Object.entries(currentMapping.value.converter.extensionConfig).map(
        ([key, value]) => ({
          key,
          value: String(value),
        }),
      );
    } else {
      extensionConfigKeys.value = [];
    }
  }
</script>

<style scoped>
  .flex-1 {
    flex: 1;
  }
</style>
