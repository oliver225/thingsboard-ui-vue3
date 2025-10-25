<template>
  <div>
    <!-- Header with Add button -->
    <div class="mb-4 flex justify-between items-center">
      <span class="text-base font-medium">{{ t('tb.gateway.details.mqtt.requestsMapping.title') }}</span>
      <div class="flex gap-2">
        <Button type="primary" @click="openModal()">
          <template #icon>
            <Icon icon="ant-design:plus-outlined" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
      {{ t('tb.gateway.details.mqtt.requestsMapping.description') }}
    </div>

    <!-- Requests mapping list -->
    <div v-if="allRequests.length === 0" class="text-center py-8 text-gray-500">
      {{ t('tb.gateway.details.mqtt.requestsMapping.noRequests') }}
    </div>

    <div v-else>
      <!-- Table header -->
      <div class="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-50 rounded-t font-medium text-sm border-b">
        <div class="col-span-3">{{ t('tb.gateway.details.mqtt.requestsMapping.type') }}</div>
        <div class="col-span-7">{{ t('tb.gateway.details.mqtt.requestsMapping.details') }}</div>
        <div class="col-span-2 text-right">{{ t('tb.gateway.details.mqtt.requestsMapping.actions') }}</div>
      </div>

      <!-- Table rows -->
      <div class="border border-t-0 rounded-b">
        <div
          v-for="(request, index) in allRequests"
          :key="`${request.type}-${index}`"
          class="grid grid-cols-12 gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
          @click="openModal(request.type, request.originalIndex)"
        >
          <div class="col-span-3">
            <Tag :color="getRequestTypeColor(request.type)">
              {{ getRequestTypeLabel(request.type) }}
            </Tag>
          </div>
          <div class="col-span-7 text-sm text-gray-600">
            {{ getRequestDetails(request) }}
          </div>
          <div class="col-span-2 text-right">
            <Button type="text" size="small" @click.stop="openModal(request.type, request.originalIndex)">
              <Icon icon="ant-design:edit-outlined" />
            </Button>
            <Button type="text" size="small" danger @click.stop="removeRequest(request.type, request.originalIndex)">
              <Icon icon="ant-design:delete-outlined" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Requests Mapping Drawer -->
    <RequestsMappingDrawer @register="registerDrawer" @success="handleModalSuccess" />
  </div>
</template>

<script lang="ts" setup name="RequestsMapping">
  import { ref, watch, PropType, computed } from 'vue';
  import { Button, Tag } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { useDrawer } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { REQUEST_TYPE, RequestsMapping } from './type';
  import RequestsMappingDrawer from './RequestsMappingDrawer.vue';

  const props = defineProps({
    config: {
      type: Object as PropType<Partial<RequestsMapping>>,
      default: () => ({}),
    },
  });

  const initialState: RequestsMapping = {
    connectRequests: [],
    disconnectRequests: [],
    attributeRequests: [],
    attributeUpdates: [],
    serverSideRpc: [],
  };

  const formState = ref<RequestsMapping>(cloneDeep(initialState));
  const { t } = useI18n();

  const [registerDrawer, { openDrawer: openDrawerInner }] = useDrawer();

  // 请求类型配置映射
  const REQUEST_TYPE_CONFIG = {
    [REQUEST_TYPE.CONNECT_REQUEST]: {
      color: 'green',
      label: t('tb.gateway.details.mqtt.requestsMapping.connectRequest'),
      detailField: 'topicFilter',
      defaultDetail: t('tb.gateway.details.mqtt.requestsMapping.noTopicFilter'),
    },
    [REQUEST_TYPE.DISCONNECT_REQUEST]: {
      color: 'red',
      label: t('tb.gateway.details.mqtt.requestsMapping.disconnectRequest'),
      detailField: 'topicFilter',
      defaultDetail: t('tb.gateway.details.mqtt.requestsMapping.noTopicFilter'),
    },
    [REQUEST_TYPE.ATTRIBUTE_REQUEST]: {
      color: 'blue',
      label: t('tb.gateway.details.mqtt.requestsMapping.attributeRequest'),
      detailField: 'topicFilter',
      defaultDetail: t('tb.gateway.details.mqtt.requestsMapping.noTopicFilter'),
    },
    [REQUEST_TYPE.ATTRIBUTE_UPDATE]: {
      color: 'orange',
      label: t('tb.gateway.details.mqtt.requestsMapping.attributeUpdate'),
      detailField: 'attributeFilter',
      defaultDetail: t('tb.gateway.details.mqtt.requestsMapping.noAttributeFilter'),
    },
    [REQUEST_TYPE.RPC_COMMAND]: {
      color: 'purple',
      label: t('tb.gateway.details.mqtt.requestsMapping.rpcCommand'),
      detailField: 'methodFilter',
      defaultDetail: t('tb.gateway.details.mqtt.requestsMapping.noMethodFilter'),
    },
  } as const;

  watch(
    () => [props.config],
    () => {
      formState.value = cloneDeep(initialState);
      if (props.config) {
        formState.value = {
          ...formState.value,
          ...props.config,
        };
      }
    },
    { immediate: true, deep: true },
  );

  // 计算属性：将所有请求类型合并为一个列表显示
  const allRequests = computed(() => {
    const requests: Array<{
      type: string;
      data: any;
      originalIndex: number;
    }> = [];

    Object.entries(REQUEST_TYPE_CONFIG).forEach(([type, config]) => {
      const requestArray = formState.value[type as keyof RequestsMapping];
      if (requestArray && Array.isArray(requestArray)) {
        requestArray.forEach((req, index) => {
          requests.push({
            type,
            data: req,
            originalIndex: index,
          });
        });
      }
    });

    return requests;
  });

  function getRequestTypeColor(type: string) {
    return REQUEST_TYPE_CONFIG[type]?.color || 'default';
  }

  function getRequestTypeLabel(type: string) {
    return REQUEST_TYPE_CONFIG[type]?.label || type;
  }

  function getRequestDetails(request: any) {
    const config = REQUEST_TYPE_CONFIG[request.type];
    if (!config) return 'No details';

    return request.data[config.detailField] || config.defaultDetail;
  }

  function openModal(type?: string, index?: number) {
    if (type && typeof index === 'number') {
      // 编辑现有请求
      const requestData = getRequestByTypeAndIndex(type, index);
      openDrawerInner(true, {
        type,
        data: requestData,
        index,
        isEdit: true,
      });
    } else {
      // 添加新请求
      openDrawerInner(true, {
        type: REQUEST_TYPE.CONNECT_REQUEST, // 默认类型
        data: null,
        index: -1,
        isEdit: false,
      });
    }
  }

  function getRequestByTypeAndIndex(type: string, index: number) {
    const config = REQUEST_TYPE_CONFIG[type];
    return config ? formState.value[type as keyof RequestsMapping][index] : null;
  }

  function handleModalSuccess({ type, data, index, isEdit }) {
    if (isEdit && index >= 0) {
      // 更新现有请求
      updateRequestByTypeAndIndex(type, index, data);
    } else {
      // 添加新请求
      addRequestByType(type, data);
    }
  }

  function updateRequestByTypeAndIndex(type: string, index: number, data: any) {
    const config = REQUEST_TYPE_CONFIG[type];
    if (config) {
      formState.value[type as keyof RequestsMapping][index] = cloneDeep(data);
    }
  }

  function addRequestByType(type: string, data: any) {
    const config = REQUEST_TYPE_CONFIG[type];
    if (config) {
      formState.value[type as keyof RequestsMapping].push(cloneDeep(data));
    }
  }

  function removeRequest(type: string, index: number) {
    const config = REQUEST_TYPE_CONFIG[type];
    if (config) {
      formState.value[type as keyof RequestsMapping].splice(index, 1);
    }
  }

  async function getConfiguration() {
    return { configurationJson: { requestsMapping: cloneDeep(formState.value) } };
  }

  defineExpose({ getConfiguration });
</script>

<style scoped>
  .device-info-section {
    background-color: #fafafa;
  }
</style>
