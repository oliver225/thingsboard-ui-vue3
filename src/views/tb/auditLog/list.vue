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
            placeholder="输入搜索内容"
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
        <Tag color="success" v-if="record.actionStatus == 'SUCCESS'">成功</Tag>
        <Tag color="error" v-if="record.actionStatus == 'FAILURE'">失败</Tag>
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
    value: router.currentRoute.value.meta.title || '审计日志',
  };

  const rangePresets = ref([
    { label: '今天', value: [dayjs().startOf('D'), dayjs()] },
    { label: '最近1小时', value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: '最近6小时', value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: '最近1天', value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: '最近3天', value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: '最近7天', value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const searchParam = reactive({
    textSearch: '',
    timeRange: [dayjs().startOf('D'), dayjs()],
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('操作时间'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
    {
      title: t('操作用户'),
      dataIndex: 'userName',
      key: 'userName',
      sorter: true,
      align: 'left',
    },
    {
      title: t('操作实体'),
      dataIndex: 'entityId.entityType',
      key: 'entityId.entityType',
      align: 'left',
      width: 160,
      ifShow: isEmpty(props.entityId),
      format: (text: any) => (text ? ENTITY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('实体名称'),
      dataIndex: 'entityName',
      key: 'entityName',
      sorter: true,
      align: 'left',
      ifShow: isEmpty(props.entityType),
    },
    {
      title: t('操作类型'),
      dataIndex: 'actionType',
      key: 'actionTypes',
      align: 'left',
      width: 160,
      filters: ACTION_TYPE_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      format: (text: any) => (text ? ACTION_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('状态'),
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
        title: t('详情'),
        onClick: handleDetail.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除资源'),
        onClick: handleDelete.bind(this, { ...record }),
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

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: `确定删除租户配置[${record.name}]吗？`,
      content: '请注意：确认后，租户配置和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        // try {
        //   await deleteTenantProfile(record.id.id);
        //   showMessage('删除租户配置成功！');
        // } catch (error: any) {
        //   console.log(error);
        // } finally {
        //   handleSuccess();
        // }
      },
    });
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
