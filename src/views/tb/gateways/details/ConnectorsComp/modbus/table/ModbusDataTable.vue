<template>
  <div class="modbus-data-table">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <span class="text-lg font-medium">{{ tableConfig.title }}</span>
        <div class="flex items-center gap-2">
          <Tag v-for="(item, index) in displayTags" :key="index" :color="item.color">
            {{ item.label }}
          </Tag>
          <span v-if="data.length > 4" class="text-sm text-gray-500">+ {{ data.length - 4 }} more</span>
        </div>
      </div>
      <Button type="primary" @click="handleAdd" size="small">
        <template #icon>
          <Icon icon="ant-design:plus-outlined" />
        </template>
        {{ tableConfig.addButtonText }}
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      size="small"
      :scroll="{ x: scrollX }"
      row-key="tag"
    >
      <template #bodyCell="{ column, record, index }: { column: any; record: any; index: number }">
        <template v-if="column.key === 'tag'">
          <Input
            v-model:value="record.tag"
            size="small"
            class="w-full"
            :status="!record.tag?.trim() ? 'error' : ''"
            :placeholder="t('tb.gateway.details.table.tagPlaceholder')"
            @pressEnter="handleSaveRecord(record)"
            @blur="handleSaveRecord(record)"
          />
        </template>

        <template v-else-if="column.key === 'type'">
          <Select
            v-model:value="record.type"
            :options="DATA_TYPE_OPTIONS"
            size="small"
            class="w-full"
            @change="handleTypeChange(record)"
          />
        </template>

        <template v-else-if="column.key === 'functionCode'">
          <Select
            v-model:value="record.functionCode"
            :options="getFunctionCodeOptions(record.type)"
            size="small"
            class="w-full"
            @change="handleSaveRecord(record)"
          />
        </template>

        <template v-else-if="column.key === 'objectsCount'">
          <InputNumber
            v-model:value="record.objectsCount"
            :min="1"
            size="small"
            @pressEnter="handleSaveRecord(record)"
            @blur="handleSaveRecord(record)"
            class="!w-full"
          />
        </template>

        <template v-else-if="column.key === 'bitTargetType'">
          <Select
            v-if="record.type === 'bits'"
            v-model:value="record.bitTargetType"
            :options="BIT_TARGET_TYPE_OPTIONS"
            size="small"
            class="w-full"
            @change="handleSaveRecord(record)"
            placeholder="Integer"
          />
          <span v-else class="text-gray-400">-</span>
        </template>

        <template v-else-if="column.key === 'bit'">
          <InputNumber
            v-if="record.type === 'bits'"
            v-model:value="record.bit"
            :min="1"
            size="small"
            @pressEnter="handleSaveRecord(record)"
            @blur="handleSaveRecord(record)"
            class="!w-full"
          />
          <span v-else class="text-gray-400">-</span>
        </template>

        <template v-else-if="column.key === 'address'">
          <Input
            v-model:value="record.address"
            size="small"
            :placeholder="t('tb.gateway.details.table.addressPlaceholder')"
            class="w-full"
            :status="!record.address?.toString().trim() ? 'error' : ''"
            @pressEnter="handleSaveRecord(record)"
            @blur="handleSaveRecord(record)"
          />
        </template>

        <template v-else-if="column.key === 'modifier'">
          <div v-if="isIntegerType(record.type)" class="text-xs w-full">
            <div v-if="record.divider">
              <Tag color="orange" size="small">{{ t('tb.gateway.details.table.divider') }}</Tag>
              <span class="ml-1">{{ record.divider }}</span>
            </div>
            <div v-else-if="record.multiplier">
              <Tag color="blue" size="small">{{ t('tb.gateway.details.table.multiplier') }}</Tag>
              <span class="ml-1">{{ record.multiplier }}</span>
            </div>
            <span v-else class="text-gray-400">-</span>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template v-else-if="column.key === 'reportStrategy'">
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

        <template v-else-if="column.key === 'value'">
          <Input
            v-model:value="record.value"
            size="small"
            :placeholder="t('tb.gateway.details.table.valuePlaceholder')"
            class="w-full"
            @pressEnter="handleSaveRecord(record)"
            @blur="handleSaveRecord(record)"
          />
        </template>

        <template v-else-if="column.key === 'action'">
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

    <!-- 高级配置模态框 -->
    <AttributeConfigModal v-if="showAdvancedConfig" @register="registerAdvancedModal" @success="handleAdvancedSave" />
  </div>
</template>

<script lang="ts" setup name="ModbusDataTable">
  import { ref, PropType, computed } from 'vue';
  import { Table, Button, Tag, Input, InputNumber, Select, Modal, message } from 'ant-design-vue';

  import { Icon } from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import AttributeConfigModal from './AttributeConfigModal.vue';

  import {
    ModbusAttribute,
    DATA_TYPE,
    DATA_TYPE_OPTIONS,
    FUNCTION_CODE_OPTIONS,
    isIntegerType,
    COLOR_MAP,
    BIT_TARGET_TYPE,
    TABLE_TYPE,
    BIT_TARGET_TYPE_OPTIONS,
  } from '../type';

  type TableModel = 'slave' | 'server';

  export interface TableConfig {
    title: string;
    addButtonText: string;
    model?: TableModel;
    showExtendedColumns?: boolean;
    showAdvancedConfig?: boolean;
    showFunctionCode?: boolean;
    showBitColumns?: boolean;
    showValueColumn?: boolean;
    defaultData: Partial<ModbusAttribute>;
  }

  const props = defineProps({
    data: {
      type: Array as PropType<ModbusAttribute[]>,
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

  const [registerAdvancedModal, { openModal: openAdvancedModal }] = useModal();

  // 计算显示的标签
  const displayTags = computed(() => {
    return props.data.slice(0, 4).map((item) => ({
      label: item.tag,
      color: getTypeColor(item.type),
    }));
  });

  // 定义不同模型的默认配置
  const modelConfigs = {
    slave: {
      showExtendedColumns: true,
      showAdvancedConfig: true,
      showFunctionCode: true,
      showBitColumns: true,
      showValueColumn: false,
    },
    server: {
      showExtendedColumns: false,
      showAdvancedConfig: false,
      showFunctionCode: props.type === TABLE_TYPE.ATTRIBUTE_UPDATES || props.type === TABLE_TYPE.RPC,
      showBitColumns: false,
      showValueColumn: true,
    },
  };

  // 计算最终配置
  const finalConfig = computed(() => {
    const model = props.tableConfig.model || 'slave';
    const defaultConfig = modelConfigs[model];

    return {
      showExtendedColumns: props.tableConfig.showExtendedColumns ?? defaultConfig.showExtendedColumns,
      showAdvancedConfig: props.tableConfig.showAdvancedConfig ?? defaultConfig.showAdvancedConfig,
      showFunctionCode: props.tableConfig.showFunctionCode ?? defaultConfig.showFunctionCode,
      showBitColumns: props.tableConfig.showBitColumns ?? defaultConfig.showBitColumns,
      showValueColumn: props.tableConfig.showValueColumn ?? defaultConfig.showValueColumn,
    };
  });

  // 计算是否显示高级配置
  const showAdvancedConfig = computed(() => finalConfig.value.showAdvancedConfig);

  // 计算滚动宽度
  const scrollX = computed(() => {
    let width = 600; // 基础宽度
    if (finalConfig.value.showExtendedColumns) width += 260; // Modifier + Report Strategy
    if (finalConfig.value.showBitColumns && props.data.some((item) => item.type === DATA_TYPE.BITS)) width += 210; // bit 相关列
    if (finalConfig.value.showValueColumn) width += 100; // value 列
    return width;
  });

  // 根据类型和模式获取功能码选项
  const getFunctionCodeOptions = (type: DATA_TYPE) => {
    let availableCodes: number[] = [];

    // 根据模式和数据类型确定可用的功能码
    if ([TABLE_TYPE.ATTRIBUTES, TABLE_TYPE.TIMESERIES].includes(props.type)) {
      // attributes 和 timeseries 模式
      if (type === DATA_TYPE.BITS) {
        availableCodes = [1, 2, 3, 4]; // bits 类型：1,2,3,4
      } else {
        availableCodes = [3, 4]; // 其他类型：3,4
      }
    } else if (props.type === TABLE_TYPE.ATTRIBUTE_UPDATES) {
      // attributeUpdates 模式
      if (type === DATA_TYPE.BITS) {
        availableCodes = [5, 6, 15, 16]; // bits 类型：5,6,15,16
      } else {
        availableCodes = [6, 16]; // 其他类型：6,16
      }
    } else if (props.type === TABLE_TYPE.RPC) {
      // rpc 模式
      if (type === DATA_TYPE.BITS) {
        availableCodes = [1, 2, 3, 4, 5, 6, 15, 16]; // bits 类型：1,2,3,4,5,6,15,16
      } else {
        availableCodes = [3, 4, 6, 16]; // 其他类型：3,4,6,16
      }
    }

    // 返回过滤后的选项
    return FUNCTION_CODE_OPTIONS.filter((option) => availableCodes.includes(option.value));
  };

  // 根据数据类型动态生成列配置
  const columns = computed(() => {
    const baseColumns = [
      {
        title: t('tb.gateway.details.table.tag'),
        dataIndex: 'tag',
        key: 'tag',
        width: 150,
      },
      {
        title: t('tb.gateway.details.table.type'),
        dataIndex: 'type',
        key: 'type',
        width: 120,
      },
    ];

    // 根据配置决定是否显示 Function Code 列
    if (finalConfig.value.showFunctionCode) {
      baseColumns.push({
        title: t('tb.gateway.details.table.functionCode'),
        dataIndex: 'functionCode',
        key: 'functionCode',
        width: 150,
      });
    }

    // 添加其他基础列
    baseColumns.push({
      title: t('tb.gateway.details.table.objectsCount'),
      dataIndex: 'objectsCount',
      key: 'objectsCount',
      width: 80,
    });

    // 根据配置决定是否显示 Bit 相关列
    if (finalConfig.value.showBitColumns) {
      baseColumns.push(
        {
          title: t('tb.gateway.details.table.bitTargetType'),
          dataIndex: 'bitTargetType',
          key: 'bitTargetType',
          width: 80,
        },
        {
          title: t('tb.gateway.details.table.bit'),
          dataIndex: 'bit',
          key: 'bit',
          width: 80,
        },
      );
    }

    // 添加 Address 列
    baseColumns.push({
      title: t('tb.gateway.details.table.address'),
      dataIndex: 'address',
      key: 'address',
      width: 50,
    });

    // 根据配置决定是否显示 Value 列
    if (finalConfig.value.showValueColumn) {
      baseColumns.push({
        title: t('tb.gateway.details.table.value'),
        dataIndex: 'value',
        key: 'value',
        width: 100,
      });
    }

    // 添加扩展列（Modifier 和 Report Strategy）
    if (finalConfig.value.showExtendedColumns) {
      baseColumns.push({
        title: t('tb.gateway.details.table.modifier'),
        dataIndex: 'modifier',
        key: 'modifier',
        width: 80,
      });

      baseColumns.push({
        title: t('tb.gateway.details.table.reportStrategy'),
        dataIndex: 'reportStrategy',
        key: 'reportStrategy',
        width: 80,
      });
    }

    // 添加操作列
    baseColumns.push({
      title: t('tb.gateway.details.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: showAdvancedConfig.value ? 80 : 50,
    });

    return baseColumns;
  });

  function getTypeColor(type: DATA_TYPE) {
    return COLOR_MAP[type] || 'default';
  }

  function handleAdd() {
    const newAttribute: ModbusAttribute = {
      tag: `${props.type}_${Date.now()}`,
      type: DATA_TYPE.STRING,
      functionCode: 3,
      objectsCount: 1,
      address: '',
      bitTargetType: BIT_TARGET_TYPE.INTEGER, // 默认选中 integer
      value: '', // 默认值为空字符串
      ...props.tableConfig.defaultData,
    };

    const newData = [...props.data, newAttribute];
    emit('update:data', newData);
  }

  // 校验记录是否合法
  function validateRecord(record: ModbusAttribute): boolean {
    // 校验 tag 不能为空
    if (!record.tag?.trim()) {
      message.error(t('tb.gateway.details.table.tagRequired'));
      return false;
    }

    // 校验 address 不能为空
    if (!record.address?.toString().trim()) {
      message.error(t('tb.gateway.details.table.addressRequired'));
      return false;
    }

    return true;
  }

  function handleTypeChange(record: ModbusAttribute) {
    // 当类型切换为 bits 时，自动设置 bitTargetType 为 integer
    if (record.type === DATA_TYPE.BITS && !record.bitTargetType) {
      record.bitTargetType = BIT_TARGET_TYPE.INTEGER;
    }
    handleSaveRecord(record);
  }

  function handleSaveRecord(record: ModbusAttribute) {
    // 先进行校验
    if (!validateRecord(record)) {
      return;
    }

    const newData = [...props.data];
    const index = newData.findIndex((item) => item.tag === record.tag);
    if (index > -1) {
      newData[index] = { ...record };
      emit('update:data', newData);
    }
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

  function handleAdvancedConfig(record: ModbusAttribute) {
    openAdvancedModal(true, record);
  }

  function handleAdvancedSave(updatedRecord: ModbusAttribute) {
    handleSaveRecord(updatedRecord);
  }
</script>

<style scoped>
  .modbus-data-table {
    padding: 16px;
  }
</style>
