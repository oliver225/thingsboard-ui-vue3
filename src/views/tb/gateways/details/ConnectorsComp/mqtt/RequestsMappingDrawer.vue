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
                ? t('tb.gateway.details.mqtt.requestsMappingDrawer.editTitle')
                : t('tb.gateway.details.mqtt.requestsMappingDrawer.addTitle')
            }}
          </span>
          <span class="text-sm">{{ t('tb.gateway.details.mqtt.requestsMappingDrawer.subtitle') }}</span>
        </div>
      </div>
    </template>

    <!-- Request Type Information -->
    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div class="flex items-start">
        <Icon :icon="getRequestTypeIcon()" class="text-blue-400 mr-3 mt-0.5 text-lg" />
        <div>
          <h4 class="text-sm font-medium text-blue-800 mb-1">{{ getRequestTypeTitle() }}</h4>
          <span class="text-sm text-blue-600 leading-relaxed">{{ getRequestTypeDescription() }}</span>
        </div>
      </div>
    </div>

    <Form ref="formRef" class="mt-4" layout="vertical" :model="currentRequest">
      <!-- Request Type -->
      <FormItem
        :label="t('tb.gateway.details.mqtt.requestsMappingDrawer.requestType')"
        name="type"
        :rules="[{ required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.requestTypeRequired') }]"
      >
        <Select
          v-model:value="currentRequest.type"
          :options="REQUEST_TYPE_OPTIONS"
          @change="onRequestTypeChange"
          :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.selectRequestType')"
        />
      </FormItem>

      <!-- Topic Filter (for Connect, Disconnect, Attribute Request) -->
      <FormItem
        v-if="showTopicFilter"
        :label="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilter')"
        name="topicFilter"
        :rules="[{ required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterRequired') }]"
      >
        <Input
          v-model:value="currentRequest.topicFilter"
          :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterPlaceholder')"
        />
      </FormItem>

      <!-- 设备信息配置 -->
      <div v-if="showDeviceInfo" class="mb-6">
        <div class="flex items-center mb-3">
          <div class="w-1 h-4 bg-blue-500 mr-2"></div>
          <span class="text-sm font-medium">{{
            t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceInfoConfig')
          }}</span>
        </div>

        <!-- 设备名称 -->
        <div class="mb-4">
          <div class="mb-2">
            <label class="text-sm text-gray-700"
              >{{ t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceName') }}
              <span class="text-red-500">*</span></label
            >
          </div>
          <div class="flex w-full gap-2">
            <FormItem
              :name="['deviceInfo', 'deviceNameExpressionSource']"
              :rules="[{ required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.sourceRequired') }]"
              class="!mb-0"
              style="width: 140px"
            >
              <Select
                v-model:value="currentRequest.deviceInfo!.deviceNameExpressionSource"
                :options="EXPRESSION_SOURCE_OPTIONS"
                :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.selectSource')"
              />
            </FormItem>
            <FormItem
              :name="['deviceInfo', 'deviceNameExpression']"
              :rules="[
                {
                  required: true,
                  message: t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceNameExpressionRequired'),
                },
              ]"
              class="!mb-0 flex-1"
            >
              <Input v-model:value="currentRequest.deviceInfo!.deviceNameExpression" placeholder="${serialNumber}" />
            </FormItem>
          </div>
        </div>

        <!-- 设备配置文件 (仅连接请求) -->
        <div v-if="currentRequest.type === REQUEST_TYPE.CONNECT_REQUEST" class="mb-4">
          <div class="mb-2">
            <label class="text-sm text-gray-700"
              >{{ t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceProfile') }}
              <span class="text-red-500">*</span></label
            >
          </div>
          <div class="flex w-full gap-2">
            <FormItem
              :name="['deviceInfo', 'deviceProfileExpressionSource']"
              :rules="[{ required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.sourceRequired') }]"
              class="!mb-0"
              style="width: 140px"
            >
              <Select
                v-model:value="currentRequest.deviceInfo!.deviceProfileExpressionSource"
                :options="EXPRESSION_SOURCE_OPTIONS"
                :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.selectSource')"
              />
            </FormItem>
            <FormItem
              :name="['deviceInfo', 'deviceProfileExpression']"
              :rules="[
                { required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceProfileRequired') },
              ]"
              class="!mb-0 flex-1"
            >
              <Input v-model:value="currentRequest.deviceInfo!.deviceProfileExpression" placeholder="${sensorType}" />
            </FormItem>
          </div>
        </div>
      </div>

      <!-- Attribute Request specific fields -->
      <template v-if="currentRequest.type === REQUEST_TYPE.ATTRIBUTE_REQUEST">
        <!-- 请求解析配置 -->
        <div class="mb-6">
          <div class="flex items-center mb-3">
            <div class="w-1 h-4 bg-green-500 mr-2"></div>
            <span class="text-sm font-medium">{{
              t('tb.gateway.details.mqtt.requestsMappingDrawer.requestParsingConfig')
            }}</span>
          </div>

          <!-- 设备名称表达式 -->
          <div class="mb-4">
            <div class="mb-2">
              <label class="text-sm text-gray-700"
                >{{ t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceNameExpression') }}
                <span class="text-red-500">*</span></label
              >
            </div>
            <div class="flex w-full gap-2">
              <FormItem
                :name="['deviceInfo', 'deviceNameExpressionSource']"
                :rules="[
                  { required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.sourceRequired') },
                ]"
                class="!mb-0"
                style="width: 140px"
              >
                <Select
                  v-model:value="currentRequest.deviceInfo!.deviceNameExpressionSource"
                  :options="EXPRESSION_SOURCE_OPTIONS"
                  :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.selectSource')"
                />
              </FormItem>
              <FormItem
                :name="['deviceInfo', 'deviceNameExpression']"
                :rules="[
                  {
                    required: true,
                    message: t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceNameExpressionRequired'),
                  },
                ]"
                class="!mb-0 flex-1"
              >
                <Input v-model:value="currentRequest.deviceInfo!.deviceNameExpression" placeholder="${deviceName}" />
              </FormItem>
            </div>
          </div>

          <!-- 属性名称表达式 -->
          <div class="mb-4">
            <div class="mb-2">
              <label class="text-sm text-gray-700"
                >{{ t('tb.gateway.details.mqtt.requestsMappingDrawer.attributeNameExpression') }}
                <span class="text-red-500">*</span></label
              >
            </div>
            <div class="flex w-full gap-2">
              <FormItem
                name="attributeNameExpressionSource"
                :rules="[
                  { required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.sourceRequired') },
                ]"
                class="!mb-0"
                style="width: 140px"
              >
                <Select
                  v-model:value="currentRequest.attributeNameExpressionSource"
                  :options="EXPRESSION_SOURCE_OPTIONS"
                  :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.selectSource')"
                />
              </FormItem>
              <FormItem
                name="attributeNameExpression"
                :rules="[
                  {
                    required: true,
                    message: t('tb.gateway.details.mqtt.requestsMappingDrawer.attributeNameExpressionRequired'),
                  },
                ]"
                class="!mb-0 flex-1"
              >
                <Input v-model:value="currentRequest.attributeNameExpression" placeholder="${attributeName}" />
              </FormItem>
            </div>
          </div>
        </div>

        <!-- 响应处理配置 -->
        <div class="mb-6">
          <div class="flex items-center mb-3">
            <div class="w-1 h-4 bg-orange-500 mr-2"></div>
            <span class="text-sm font-medium">{{
              t('tb.gateway.details.mqtt.requestsMappingDrawer.responseProcessingConfig')
            }}</span>
          </div>

          <!-- 响应值表达式 -->
          <FormItem
            :label="t('tb.gateway.details.mqtt.requestsMappingDrawer.responseValueExpression')"
            name="valueExpression"
            :rules="[
              { required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.responseValueRequired') },
            ]"
            class="mb-4"
          >
            <Input v-model:value="currentRequest.valueExpression" placeholder="${attributeValue}" />
          </FormItem>

          <!-- 响应主题表达式 -->
          <FormItem
            :label="t('tb.gateway.details.mqtt.requestsMappingDrawer.responseTopicExpression')"
            name="topicExpression"
            :rules="[
              { required: true, message: t('tb.gateway.details.mqtt.requestsMappingDrawer.responseTopicRequired') },
            ]"
            class="mb-4"
          >
            <Input v-model:value="currentRequest.topicExpression" placeholder="v1/devices/me/attributes/response" />
          </FormItem>

          <!-- 保留消息 -->
          <div class="flex items-center gap-2">
            <Switch v-model:checked="currentRequest.retain" />
            <span class="text-sm font-medium">{{
              t('tb.gateway.details.mqtt.requestsMappingDrawer.retainMessage')
            }}</span>
          </div>
        </div>
      </template>

      <!-- Attribute Update specific fields -->
      <template v-if="currentRequest.type === REQUEST_TYPE.ATTRIBUTE_UPDATE">
        <FormItem
          label="Device name filter"
          name="deviceNameFilter"
          :rules="[{ required: true, message: 'Please enter device name filter' }]"
        >
          <Input v-model:value="currentRequest.deviceNameFilter" placeholder="Enter device name filter pattern" />
        </FormItem>
        <FormItem
          label="Attribute filter"
          name="attributeFilter"
          :rules="[{ required: true, message: 'Please enter attribute filter' }]"
        >
          <Input v-model:value="currentRequest.attributeFilter" placeholder="Enter attribute filter pattern" />
        </FormItem>
        <FormItem
          label="Response value expression"
          name="valueExpression"
          :rules="[{ required: true, message: 'Please enter response value expression' }]"
        >
          <Input
            v-model:value="currentRequest.valueExpression"
            :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterPlaceholder')"
          />
        </FormItem>
        <FormItem
          label="Response topic expression"
          name="topicExpression"
          :rules="[{ required: true, message: 'Please enter response topic expression' }]"
        >
          <Input
            v-model:value="currentRequest.topicExpression"
            :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterPlaceholder')"
          />
        </FormItem>

        <!-- Retain Switch -->
        <div class="mb-6 p-4 border border-orange-200 rounded bg-orange-50">
          <div class="flex items-center gap-2">
            <Switch v-model:checked="currentRequest.retain" />
            <span class="text-sm font-medium">Retain</span>
          </div>
        </div>
      </template>

      <!-- RPC Command specific fields -->
      <template v-if="currentRequest.type === REQUEST_TYPE.RPC_COMMAND">
        <!-- With/Without Response Toggle -->
        <FormItem label="Response type" class="mb-6">
          <RadioGroup v-model:value="currentRequest.rpcType" buttonStyle="solid" @change="onRpcTypeChange">
            <RadioButton :value="RPC_TYPE.TWO_WAY">With response</RadioButton>
            <RadioButton :value="RPC_TYPE.ONE_WAY">Without response</RadioButton>
          </RadioGroup>
        </FormItem>

        <!-- Basic RPC Fields -->
        <FormItem
          label="Device name filter"
          name="deviceNameFilter"
          :rules="[{ required: true, message: 'Please enter device name filter' }]"
        >
          <Input v-model:value="currentRequest.deviceNameFilter" placeholder="Enter device name filter pattern" />
        </FormItem>

        <FormItem
          label="Method filter"
          name="methodFilter"
          :rules="[{ required: true, message: 'Please enter method filter' }]"
        >
          <Input v-model:value="currentRequest.methodFilter" placeholder="Enter RPC method name" />
        </FormItem>

        <FormItem
          label="Request topic expression"
          name="requestTopicExpression"
          :rules="[{ required: true, message: 'Please enter request topic expression' }]"
        >
          <div class="flex items-center gap-2">
            <Input
              v-model:value="currentRequest.requestTopicExpression"
              :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterPlaceholder')"
              class="flex-1"
            />
            <Icon icon="ant-design:info-circle-outlined" class="text-gray-400" />
          </div>
        </FormItem>

        <FormItem
          label="Value expression"
          name="valueExpression"
          :rules="[{ required: true, message: 'Please enter value expression' }]"
        >
          <div class="flex items-center gap-2">
            <Input
              v-model:value="currentRequest.valueExpression"
              :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterPlaceholder')"
              class="flex-1"
            />
            <Icon icon="ant-design:info-circle-outlined" class="text-gray-400" />
          </div>
        </FormItem>

        <!-- Response Fields (only for twoWay) -->
        <template v-if="currentRequest.rpcType === RPC_TYPE.TWO_WAY">
          <FormItem
            label="Response topic expression"
            name="responseTopicExpression"
            :rules="[{ required: true, message: 'Please enter response topic expression' }]"
          >
            <div class="flex items-center gap-2">
              <Input
                v-model:value="currentRequest.responseTopicExpression"
                :placeholder="t('tb.gateway.details.mqtt.requestsMappingDrawer.topicFilterPlaceholder')"
                class="flex-1"
              />
              <Icon icon="ant-design:info-circle-outlined" class="text-gray-400" />
            </div>
          </FormItem>

          <FormItem
            label="Response topic QoS"
            name="responseTopicQoS"
            :rules="[{ required: true, message: 'Please select response topic QoS' }]"
          >
            <Select
              v-model:value="currentRequest.responseTopicQoS"
              :options="QOS_OPTIONS"
              placeholder="0 - At most once"
            />
          </FormItem>

          <FormItem
            label="Response timeout"
            name="responseTimeout"
            :rules="[{ required: true, message: 'Please enter response timeout' }]"
          >
            <InputNumber
              v-model:value="currentRequest.responseTimeout"
              :min="0"
              addon-after="ms"
              placeholder="10000"
              class="w-full"
            />
          </FormItem>
        </template>
      </template>
    </Form>
  </BasicDrawer>
</template>

<script lang="ts" setup name="RequestsMappingModal">
  import { ref, unref, computed } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Switch, RadioButton, RadioGroup } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import {
    RequestData,
    QOS_OPTIONS,
    EXPRESSION_SOURCE_OPTIONS,
    REQUEST_TYPE_OPTIONS,
    EXPRESSION_SOURCE_TYPE,
    REQUEST_TYPE,
    RPC_TYPE,
  } from './type';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n();

  const formRef = ref();
  const editingIndex = ref(-1);
  const currentRequest = ref<RequestData>(createDefaultRequest(REQUEST_TYPE.CONNECT_REQUEST));

  const [registerDrawer, { closeDrawer }] = useDrawerInner(async (data) => {
    if (data?.data && data.isEdit) {
      editingIndex.value = data.index ?? -1;
      currentRequest.value = cloneDeep(data.data);
      currentRequest.value.type = data.type;
    } else {
      editingIndex.value = -1;
      currentRequest.value = createDefaultRequest(data?.type || REQUEST_TYPE.CONNECT_REQUEST);
    }
  });

  // 计算属性：根据请求类型显示不同的字段
  const showTopicFilter = computed(() => {
    return [REQUEST_TYPE.CONNECT_REQUEST, REQUEST_TYPE.DISCONNECT_REQUEST, REQUEST_TYPE.ATTRIBUTE_REQUEST].includes(
      currentRequest.value.type,
    );
  });

  const showDeviceInfo = computed(() => {
    return [REQUEST_TYPE.CONNECT_REQUEST, REQUEST_TYPE.DISCONNECT_REQUEST].includes(currentRequest.value.type);
  });

  // 请求类型配置信息
  const REQUEST_TYPE_CONFIG = {
    [REQUEST_TYPE.CONNECT_REQUEST]: {
      icon: 'ant-design:link-outlined',
      title: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceConnectRequestConfig'),
      description: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceConnectDescription'),
    },
    [REQUEST_TYPE.DISCONNECT_REQUEST]: {
      icon: 'ant-design:disconnect-outlined',
      title: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceDisconnectRequestConfig'),
      description: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.deviceDisconnectDescription'),
    },
    [REQUEST_TYPE.ATTRIBUTE_REQUEST]: {
      icon: 'ant-design:file-search-outlined',
      title: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.attributeRequestConfig'),
      description: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.attributeRequestDescription'),
    },
    [REQUEST_TYPE.ATTRIBUTE_UPDATE]: {
      icon: 'ant-design:sync-outlined',
      title: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.attributeUpdateConfig'),
      description: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.attributeUpdateDescription'),
    },
    [REQUEST_TYPE.RPC_COMMAND]: {
      icon: 'ant-design:send-outlined',
      title: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.rpcCommandConfig'),
      description: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.rpcCommandDescription'),
    },
  };

  // 获取当前请求类型的配置信息
  const getCurrentTypeConfig = () => {
    const config = REQUEST_TYPE_CONFIG[currentRequest.value.type] || {
      icon: 'ant-design:info-circle-outlined',
      title: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.requestMappingConfig'),
      description: () => t('tb.gateway.details.mqtt.requestsMappingDrawer.requestMappingDescription'),
    };
    return config;
  };

  const getRequestTypeIcon = () => getCurrentTypeConfig().icon;
  const getRequestTypeTitle = () => getCurrentTypeConfig().title();
  const getRequestTypeDescription = () => getCurrentTypeConfig().description();

  function createDefaultRequest(type: REQUEST_TYPE): RequestData {
    const baseRequest: RequestData = { type };

    switch (type) {
      case REQUEST_TYPE.CONNECT_REQUEST:
        return {
          ...baseRequest,
          topicFilter: undefined,
          deviceInfo: {
            deviceNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
            deviceNameExpression: undefined,
            deviceProfileExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
            deviceProfileExpression: undefined,
          },
        };
      case REQUEST_TYPE.DISCONNECT_REQUEST:
        return {
          ...baseRequest,
          topicFilter: undefined,
          deviceInfo: {
            deviceNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
            deviceNameExpression: undefined,
          },
        };
      case REQUEST_TYPE.ATTRIBUTE_REQUEST:
        return {
          ...baseRequest,
          topicFilter: undefined,
          deviceInfo: {
            deviceNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
            deviceNameExpression: undefined,
          },
          attributeNameExpressionSource: EXPRESSION_SOURCE_TYPE.MESSAGE,
          attributeNameExpression: undefined,
          topicExpression: undefined,
          valueExpression: undefined,
          retain: false,
        };
      case REQUEST_TYPE.ATTRIBUTE_UPDATE:
        return {
          ...baseRequest,
          deviceNameFilter: undefined,
          attributeFilter: undefined,
          valueExpression: undefined,
          topicExpression: undefined,
          retain: true,
        };
      case REQUEST_TYPE.RPC_COMMAND:
        return {
          ...baseRequest,
          deviceNameFilter: undefined,
          methodFilter: undefined,
          requestTopicExpression: undefined,
          responseTopicExpression: undefined,
          responseTimeout: 10000,
          valueExpression: undefined,
          rpcType: RPC_TYPE.TWO_WAY,
          responseTopicQoS: 0,
        };
      default:
        return baseRequest;
    }
  }

  async function handleSubmit() {
    try {
      await unref(formRef)?.validate();

      emit('success', {
        type: currentRequest.value.type,
        data: cloneDeep(currentRequest.value),
        index: editingIndex.value,
        isEdit: editingIndex.value >= 0,
      });

      closeDrawer();
    } catch (error) {
      console.error(t('tb.gateway.details.mqtt.requestsMappingDrawer.validationFailed'), error);
    }
  }

  function onRequestTypeChange(type: any | REQUEST_TYPE) {
    // 当请求类型改变时，重置表单数据
    const newRequest = createDefaultRequest(type);
    currentRequest.value = newRequest;
  }

  function onRpcTypeChange(e: any) {
    const type = e.target.value;
    currentRequest.value.rpcType = type;
    if (type === RPC_TYPE.ONE_WAY) {
      // 清除响应相关字段
      delete currentRequest.value.responseTopicExpression;
      delete currentRequest.value.responseTimeout;
      delete currentRequest.value.responseTopicQoS;
    } else {
      // 设置默认响应字段
      currentRequest.value.responseTopicExpression = undefined;
      currentRequest.value.responseTimeout = 10000;
      currentRequest.value.responseTopicQoS = 0;
    }
  }
</script>

<style scoped>
  .flex-1 {
    flex: 1;
  }
</style>
