<template>
  <div>
    <!-- Header with Add button -->
    <div class="mb-4 flex justify-between items-center">
      <span class="text-base font-medium">{{ t('tb.gateway.details.mqtt.dataMapping.title') }}</span>
      <div class="flex gap-2">
        <Button type="primary" @click="handleDrawer()">
          <template #icon>
            <Icon icon="ant-design:plus-outlined" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
      {{ t('tb.gateway.details.mqtt.dataMapping.description') }}
    </div>

    <!-- Data mapping list -->
    <div v-if="formState.length === 0" class="text-center py-8 text-gray-500">
      {{ t('tb.gateway.details.mqtt.dataMapping.noMappings') }}
    </div>

    <div v-else>
      <!-- Table header -->
      <div class="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-50 rounded-t font-medium text-sm border-b">
        <div class="col-span-4">{{ t('tb.gateway.details.mqtt.dataMapping.topicFilter') }}</div>
        <div class="col-span-2">{{ t('tb.gateway.details.mqtt.dataMapping.qos') }}</div>
        <div class="col-span-4">{{ t('tb.gateway.details.mqtt.dataMapping.payloadType') }}</div>
        <div class="col-span-2 text-right">{{ t('tb.gateway.details.mqtt.dataMapping.actions') }}</div>
      </div>

      <!-- Table rows -->
      <div class="border border-t-0 rounded-b">
        <div
          v-for="(mapping, index) in formState"
          :key="index"
          class="grid grid-cols-12 gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
          @click="handleDrawer(index)"
        >
          <div class="col-span-4 font-mono text-sm">{{ mapping.topicFilter }}</div>
          <div class="col-span-2">{{ mapping.subscriptionQos }}</div>
          <div class="col-span-4">
            <Tag :color="getPayloadTypeColor(mapping.converter.type)">
              {{ mapping.converter.type.toUpperCase() }}
            </Tag>
          </div>
          <div class="col-span-2 text-right">
            <Button type="text" size="small" @click.stop="handleDrawer(index)">
              <Icon icon="ant-design:edit-outlined" />
            </Button>
            <Button
              type="text"
              size="small"
              danger
              @click.stop="removeMapping(index)"
              :disabled="formState.length <= 1"
            >
              <Icon icon="ant-design:delete-outlined" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Mapping Drawer -->
    <DataMappingDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts" setup name="DataMapping">
  import { ref, watch, PropType } from 'vue';
  import { Button, Tag } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { useDrawer } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { MappingConfig, CONVERTER_TYPE, EXPRESSION_SOURCE_TYPE } from './type';
  import DataMappingDrawer from './DataMappingDrawer.vue';

  const props = defineProps({
    config: {
      type: Array as PropType<MappingConfig[]>,
      default: () => [],
    },
  });

  const createDefaultMapping = (): MappingConfig => ({
    topicFilter: 'sensor/data',
    subscriptionQos: 1,
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

  const formState = ref<MappingConfig[]>([]);
  const { t } = useI18n();

  const [registerDrawer, { openDrawer }] = useDrawer();

  watch(
    () => [props.config],
    () => {
      if (props.config && props.config.length > 0) {
        formState.value = cloneDeep(props.config);
      } else {
        formState.value = [createDefaultMapping()];
      }
    },
    { immediate: true, deep: true },
  );

  function getPayloadTypeColor(type: CONVERTER_TYPE) {
    const colors = {
      [CONVERTER_TYPE.JSON]: 'blue',
      [CONVERTER_TYPE.BYTES]: 'green',
      [CONVERTER_TYPE.CUSTOM]: 'purple',
    };
    return colors[type] || 'default';
  }

  function handleDrawer(index?: number) {
    if (typeof index === 'number') {
      openDrawer(true, {
        record: formState.value[index],
        index,
      });
    } else {
      openDrawer(true, {
        record: null,
        index: -1,
      });
    }
  }

  function handleSuccess({ record, index }) {
    if (index >= 0) {
      formState.value[index] = cloneDeep(record);
    } else {
      formState.value.push(cloneDeep(record));
    }
  }

  function removeMapping(index: number) {
    formState.value.splice(index, 1);
    if (formState.value.length === 0) {
      formState.value.push(createDefaultMapping());
    }
  }

  async function getConfiguration() {
    // 简单验证
    for (const mapping of formState.value) {
      if (!mapping.topicFilter) {
        throw new Error(t('tb.gateway.details.mqtt.dataMapping.topicFilterRequired'));
      }
    }

    return { configurationJson: { mapping: cloneDeep(formState.value) } };
  }

  defineExpose({ getConfiguration });
</script>

<style scoped>
  .flex-1 {
    flex: 1;
  }
</style>
