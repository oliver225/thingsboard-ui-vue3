<template>
  <div class="opcua-data-table">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <span class="text-lg font-medium">{{ tableConfig.title }}</span>
        <div class="flex items-center gap-2">
          <Tag v-for="(item, index) in displayTags" :key="index" color="blue">
            {{ item }}
          </Tag>
          <span v-if="data.length > 5" class="text-sm text-gray-500">+ {{ data.length - 5 }} more</span>
        </div>
      </div>
      <Button type="primary" @click="handleAdd" size="small">
        <template #icon>
          <Icon icon="ant-design:plus-outlined" />
        </template>
        {{ tableConfig.addButtonText }}
      </Button>
    </div>

    <Table :columns="columns" :data-source="data" :pagination="false" size="small" :scroll="{ x: scrollX }">
      <template #bodyCell="{ column, record, index }: { column: any; record: any; index: number }">
        <!-- Attributes & Timeseries & Attribute Updates - 统一结构: key, type, value -->
        <template
          v-if="
            type === TABLE_TYPE.ATTRIBUTES || type === TABLE_TYPE.TIMESERIES || type === TABLE_TYPE.ATTRIBUTE_UPDATES
          "
        >
          <template v-if="column.key === 'key'">
            <Input
              v-model:value="record.key"
              size="small"
              class="w-full"
              :status="!record.key?.trim() ? 'error' : ''"
              :placeholder="t('tb.gateway.details.opcua.table.keyPlaceholder')"
              @blur="handleSaveRecord(record)"
            />
          </template>
          <template v-else-if="column.key === 'type'">
            <Select
              v-model:value="record.type"
              :options="DEVICE_INFO_SOURCE_OPTIONS"
              size="small"
              class="w-full"
              @change="handleSaveRecord(record)"
            />
          </template>
          <template v-else-if="column.key === 'value'">
            <Input
              v-model:value="record.value"
              size="small"
              class="w-full"
              :status="!record.value?.trim() ? 'error' : ''"
              :placeholder="t('tb.gateway.details.opcua.table.valuePlaceholder')"
              @blur="handleSaveRecord(record)"
            />
          </template>
        </template>

        <!-- RPC Methods -->
        <template v-else-if="type === TABLE_TYPE.RPC">
          <template v-if="column.key === 'method'">
            <Input
              v-model:value="record.method"
              size="small"
              class="w-full"
              :status="!record.method?.trim() ? 'error' : ''"
              :placeholder="t('tb.gateway.details.opcua.table.methodPlaceholder')"
              @blur="handleSaveRecord(record)"
            />
          </template>
          <template v-else-if="column.key === 'arguments'">
            <div class="flex items-center gap-2">
              <Tag v-for="(arg, idx) in record.arguments" :key="idx" color="purple">
                {{ arg.type }}: {{ arg.value }}
              </Tag>
              <Button type="link" size="small" @click="handleEditArguments(record, index)">
                <template #icon>
                  <Icon icon="ant-design:edit-outlined" />
                </template>
              </Button>
            </div>
          </template>
        </template>

        <!-- Report Strategy column -->
        <template v-if="column.key === 'reportStrategy'">
          <div class="text-xs">
            <div v-if="record.reportStrategy">
              <Tag color="green" size="small">{{ record.reportStrategy.type }}</Tag>
              <div v-if="record.reportStrategy.reportPeriod" class="text-gray-500 mt-1">
                {{ record.reportStrategy.reportPeriod }}ms
              </div>
            </div>
            <span v-else class="text-gray-400">-</span>
          </div>
        </template>

        <!-- Action column -->
        <template v-if="column.key === 'action'">
          <div class="flex items-center gap-1">
            <Button type="text" size="small" danger @click="handleDelete(index)">
              <template #icon>
                <Icon icon="ant-design:delete-outlined" />
              </template>
            </Button>
            <Button v-if="showAdvancedConfig" type="text" size="small" @click="handleAdvancedConfig(record)">
              <template #icon>
                <Icon icon="ant-design:setting-outlined" />
              </template>
            </Button>
          </div>
        </template>
      </template>
    </Table>

    <!-- Arguments 编辑模态框 -->
    <Modal
      v-model:open="argumentsModalVisible"
      :title="t('tb.gateway.details.opcua.table.editArguments')"
      @ok="handleSaveArguments"
      @cancel="argumentsModalVisible = false"
    >
      <div class="space-y-2">
        <div v-for="(arg, idx) in editingArguments" :key="idx" class="flex gap-2">
          <Select v-model:value="arg.type" style="width: 120px" :placeholder="t('tb.gateway.details.opcua.table.type')">
            <SelectOption value="integer">Integer</SelectOption>
            <SelectOption value="double">Double</SelectOption>
            <SelectOption value="string">String</SelectOption>
            <SelectOption value="boolean">Boolean</SelectOption>
          </Select>
          <Input v-model:value="arg.value" :placeholder="t('tb.gateway.details.opcua.table.value')" class="flex-1" />
          <Button type="text" danger size="small" @click="removeArgument(idx)">
            <Icon icon="ant-design:delete-outlined" />
          </Button>
        </div>
        <Button type="dashed" block @click="addArgument">
          <template #icon>
            <Icon icon="ant-design:plus-outlined" />
          </template>
          {{ t('tb.gateway.details.opcua.table.addArgument') }}
        </Button>
      </div>
    </Modal>

    <!-- 高级配置模态框 -->
    <AttributeConfigModal v-if="showAdvancedConfig" @register="registerAdvancedModal" @success="handleAdvancedSave" />
  </div>
</template>

<script lang="ts" setup name="OpcuaDataTable">
  import { ref, PropType, computed } from 'vue';
  import { Table, Button, Tag, Input, Modal, Select, SelectOption } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';

  import {
    TABLE_TYPE,
    AttributeMapping,
    AttributeUpdateMapping,
    RpcMethodMapping,
    DEVICE_INFO_SOURCE_OPTIONS,
  } from '../type';
  import AttributeConfigModal from './AttributeConfigModal.vue';

  export interface TableConfig {
    title: string;
    addButtonText: string;
    defaultData: any;
    showAdvancedConfig?: boolean;
  }

  const props = defineProps({
    data: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    type: {
      type: String as PropType<TABLE_TYPE>,
      required: true,
    },
    tableConfig: {
      type: Object as PropType<TableConfig>,
      required: true,
    },
  });

  const emit = defineEmits(['update:data']);
  const { t } = useI18n();
  const { showMessage } = useMessage();

  const [registerAdvancedModal, { openModal: openAdvancedModal }] = useModal();

  const argumentsModalVisible = ref(false);
  const editingArguments = ref<Array<{ type: string; value: any }>>([]);
  const editingRecordIndex = ref(-1);

  // 计算是否显示高级配置
  const showAdvancedConfig = computed(() => {
    return (
      props.tableConfig.showAdvancedConfig &&
      (props.type === TABLE_TYPE.ATTRIBUTES || props.type === TABLE_TYPE.TIMESERIES)
    );
  });

  // 计算 columns
  const columns = computed(() => {
    if (
      props.type === TABLE_TYPE.ATTRIBUTES ||
      props.type === TABLE_TYPE.TIMESERIES ||
      props.type === TABLE_TYPE.ATTRIBUTE_UPDATES
    ) {
      const cols = [
        { title: t('tb.gateway.details.opcua.table.key'), key: 'key', dataIndex: 'key', width: '25%' },
        { title: t('tb.gateway.details.opcua.table.type'), key: 'type', dataIndex: 'type', width: '12%' },
        { title: t('tb.gateway.details.opcua.table.value'), key: 'value', dataIndex: 'value', width: '35%' },
      ];

      // 只为 Attributes 和 Timeseries 添加 Report Strategy 列
      if (showAdvancedConfig.value) {
        cols.push({
          title: t('tb.gateway.details.opcua.table.reportStrategy'),
          key: 'reportStrategy',
          dataIndex: 'reportStrategy',
          width: '15%',
        });
      }

      cols.push({
        title: t('tb.gateway.details.opcua.table.action'),
        key: 'action',
        dataIndex: 'action',
        width: showAdvancedConfig.value ? '13%' : '10%',
      });

      return cols;
    } else if (props.type === TABLE_TYPE.RPC) {
      return [
        { title: t('tb.gateway.details.opcua.table.method'), key: 'method', dataIndex: 'method', width: '30%' },
        {
          title: t('tb.gateway.details.opcua.table.arguments'),
          key: 'arguments',
          dataIndex: 'arguments',
          width: '60%',
        },
        { title: t('tb.gateway.details.opcua.table.action'), key: 'action', width: '10%' },
      ];
    }
    return [];
  });

  const scrollX = computed(() => {
    return columns.value.length * 150;
  });

  // 显示标签（前5个）
  const displayTags = computed(() => {
    if (
      props.type === TABLE_TYPE.ATTRIBUTES ||
      props.type === TABLE_TYPE.TIMESERIES ||
      props.type === TABLE_TYPE.ATTRIBUTE_UPDATES
    ) {
      return props.data.slice(0, 5).map((item: AttributeMapping) => item.key);
    } else if (props.type === TABLE_TYPE.RPC) {
      return props.data.slice(0, 5).map((item: RpcMethodMapping) => item.method);
    }
    return [];
  });

  function handleAdd() {
    const newData = cloneDeep(props.tableConfig.defaultData);
    emit('update:data', [...props.data, newData]);
  }

  function handleDelete(index: number) {
    Modal.confirm({
      title: t('tb.gateway.details.table.confirmDelete'),
      content: t('tb.gateway.details.table.deleteConfirmContent', { title: props.tableConfig.title }),
      okText: t('tb.gateway.details.table.confirm'),
      cancelText: t('tb.gateway.details.table.cancel'),
      onOk() {
        const newData = [...props.data];
        newData.splice(index, 1);
        emit('update:data', newData);
      },
    });
  }

  function handleSaveRecord(record: any) {
    // 验证必填字段
    if (
      props.type === TABLE_TYPE.ATTRIBUTES ||
      props.type === TABLE_TYPE.TIMESERIES ||
      props.type === TABLE_TYPE.ATTRIBUTE_UPDATES
    ) {
      if (!record.key?.trim() || !record.value?.trim()) {
        showMessage(t('tb.gateway.details.opcua.table.requiredFieldsError'), 'error');
        return;
      }
    } else if (props.type === TABLE_TYPE.RPC) {
      if (!record.method?.trim()) {
        showMessage(t('tb.gateway.details.opcua.table.requiredFieldsError'), 'error');
        return;
      }
    }

    // 查找并更新记录
    const newData = [...props.data];
    const index = newData.findIndex((item: any) => {
      if (
        props.type === TABLE_TYPE.ATTRIBUTES ||
        props.type === TABLE_TYPE.TIMESERIES ||
        props.type === TABLE_TYPE.ATTRIBUTE_UPDATES
      ) {
        return item.key === record.key;
      } else if (props.type === TABLE_TYPE.RPC) {
        return item.method === record.method;
      }
      return false;
    });

    if (index > -1) {
      newData[index] = { ...record };
    }

    // 触发数据更新
    emit('update:data', newData);
  }

  function handleEditArguments(record: RpcMethodMapping, index: number) {
    editingArguments.value = cloneDeep(record.arguments || []);
    editingRecordIndex.value = index;
    argumentsModalVisible.value = true;
  }

  function addArgument() {
    editingArguments.value.push({
      type: 'integer',
      value: 0,
    });
  }

  function removeArgument(idx: number) {
    editingArguments.value.splice(idx, 1);
  }

  function handleSaveArguments() {
    const newData = [...props.data];
    newData[editingRecordIndex.value].arguments = cloneDeep(editingArguments.value);
    emit('update:data', newData);
    argumentsModalVisible.value = false;
  }

  function handleAdvancedConfig(record: AttributeMapping) {
    openAdvancedModal(true, record);
  }

  function handleAdvancedSave(updatedRecord: AttributeMapping) {
    handleSaveRecord(updatedRecord);
  }
</script>

<style scoped>
  .opcua-data-table {
    padding: 0;
  }

  :deep(.ant-table-small) .ant-table-tbody > tr > td {
    padding: 4px 8px;
  }
</style>
