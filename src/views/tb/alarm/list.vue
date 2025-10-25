<template>
  <div>
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
            :allow-clear="true"
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
      <template #severity="{ record }">
        <span v-if="record.severity">
          <Tag :color="ALARM_SEVERITY_OPTIONS.find((item) => item.value === record.severity)?.color">
            {{ ALARM_SEVERITY_OPTIONS.find((item) => item.value === record.severity)?.label }}
          </Tag>
        </span>
      </template>
    </BasicTable>
    <DetailModal @register="registerModal" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbAlarmList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { Tag, RangePicker } from 'ant-design-vue';
  import { getAlarmInfoList, deleteAlarm, getAlarmInfoByEntity } from '/@/api/tb/alarm';
  import DetailModal from './detail.vue';
  import { ALARM_SEVERITY_OPTIONS, ALARM_SHOW_STATUS_OPTIONS, ALARM_STATUS_OPTIONS } from '/@/enums/alarmEnum';
  import dayjs, { Dayjs } from 'dayjs';
  import { Authority } from '/@/enums/authorityEnum';
  import { isEmpty } from 'lodash-es';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { router } from '/@/router';

  const { t } = useI18n('tb.alarm');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

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
    value: router.currentRoute.value.meta.title || t('tb.alarm.title'),
  };

  const rangePresets = ref([
    { label: t('common.search.rangePresets.today'), value: [dayjs().startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last1Hour'), value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last6Hours'), value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last1Day'), value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last3Days'), value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last7Days'), value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const searchParam = reactive<{
    textSearch: string;
    timeRange?: [Dayjs, Dayjs];
  }>({
    textSearch: '',
    timeRange: undefined,
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.alarm.table.originator'),
      dataIndex: 'originatorName',
      key: 'originatorName',
      sorter: true,
      align: 'left',
      fixed: 'left',
      ifShow: isEmpty(props.entityType),
    },
    {
      title: t('tb.alarm.table.alarmType'),
      dataIndex: 'type',
      key: 'type',
      width: 200,
      align: 'center',
      fixed: 'left',
    },
    {
      title: t('tb.alarm.table.assignee'),
      dataIndex: 'assignee.firstName',
      key: 'assignee.firstName',
      align: 'center',
    },
    {
      title: t('tb.alarm.table.severity'),
      dataIndex: 'severity',
      key: 'severityList',
      align: 'center',
      width: 130,
      filters: ALARM_SEVERITY_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      slot: 'severity',
    },
    {
      title: t('tb.alarm.table.status'),
      dataIndex: 'status',
      key: 'statusList',
      align: 'center',
      width: 130,
      filters: ALARM_STATUS_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      format: (text: any) => (text ? ALARM_SHOW_STATUS_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('tb.alarm.table.createdTime'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:appstore-outlined',
        title: t('tb.alarm.action.alarmDetail'),
        onClick: handleDetail.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.alarm.action.deleteAlarm'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: fetchAlarmInfoList,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    const startTime = searchParam.timeRange && searchParam.timeRange[0] ? searchParam.timeRange[0].valueOf() : null;
    const endTime = searchParam.timeRange && searchParam.timeRange[1] ? searchParam.timeRange[1].valueOf() : null;
    const severityList = param.severityList ? param.severityList.join(',') : null;
    const statusList = param.statusList ? param.statusList.join(',') : null;
    const typeList = ''; //报警类型
    const assigneeId = ''; //委托人
    return {
      ...param,
      textSearch: searchParam.textSearch,
      startTime: startTime,
      endTime: endTime,
      severityList: severityList,
      statusList: statusList,
    };
  }

  async function fetchAlarmInfoList(param: any) {
    if (isEmpty(props.entityType)) {
      return await getAlarmInfoList(param);
    } else {
      return await getAlarmInfoByEntity(param, props.entityType, props.entityId);
    }
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.alarm.action.deleteAlarmConfirm', { name: record.name }),
      content: t('tb.alarm.action.deleteAlarmConfirmContent'),
      centered: false,
      okText: t('common.delText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteAlarm(record.id.id);
          showMessage(t('tb.alarm.action.deleteAlarmSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
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
