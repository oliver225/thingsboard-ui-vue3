<template>
  <div class="data-mapping">
    <!-- Header with Add button -->
    <div class="mb-4 flex justify-between items-center">
      <span class="text-base font-medium">{{ t('tb.gateway.details.opcua.dataMapping.title') }}</span>
      <div class="flex gap-2">
        <Button type="primary" @click="handleAdd">
          <template #icon>
            <Icon icon="ant-design:plus-outlined" />
          </template>
        </Button>
        <Button @click="handleSearch">
          <template #icon>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
      {{ t('tb.gateway.details.opcua.dataMapping.description') }}
    </div>

    <!-- Mappings list -->
    <div v-if="mappings.length === 0" class="text-center py-8 text-gray-500">
      {{ t('tb.gateway.details.opcua.dataMapping.noMappings') }}
    </div>

    <div v-else>
      <!-- Table header -->
      <div class="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-50 rounded-t font-medium text-sm border-b">
        <div class="col-span-4">{{ t('tb.gateway.details.opcua.dataMapping.deviceNode') }}</div>
        <div class="col-span-3">{{ t('tb.gateway.details.opcua.dataMapping.deviceName') }}</div>
        <div class="col-span-3">{{ t('tb.gateway.details.opcua.dataMapping.deviceProfile') }}</div>
        <div class="col-span-2 text-right">{{ t('tb.gateway.details.opcua.dataMapping.actions') }}</div>
      </div>

      <!-- Table rows -->
      <div class="border border-t-0 rounded-b">
        <div
          v-for="(mapping, index) in mappings"
          :key="index"
          class="grid grid-cols-12 gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
          @click="handleEdit(mapping, index)"
        >
          <div class="col-span-4 font-medium text-sm">{{ mapping.deviceNodePattern }}</div>
          <div class="col-span-3 text-sm text-gray-600 truncate">{{ mapping.deviceInfo.deviceNameExpression }}</div>
          <div class="col-span-3 text-sm">
            <Tag color="blue">{{ mapping.deviceInfo.deviceProfileExpression || 'Device' }}</Tag>
          </div>
          <div class="col-span-2 text-right">
            <Button type="text" size="small" @click.stop="handleEdit(mapping, index)">
              <Icon icon="ant-design:edit-outlined" />
            </Button>
            <Button type="text" size="small" danger @click.stop="removeMapping(index)">
              <Icon icon="ant-design:delete-outlined" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据映射配置抽屉 -->
    <DataMappingDrawer @register="registerDrawer" @save="handleSave" />
  </div>
</template>

<script lang="ts" setup name="OpcuaDataMapping">
  import { ref, watch, PropType } from 'vue';
  import { Button, Tag } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { useDrawer } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';

  import DataMappingDrawer from './DataMappingDrawer.vue';
  import { MappingConfig, DEVICE_INFO_SOURCE } from './type';
  import { REPORT_TYPE } from '/@/enums/gateway';

  const props = defineProps({
    config: {
      type: Array as PropType<MappingConfig[]>,
      default: () => [],
    },
  });

  const mappings = ref<MappingConfig[]>([]);
  const currentIndex = ref(-1);
  const { t } = useI18n('');
  const { showMessage } = useMessage();

  const [registerDrawer, { openDrawer }] = useDrawer();

  const createDefaultMapping = (): MappingConfig => ({
    deviceNodePattern: 'Root\\.Objects\\.Device1',
    deviceNodeSource: DEVICE_INFO_SOURCE.PATH,
    deviceInfo: {
      deviceNameExpression: 'Device ${Root\\.Objects\\.Device1\\.serialNumber}',
      deviceNameExpressionSource: DEVICE_INFO_SOURCE.PATH,
      deviceProfileExpression: 'Device',
      deviceProfileExpressionSource: DEVICE_INFO_SOURCE.CONSTANT,
    },
    attributes: [],
    timeseries: [],
    rpc_methods: [],
    attributes_updates: [],
  });

  // 初始化数据
  watch(
    () => props.config,
    (newConfig) => {
      if (newConfig && newConfig.length > 0) {
        mappings.value = cloneDeep(newConfig);
      } else {
        mappings.value = [];
      }
    },
    { immediate: true, deep: true },
  );

  function handleAdd() {
    currentIndex.value = -1;
    openDrawer(true, {
      mapping: createDefaultMapping(),
      mode: 'add',
    });
  }

  function handleEdit(record: MappingConfig, index: number) {
    currentIndex.value = index;
    openDrawer(true, {
      mapping: cloneDeep(record),
      mode: 'edit',
    });
  }

  function handleSearch() {
    showMessage(t('tb.gateway.details.opcua.dataMapping.comingSoon'), 'info');
  }

  function removeMapping(index: number) {
    mappings.value.splice(index, 1);
  }

  function handleSave(mapping: MappingConfig) {
    if (currentIndex.value === -1) {
      mappings.value.push(mapping);
    } else {
      mappings.value.splice(currentIndex.value, 1, mapping);
    }
  }

  async function getConfiguration() {
    return {
      configurationJson: {
        mapping: cloneDeep(mappings.value),
      },
    };
  }

  function resetToInitial() {
    if (props.config && props.config.length > 0) {
      mappings.value = cloneDeep(props.config);
    } else {
      mappings.value = [];
    }
  }

  defineExpose({ getConfiguration, resetToInitial });
</script>

<style scoped>
  .data-mapping {
    padding: 16px;
  }
</style>
