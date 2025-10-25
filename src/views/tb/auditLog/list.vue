<template>
  <div class="audit-log-list">
    <BasicTable @register="registerTable">
      <template #headerTop v-if="isEmpty(props.entityType)">
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <RangePicker
            v-model:value="searchParam.timeRange"
            style="width: 300px"
            show-time
            :allow-clear="false"
            format="YYYY/MM/DD HH:mm"
            :presets="rangePresets"
            @change="reload()"
          />
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #actionStatus="{ record }">
        <Tag color="success" v-if="record.actionStatus == 'SUCCESS'">{{ t('tb.auditLog.table.success') }}</Tag>
        <Tag color="error" v-if="record.actionStatus == 'FAILURE'">{{ t('tb.auditLog.table.failure') }}</Tag>
      </template>
    </BasicTable>
    <DetailModal @register="registerModal" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbAuditLogList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import dayjs from 'dayjs';
  import { Tag, RangePicker } from 'ant-design-vue';
  import {
    auditLogList,
    getAuditLogByUserId,
    getAuditLogByCustomerId,
    getAuditLogByEntityId,
  } from '/@/api/tb/auditLog';
  import { reactive } from 'vue';
  import DetailModal from './detail.vue';
  import { isEmpty } from 'lodash-es';
  import { ACTION_TYPE_OPTIONS, ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';

  const { t } = useI18n('tb');
  const { createConfirm } = useMessage();

  const props = defineProps({
    entityType: {
      type: String as PropType<EntityType>,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
  });

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.auditLog.title'),
  };

  const rangePresets = ref([
    { label: t('common.search.rangePresets.today'), value: [dayjs().startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last1Hour'), value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last6Hours'), value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last1Day'), value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last3Days'), value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last7Days'), value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const searchParam = reactive({
    textSearch: '',
    timeRange: [dayjs().startOf('D'), dayjs()],
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.auditLog.table.actionTime'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
    {
      title: t('tb.auditLog.table.actionUser'),
      dataIndex: 'userName',
      key: 'userName',
      sorter: true,
      align: 'left',
    },
    {
      title: t('tb.auditLog.table.actionEntity'),
      dataIndex: 'entityId.entityType',
      key: 'entityId.entityType',
      align: 'left',
      width: 160,
      ifShow: isEmpty(props.entityId),
      format: (text: any) => (text ? ENTITY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('tb.auditLog.table.entityName'),
      dataIndex: 'entityName',
      key: 'entityName',
      sorter: true,
      align: 'left',
      ifShow: isEmpty(props.entityType),
    },
    {
      title: t('tb.auditLog.table.actionType'),
      dataIndex: 'actionType',
      key: 'actionTypes',
      align: 'left',
      width: 160,
      filters: ACTION_TYPE_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      format: (text: any) => (text ? ACTION_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('tb.auditLog.table.status'),
      dataIndex: 'actionStatus',
      key: 'actionStatus',
      sorter: true,
      align: 'center',
      slot: 'actionStatus',
      width: 100,
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:appstore-outlined',
        title: t('tb.auditLog.action.detail'),
        onClick: handleDetail.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (arg) => fetchAuditLog(arg),
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    const actionTypes = param.actionTypes ? param.actionTypes.join(',') : null;
    return {
      ...param,
      actionTypes: actionTypes,
      textSearch: searchParam.textSearch,
      startTime: searchParam.timeRange[0].valueOf(),
      endTime: searchParam.timeRange[1].valueOf(),
    };
  }

  async function fetchAuditLog(param: any) {
    if (isEmpty(props.entityType)) {
      return await auditLogList(param);
    } else if (props.entityType == EntityType.USER) {
      return await getAuditLogByUserId(param, props.entityId);
    } else if (props.entityType == EntityType.CUSTOMER) {
      return await getAuditLogByCustomerId(param, props.entityId);
    } else {
      return await getAuditLogByEntityId(param, props.entityType, props.entityId);
    }
  }

  function handleSuccess() {
    reload();
  }

  function handleDetail(record: Recordable) {
    openModal(true, record);
  }
</script>
<style lang="less">
  .audit-log-list {
  }
</style>
