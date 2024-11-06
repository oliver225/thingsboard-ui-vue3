<template>
  <div class="telemetry-index">
    <TableHeader>
      <template #headerTop>
        <div class="flex">
          <div class="flex-1">
            <Segmented v-model:value="selectedScope" :options="typeTabList" @change="handleScopeChange" />
          </div>
          <Space :size="1" class="mx-4">
            <Tooltip title="添加属性" v-if="selectedScope != Scope.CLIENT_SCOPE">
              <Icon icon="ant-design:plus-outlined" :size="20" class="cursor-pointer" @click="handledAttributeForm({})" />
            </Tooltip>
            <Tooltip title="刷新数据" v-if="selectedScope != LATEST_TELEMETRY">
              <Icon icon="ant-design:redo-outlined" :size="20" class="cursor-pointer" @click="fetchAttributes" />
            </Tooltip>
            <Tooltip title="查询名称">
              <Icon icon="ant-design:search-outlined" :size="20" class="cursor-pointer" />
            </Tooltip>
            <Tooltip title="查看图表" v-if="selectedScope == LATEST_TELEMETRY && showChartView == false">
              <Icon icon="ant-design:line-chart-outlined" :size="20" class="cursor-pointer"
                @click="() => { showChartView = true }" />
            </Tooltip>
            <Tooltip title="查看表格" v-if="selectedScope == LATEST_TELEMETRY && showChartView == true">
              <Icon icon="ant-design:insert-row-below-outlined" :size="20" class="cursor-pointer"
                @click="() => { showChartView = false }" />
            </Tooltip>
            <template #split>
              <Divider type="vertical" />
            </template>
          </Space>
        </div>
      </template>
    </TableHeader>
    <BasicTable @register="registerTable" :loading="loading" :dataSource="dataSource" v-show="!showChartView">
      <template #valueColumn="{ record }">
        {{ formatValue(record.value) }}
      </template>
    </BasicTable>
    <List v-if="showChartView" :loading="loading" :dataSource="dataSource"
      :grid="{ gutter: 5, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }">
      <template #renderItem="{ item }">
        <List.Item v-bind:style="{ padding: '6px' }">
          <TimeseriesChart :keyStr="item.key" :entityType="props.entityType" :entityId="props.entityId"
            :kvEntity="item" />
        </List.Item>
      </template>
    </List>
    <AttributeModal @register="registerAttributeModal" @success="handleSuccess" />
    <TimeseriesModal @register="registerTimeseriesModal" />
    <DeleteModal @register="registerDeleteModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
export default defineComponent({
  name: "Telemetry",
});
</script>
<script lang="ts" setup>
import { PropType, defineComponent, ref, onMounted, computed, reactive, onBeforeUnmount } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { Icon } from '/@/components/Icon';
import { Scope } from '/@/enums/telemetryEnum';
import { Authority } from '/@/enums/authorityEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { useUserStore } from '/@/store/modules/user';
import { useWebsocketStore } from '/@/store/modules/websocket';
import { useModal } from '/@/components/Modal';
import { Space, Divider, Tooltip, Segmented, List } from 'ant-design-vue';
import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
import { getAttributesByScope, deleteEntityAttributes, getLatestTimeseries } from '/@/api/tb/telemetry';
import TimeseriesChart from './timeseriesChart.vue';
import TimeseriesModal from './timeseriesModal.vue';
import { isString, isBoolean } from 'lodash';
import AttributeModal from './attributeFrom.vue';
import DeleteModal from './delete.vue';
const LATEST_TELEMETRY = "LATEST_TELEMETRY";

const userStore = useUserStore();

const { getAndIncrementCmdId, send: websocketSend, unsubscribe: websocketUnsubscribe } = useWebsocketStore();

const { t } = useI18n('tb');
const { createConfirm, showMessage } = useMessage();


const props = defineProps({
  entityType: {
    type: String as PropType<EntityType>,
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  }
});

const typeTabList = reactive([
  { value: LATEST_TELEMETRY, label: '遥测数据', className: 'segment-tab' },
  { value: Scope.CLIENT_SCOPE, label: '客户端属性', className: 'segment-tab' },
  { value: Scope.SERVER_SCOPE, label: '服务端属性', className: 'segment-tab' },
  { value: Scope.SHARED_SCOPE, label: '共享属性', className: 'segment-tab' },
]);
const selectedScope = ref(LATEST_TELEMETRY);

const loading = ref(false);
const dataSource = ref<any[]>([]);
const LATEST_TELEMETRY_CMD_ID = ref(0);
const ATTRIBUTE_CMD_ID = ref(0);

const showChartView = ref(false);

const entityId = computed(() => {
  return { entityType: props.entityType, id: props.entityId };
})

const tableColumns: BasicColumn[] = [
  {
    title: t('名称'),
    dataIndex: 'key',
    key: 'key',
    sorter: true,
    align: 'center',
  },
  {
    title: t('数值'),
    dataIndex: 'value',
    key: 'value',
    align: 'center',
    slot: 'valueColumn'
  },
  {
    title: t('最后更新时间'),
    dataIndex: 'lastUpdateTs',
    key: 'lastUpdateTs',
    format: 'date|YYYY-MM-DD HH:mm:ss',
    sorter: true,
    width: 200,
    align: 'center',
  },
]

const actionColumn: BasicColumn = {
  width: 100,
  actions: (record: Recordable) => [
    {
      icon: 'clarity:note-edit-line',
      title: t('编辑'),
      onClick: handledAttributeForm.bind(this, { ...record }),
      ifShow: selectedScope.value == Scope.SERVER_SCOPE || selectedScope.value == Scope.SHARED_SCOPE,
    },
    {
      icon: 'ant-design:line-chart-outlined',
      title: t('查看图表'),
      ifShow: selectedScope.value == LATEST_TELEMETRY,
      onClick: handleTimeseriesModal.bind(this, { ...record }),
    },
    {
      icon: 'ant-design:delete-outlined',
      color: 'error',
      title: t('删除'),
      ifShow: userStore.getAuthority == Authority.TENANT_ADMIN,
      onClick: handleDelete.bind(this, { ...record }),
    },
  ],
};

const [registerAttributeModal, { openModal: openAttributeModal }] = useModal();
const [registerTimeseriesModal, { openModal: openTimeseriesModal }] = useModal();
const [registerDeleteModal, { openModal: openDeleteModal }] = useModal();
const [registerTable, { setSelectedRowKeys }] = useTable({
  rowKey: 'key',
  columns: tableColumns,
  actionColumn: actionColumn,
  showTableSetting: false,
  useSearchForm: false,
  canResize: true,
});

onMounted(async () => {
  await handleScopeChange(selectedScope.value);
})

async function handleScopeChange(scope: string) {
  showChartView.value = false;
  setSelectedRowKeys([]);
  if (LATEST_TELEMETRY == scope) {
    await subLatestTimeseries();
  } else if (Scope.CLIENT_SCOPE == scope) {
    await subClientScopeAttribute();
  } else {
    await fetchAttributes();
  }
}

async function fetchAttributes() {
  try {
    loading.value = true;
    const dataList = await getAttributesByScope(entityId.value, selectedScope.value as Scope);
    dataSource.value = dataList.map(kvEntity => ({
      key: kvEntity.key,
      value: kvEntity.value,
      lastUpdateTs: kvEntity.lastUpdateTs
    }));
  } catch (error: any) {
    console.log('error', error);
  } finally {
    loading.value = false;
  }

}

function formatValue(value: any) {
  if (isString(value)) {
    return value
  } else if (isBoolean(value)) {
    return value + ''
  } else {
    return JSON.stringify(value);
  }
}

async function subClientScopeAttribute() {
  ATTRIBUTE_CMD_ID.value = getAndIncrementCmdId();
  const sendResult = await websocketSend(
    ATTRIBUTE_CMD_ID.value,
    { attrSubCmds: [{ cmdId: ATTRIBUTE_CMD_ID.value, entityId: props.entityId, entityType: props.entityType, scope: 'CLIENT_SCOPE' }] },
    onWebsocketMessage
  );
  if (sendResult == false) {
    await fetchAttributes();
  }
}

async function subLatestTimeseries() {
  LATEST_TELEMETRY_CMD_ID.value = getAndIncrementCmdId();
  const sendResult = await websocketSend(
    LATEST_TELEMETRY_CMD_ID.value,
    { tsSubCmds: [{ cmdId: LATEST_TELEMETRY_CMD_ID.value, entityId: props.entityId, entityType: props.entityType, scope: 'LATEST_TELEMETRY' }] },
    onWebsocketMessage,
  );

  if (sendResult == false) {
    try {
      loading.value = true;
      const kvRecord = await getLatestTimeseries(entityId.value);
      dataSource.value = Object.keys(kvRecord).map(key => ({
        key: key,
        value: isBoolean(kvRecord[key][0].value) ? kvRecord[key][0].value + '' : kvRecord[key][0].value,
        lastUpdateTs: kvRecord[key][0].ts
      }))

    } catch (error: any) {
      console.log('error', error);
    } finally {
      loading.value = false;
    }
  }

}
onBeforeUnmount(() => {
  unsubscribe()
})
function unsubscribe() {
  websocketUnsubscribe(
    [LATEST_TELEMETRY_CMD_ID.value, ATTRIBUTE_CMD_ID.value],
    {
      tsSubCmds: LATEST_TELEMETRY_CMD_ID.value > 0 ? [{ cmdId: LATEST_TELEMETRY_CMD_ID.value, entityId: props.entityId, entityType: props.entityType, scope: 'LATEST_TELEMETRY', unsubscribe: true }] : [],
      attrSubCmds: ATTRIBUTE_CMD_ID.value > 0 ? [{ cmdId: ATTRIBUTE_CMD_ID.value, entityId: props.entityId, entityType: props.entityType, scope: 'CLIENT_SCOPE', unsubscribe: true }] : [],
    }
  );
}


function onWebsocketMessage(data: any) {
  dataSource.value = Object.keys(data.data).map(key => ({
    key: key,
    value: data.data[key][0][1],
    lastUpdateTs: data.data[key][0][0],
  }));
}



function handleDelete(data: any) {
  if (LATEST_TELEMETRY != selectedScope.value) {
    createConfirm({
      iconType: 'error',
      title: `确定删除属性[${data.key}]吗？`,
      content: '注意,确认后所有选中的属性都会被删除。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteEntityAttributes(entityId.value, selectedScope.value as Scope, [data.key]);
          showMessage(`删除${data.key}属性成功！`);
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      }

    })
  } else {
    openDeleteModal(true, {
      entityType: props.entityType,
      entityId: props.entityId,
      keys: [data.key],
    })
  }

}

function handleSuccess() {
  handleScopeChange(selectedScope.value);
}

function handleTimeseriesModal(data: any) {
  openTimeseriesModal(true, { entityType: props.entityType, entityId: props.entityId, keys: data.key })
}

function handledAttributeForm(data: any) {
  openAttributeModal(true, { entityType: props.entityType, entityId: props.entityId, scope: selectedScope.value, attribute: data })
}


</script>

<style lang="less">
.telemetry-index {
  .jeesite-basic-table-header__header-top {
    margin-top: 0;
  }
}
</style>