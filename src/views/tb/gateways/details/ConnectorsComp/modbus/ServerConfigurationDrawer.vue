<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="register"
    width="80%"
    :destroyOnClose="true"
    @ok="handleSave"
    @close="handleClose"
  >
    <template #title>
      <div class="flex items-center space-x-4">
        <div class="flex flex-col">
          <span class="text-base font-semibold"> {{ t('tb.gateway.details.modbus.valuesDrawer.title') }} </span>
        </div>
      </div>
    </template>

    <template #prependContent>
      <Tabs v-model:active-key="currentType" class="tb-detail-menu">
        <TabPane v-for="type in valueTypes" :key="type.key">
          <template #tab>
            <div class="flex items-center gap-2">
              <span class="menu-text">{{ type.label }}</span>
              <span class="menu-badge" v-if="getTotalCount(type.key) > 0">{{ getTotalCount(type.key) }}</span>
            </div>
          </template>
        </TabPane>
      </Tabs>
    </template>

    <div class="values-content">
      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="content-header">
          <h3 class="content-title">{{ getCurrentTypeLabel() }}</h3>
          <div class="content-description">
            {{ t('tb.gateway.details.modbus.valuesDrawer.configureMapping', { type: getCurrentTypeLabel() }) }}
          </div>
        </div>

        <div class="content-tabs">
          <Tabs v-model:activeKey="currentTab" class="custom-tabs">
            <TabPane key="attributes" :tab="t('tb.gateway.details.modbus.valuesDrawer.attributeData')">
              <div class="tab-content">
                <AttributesTable
                  v-model:data="convertedData[currentType].attributes"
                  :key="`${currentType}-attributes`"
                  model="server"
                  @update:data="handleDataUpdate('attributes', $event)"
                />
              </div>
            </TabPane>

            <TabPane key="timeseries" :tab="t('tb.gateway.details.modbus.valuesDrawer.timeSeriesData')">
              <div class="tab-content">
                <TimeseriesTable
                  v-model:data="convertedData[currentType].timeseries"
                  :key="`${currentType}-timeseries`"
                  model="server"
                  @update:data="handleDataUpdate('timeseries', $event)"
                />
              </div>
            </TabPane>

            <TabPane key="attributeUpdates" :tab="t('tb.gateway.details.modbus.valuesDrawer.attributeUpdates')">
              <div class="tab-content">
                <AttributeUpdatesTable
                  v-model:data="convertedData[currentType].attributeUpdates"
                  :key="`${currentType}-attributeUpdates`"
                  model="server"
                  @update:data="handleDataUpdate('attributeUpdates', $event)"
                />
              </div>
            </TabPane>

            <TabPane key="rpc" :tab="t('tb.gateway.details.modbus.valuesDrawer.rpcRequests')">
              <div class="tab-content">
                <RpcTable
                  v-model:data="convertedData[currentType].rpc"
                  :key="`${currentType}-rpc`"
                  model="server"
                  @update:data="handleDataUpdate('rpc', $event)"
                />
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup name="ValuesDrawer">
  import { ref, computed } from 'vue';
  import { Button, Tabs } from 'ant-design-vue';
  const { TabPane } = Tabs;
  import { cloneDeep } from 'lodash-es';

  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { useI18n } from '/@/hooks/web/useI18n';

  import AttributesTable from './table/AttributesTable.vue';
  import TimeseriesTable from './table/TimeseriesTable.vue';
  import AttributeUpdatesTable from './table/AttributeUpdatesTable.vue';
  import RpcTable from './table/RpcTable.vue';

  import { ModbusServerValue, ModbusAttribute } from './type';

  interface ValuesData {
    holding_registers: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
    coils_initializer: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
    input_registers: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
    discrete_inputs: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
  }

  const emit = defineEmits(['save', 'register']);
  const { t } = useI18n();

  const [register, { closeDrawer }] = useDrawerInner((data) => {
    initializeData(data?.values);
  });

  const currentType = ref<keyof ValuesData>('holding_registers');
  const currentTab = ref('attributes');

  const valueTypes = [
    { key: 'holding_registers' as const, label: t('tb.gateway.details.modbus.valuesDrawer.holdingRegisters') },
    { key: 'coils_initializer' as const, label: t('tb.gateway.details.modbus.valuesDrawer.coilsInitializer') },
    { key: 'input_registers' as const, label: t('tb.gateway.details.modbus.valuesDrawer.inputRegisters') },
    { key: 'discrete_inputs' as const, label: t('tb.gateway.details.modbus.valuesDrawer.discreteInputs') },
  ];

  const defaultValues: ValuesData = {
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
  };

  const valuesData = ref<ValuesData>(cloneDeep(defaultValues));

  // 转换函数：将 ModbusServerValue 转换为 ModbusAttribute
  function convertServerValueToAttribute(serverValue: ModbusServerValue): ModbusAttribute {
    return {
      tag: serverValue.tag,
      type: serverValue.type,
      functionCode: serverValue.functionCode || 3,
      objectsCount: serverValue.objectsCount,
      address: serverValue.address,
      value: serverValue.value,
    };
  }

  // 转换函数：将 ModbusAttribute 转换为 ModbusServerValue
  function convertAttributeToServerValue(attribute: ModbusAttribute): ModbusServerValue {
    return {
      address: typeof attribute.address === 'string' ? parseInt(attribute.address) : attribute.address,
      type: attribute.type,
      tag: attribute.tag,
      objectsCount: attribute.objectsCount,
      value: attribute.value || '',
      functionCode: attribute.functionCode,
    };
  }

  // 为表格组件转换数据
  const convertedData = computed(() => {
    const result: Record<
      keyof ValuesData,
      {
        attributes: ModbusAttribute[];
        timeseries: ModbusAttribute[];
        attributeUpdates: ModbusAttribute[];
        rpc: ModbusAttribute[];
      }
    > = {} as any;

    Object.keys(valuesData.value).forEach((key) => {
      const typeKey = key as keyof ValuesData;
      result[typeKey] = {
        attributes: valuesData.value[typeKey].attributes.map(convertServerValueToAttribute),
        timeseries: valuesData.value[typeKey].timeseries.map(convertServerValueToAttribute),
        attributeUpdates: valuesData.value[typeKey].attributeUpdates.map(convertServerValueToAttribute),
        rpc: valuesData.value[typeKey].rpc.map(convertServerValueToAttribute),
      };
    });

    return result;
  });

  // 处理表格数据更新
  function handleDataUpdate(
    dataType: 'attributes' | 'timeseries' | 'attributeUpdates' | 'rpc',
    data: ModbusAttribute[],
  ) {
    valuesData.value[currentType.value][dataType] = data.map(convertAttributeToServerValue);
  }

  function initializeData(values?: Partial<ValuesData>) {
    valuesData.value = cloneDeep(defaultValues);
    if (values && Object.keys(values).length > 0) {
      // 合并传入的数据
      Object.keys(values).forEach((key) => {
        if (valuesData.value[key as keyof ValuesData]) {
          valuesData.value[key as keyof ValuesData] = {
            ...valuesData.value[key as keyof ValuesData],
            ...values[key as keyof ValuesData],
          };
        }
      });
    }
  }

  function handleSave() {
    emit('save', cloneDeep(valuesData.value));
    closeDrawer();
  }

  function handleClose() {
    closeDrawer();
  }

  // 获取当前类型的总数量
  function getTotalCount(typeKey: keyof ValuesData): number {
    const data = valuesData.value[typeKey];
    return data.attributes.length + data.timeseries.length + data.attributeUpdates.length + data.rpc.length;
  }

  // 获取当前选中类型的标签
  function getCurrentTypeLabel(): string {
    return valueTypes.find((type) => type.key === currentType.value)?.label || '';
  }
</script>

<style scoped>
  ::v-deep(.ant-drawer-body) {
    margin: 0;
  }

  .values-content {
    display: flex;
    height: calc(100vh - 120px);
    background: #fafafa;
  }

  /* 侧边栏样式 */
  .sidebar {
    width: 220px;
    background: #ffffff;
    border-right: 1px solid #e8e8e8;
    display: flex;
    flex-direction: column;
  }

  .sidebar-header {
    padding: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .sidebar-title {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    line-height: 1.5;
  }

  .sidebar-menu {
    flex: 1;
    padding: 8px 0;
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin: 2px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .menu-item:hover {
    background: #f5f5f5;
    border-color: #e8e8e8;
  }

  .menu-item.active {
    background: #e6f7ff;
    border-color: #91d5ff;
    color: #1890ff;
  }

  .menu-text {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
  }

  .menu-badge {
    background: #ff7875;
    color: #ffffff;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    line-height: 1.2;
  }

  .menu-item.active .menu-badge {
    background: #1890ff;
  }

  /* 主内容区域 */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    margin-left: 0;
  }

  .content-header {
    padding: 0;
    /* border-bottom: 1px solid #f0f0f0; */
    background: #ffffff;
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .content-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #262626;
    line-height: 1.4;
  }

  .content-description {
    font-size: 13px;
    color: #8c8c8c;
    line-height: 1.5;
  }

  .content-tabs {
    flex: 1;
    padding: 0;
    margin-top: 16px;
    overflow: hidden;
  }

  .custom-tabs {
    height: 100%;
  }

  .tab-content {
    height: calc(100vh - 240px);
    overflow: hidden;
  }

  /* 自定义tabs样式 */
  :deep(.ant-tabs-nav) {
    margin-bottom: 16px;
    background: #fafafa;
    border-radius: 6px;
    padding: 4px;
  }

  :deep(.ant-tabs-tab) {
    border-radius: 4px !important;
    border: none !important;
    margin: 0 2px !important;
    padding: 8px 16px !important;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  :deep(.ant-tabs-tab:hover) {
    background: #f0f0f0;
    color: #1890ff;
  }

  :deep(.ant-tabs-tab-active) {
    background: #ffffff !important;
    color: #1890ff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  :deep(.ant-tabs-ink-bar) {
    display: none;
  }

  :deep(.ant-tabs-content-holder) {
    height: calc(100% - 48px);
    overflow: hidden;
  }

  :deep(.ant-tabs-content) {
    height: 100%;
  }

  :deep(.ant-tabs-tabpane) {
    height: 100%;
    overflow: auto;
  }

  /* 响应式设计 */
  @media (max-width: 1024px) {
    .values-content {
      flex-direction: column;
      height: auto;
    }

    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e8e8e8;
    }

    .sidebar-menu {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 16px;
    }

    .menu-item {
      flex: 1;
      min-width: 120px;
      margin: 0;
      text-align: center;
    }

    .main-content {
      margin-left: 0;
    }

    .tab-content {
      height: 500px;
    }
  }

  @media (max-width: 768px) {
    .content-header {
      padding: 16px;
    }

    .content-tabs {
      padding: 0 16px;
    }

    .sidebar-menu {
      flex-direction: column;
    }

    .menu-item {
      min-width: auto;
    }
  }
</style>
