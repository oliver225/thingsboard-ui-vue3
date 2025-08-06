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
  import dayjs from 'dayjs';
  import { Authority } from '/@/enums/authorityEnum';
  import { isEmpty } from 'lodash-es';
  import { usePermission } from '/@/hooks/web/usePermission';

  const { t } = useI18n('tb');
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
    value: '报警',
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
    timeRange: [],
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('发起者'),
      dataIndex: 'originatorName',
      key: 'originatorName',
      sorter: true,
      align: 'left',
      fixed: 'left',
      ifShow: isEmpty(props.entityType),
    },
    {
      title: t('报警类型'),
      dataIndex: 'type',
      key: 'type',
      width: 200,
      align: 'center',
      fixed: 'left',
    },

    {
      title: '委托人',
      dataIndex: 'assignee.firstName',
      key: 'assignee.firstName',
      align: 'center',
    },
    {
      title: '报警等级',
      dataIndex: 'severity',
      key: 'severityList',
      align: 'center',
      width: 130,
      filters: ALARM_SEVERITY_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      slot: 'severity',
    },
    {
      title: '报警状态',
      dataIndex: 'status',
      key: 'statusList',
      align: 'center',
      width: 130,
      filters: ALARM_STATUS_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      format: (text: any) => (text ? ALARM_SHOW_STATUS_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('创建时间'),
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
        title: t('报警详情'),
        onClick: handleDetail.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除报警'),
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
      title: `确定删除报警[${record.name}]吗？`,
      content: '请注意：确认后，报警关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteAlarm(record.id.id);
          showMessage('删除报警成功！');
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
