<template>
  <div class="event-index">
    <BasicTable @register="registerTable" :columns="tableColumns">
      <template #toolbar>
        <Tooltip placement="top">
          <template #title>
            <span>{{ t('tb.event.action.clearAll') }}</span>
          </template>
          <Icon
            icon="ant-design:delete-outlined"
            :size="20"
            class="cursor-pointer"
            :style="{ color: 'red' }"
            @click="handelClear()"
            v-if="hasPermission(Authority.TENANT_ADMIN)"
          />
        </Tooltip>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <Select
            v-model:value="eventFilter.eventType"
            :options="entityTypeOptions"
            style="width: 130px"
            @change="reload()"
          />
          <RangePicker
            v-model:value="searchParam.timeRange"
            style="width: 300px"
            show-time
            :allow-clear="false"
            format="YYYY/MM/DD HH:mm"
            :presets="rangePresets"
            @change="reload()"
          />
        </div>
      </template>
    </BasicTable>
    <MetaDataModal @register="registerModal" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbEventList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, ref, reactive, unref, computed, h } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import { RangePicker, Select, Tooltip } from 'ant-design-vue';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import {
    CALCULATED_FIELD_EVENT_TYPE_OPTIONS,
    EVENT_TYPE_OPTIONS,
    EventType,
    RULE_CHAIN_EVENT_TYPE_OPTIONS,
    RULE_NODE_EVENT_TYPE_OPTIONS,
  } from '/@/enums/eventEnum';
  import { clearEvents, getEvents, EventFilter } from '/@/api/tb/events';
  import { useI18n } from '/@/hooks/web/useI18n';
  import dayjs from 'dayjs';
  import MetaDataModal from './metadata.vue';

  const userStore = useUserStore();
  const { hasPermission } = usePermission();

  const { t } = useI18n('tb');

  const props = defineProps({
    entityType: {
      type: String as PropType<EntityType>,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    pageSize: {
      type: Number,
      default: 20,
    },
  });

  const { createConfirm, showMessage } = useMessage();

  const rangePresets = ref([
    { label: t('common.search.rangePresets.today'), value: [dayjs().startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last1Hour'), value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last6Hours'), value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last1Day'), value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last3Days'), value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last7Days'), value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const entityTypeOptions = computed(() => {
    if (EntityType.RULE_NODE == props.entityType) {
      return RULE_NODE_EVENT_TYPE_OPTIONS;
    } else if (EntityType.RULE_CHAIN == props.entityType) {
      return RULE_CHAIN_EVENT_TYPE_OPTIONS;
    } else if (EntityType.CALCULATED_FIELD == props.entityType) {
      return CALCULATED_FIELD_EVENT_TYPE_OPTIONS;
    } else {
      return EVENT_TYPE_OPTIONS;
    }
  });

  const eventFilter = reactive<EventFilter>({
    eventType: entityTypeOptions.value[0].value as EventType,
  });

  const searchParam = reactive({
    textSearch: '',
    timeRange: [dayjs().startOf('D'), dayjs()],
  });

  const tableColumns = computed(() => {
    const columns: BasicColumn[] = [
      {
        title: t('tb.event.table.createdTime'),
        dataIndex: 'createdTime',
        key: 'createdTime',
        format: 'date|YYYY-MM-DD HH:mm:ss',
        sorter: true,
        width: 180,
        fixed: 'left',
        align: 'center',
      },
      {
        title: t('tb.event.table.server'),
        dataIndex: 'body.server',
        key: 'server',
        align: 'center',
        fixed: 'left',
        width: 180,
      },
    ];

    switch (eventFilter.eventType) {
      case EventType.ERROR:
        columns.push(
          {
            title: t('tb.event.table.method'),
            dataIndex: 'body.method',
            key: 'method',
            align: 'left',
          },
          {
            title: t('tb.event.table.error'),
            dataIndex: 'body.errorStr',
            key: 'errorStr',
            align: 'left',
            width: 100,
          },
        );
        break;
      case EventType.LC_EVENT:
        columns.push(
          {
            title: t('tb.event.table.event'),
            dataIndex: 'body.event',
            key: 'event',
            align: 'left',
          },
          {
            title: t('tb.event.table.status'),
            dataIndex: 'body.success',
            key: 'success',
            align: 'left',
            customRender: ({ value }) => (value == true ? t('tb.event.table.success') : t('tb.event.table.failure')),
            width: 80,
          },
          {
            title: t('tb.event.table.error'),
            dataIndex: 'body.errorStr',
            key: 'errorStr',
            align: 'left',
            width: 100,
          },
        );
        break;
      case EventType.STATS:
        columns.push(
          {
            title: t('tb.event.table.messagesProcessed'),
            dataIndex: 'body.messagesProcessed',
            key: 'messagesProcessed',
            align: 'center',
          },
          {
            title: t('tb.event.table.errorsOccurred'),
            dataIndex: 'body.errorsOccurred',
            key: 'errorsOccurred',
            align: 'center',
          },
        );
        break;
      case EventType.DEBUG_RULE_CHAIN:
        columns.push(
          {
            title: t('tb.event.table.message'),
            dataIndex: 'body.message',
            key: 'message',
            align: 'left',
          },
          {
            title: t('tb.event.table.error'),
            dataIndex: 'body.errorStr',
            key: 'errorStr',
            align: 'center',
            width: 100,
          },
        );
        break;
      case EventType.DEBUG_RULE_NODE:
        columns.push(
          {
            title: t('tb.event.table.type'),
            dataIndex: 'body.type',
            key: 'type',
            align: 'center',
            width: 80,
          },
          {
            title: t('tb.event.table.entityType'),
            dataIndex: 'body.entityType',
            key: 'entityType',
            align: 'center',
            width: 100,
          },
          {
            title: t('tb.event.table.entityId'),
            dataIndex: 'body.entityId',
            key: 'entityId',
            align: 'center',
            width: 180,
          },
          {
            title: t('tb.event.table.msgId'),
            dataIndex: 'body.msgId',
            key: 'msgId',
            align: 'center',
            width: 180,
          },
          {
            title: t('tb.event.table.msgType'),
            dataIndex: 'body.msgType',
            key: 'msgType',
            align: 'center',
            width: 220,
          },
          {
            title: t('tb.event.table.relationType'),
            dataIndex: 'body.relationType',
            key: 'relationType',
            align: 'left',
            width: 180,
          },
          {
            title: t('tb.event.table.data'),
            dataIndex: 'body.data',
            key: 'data',
            align: 'center',
            customRender: ({ record }: any) => {
              return h(Icon, {
                size: '20',
                class: 'cursor-pointer',
                icon: 'ant-design:ellipsis-outlined',
                onClick: (v) =>
                  openMetaDataModel(true, {
                    data: record.body.data,
                    title: t('tb.event.table.data'),
                  }),
              });
            },
            width: 80,
          },
          {
            title: t('tb.event.table.metadata'),
            dataIndex: 'body.metadata',
            key: 'metadata',
            align: 'center',
            customRender: ({ record }: any) => {
              return h(Icon, {
                size: '20',
                class: 'cursor-pointer',
                icon: 'ant-design:ellipsis-outlined',
                onClick: (v) =>
                  openMetaDataModel(true, {
                    data: record.body.metadata,
                    title: t('tb.event.table.metadata'),
                  }),
              });
            },
            width: 80,
          },
          {
            title: t('tb.event.table.error'),
            dataIndex: 'body.errorStr',
            key: 'errorStr',
            align: 'center',
            customRender: ({ record }: any) => {
              return h(Icon, {
                size: '20',
                class: 'cursor-pointer',
                icon: 'ant-design:ellipsis-outlined',
                onClick: (v) =>
                  openMetaDataModel(true, {
                    data: record.body.errorStr,
                    title: t('tb.event.table.error'),
                  }),
              });
            },
            width: 80,
          },
        );
        break;
      case EventType.DEBUG_CALCULATED_FIELD:
        columns.push(
          {
            title: t('tb.event.table.entityId'),
            dataIndex: 'body.entityId',
            key: 'entityId',
            align: 'center',
            width: 180,
          },
          {
            title: t('tb.event.table.msgId'),
            dataIndex: 'body.msgId',
            key: 'msgId',
            align: 'center',
            width: 180,
          },
          {
            title: t('tb.event.table.msgType'),
            dataIndex: 'body.msgType',
            key: 'msgType',
            align: 'center',
            width: 220,
          },
          {
            title: t('参数'),
            dataIndex: 'body.arguments',
            key: 'arguments',
            align: 'center',
            customRender: ({ record }: any) => {
              return h(Icon, {
                size: '20',
                class: 'cursor-pointer',
                icon: 'ant-design:ellipsis-outlined',
                onClick: (v) =>
                  openMetaDataModel(true, {
                    data: record.body.arguments,
                    title: t('参数'),
                  }),
              });
            },
            width: 80,
          },
          {
            title: t('结果'),
            dataIndex: 'body.result',
            key: 'result',
            align: 'center',
            customRender: ({ record }: any) => {
              return h(Icon, {
                size: '20',
                class: 'cursor-pointer',
                icon: 'ant-design:ellipsis-outlined',
                onClick: (v) =>
                  openMetaDataModel(true, {
                    data: record.body.result,
                    title: t('结果'),
                  }),
              });
            },
            width: 80,
          },

          {
            title: t('tb.event.table.error'),
            dataIndex: 'body.error',
            key: 'error',
            align: 'center',
            customRender: ({ record }: any) => {
              return h(Icon, {
                size: '20',
                class: 'cursor-pointer',
                icon: 'ant-design:ellipsis-outlined',
                onClick: (v) =>
                  openMetaDataModel(true, {
                    data: record.body.error,
                    title: t('tb.event.table.error'),
                  }),
              });
            },
            width: 80,
          },
        );
        break;
    }

    return columns;
  });

  const [registerModal, { openModal: openMetaDataModel }] = useModal();
  const [registerTable, { reload, updateColumn }] = useTable({
    api: fetchData,
    beforeFetch: wrapFetchParams,
    rowKey: (record) => record.id.id,
    showIndexColumn: false,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
    pagination: { pageSize: props.pageSize || 20 },
  });

  function wrapFetchParams(fetchParam: any) {
    const startTime = searchParam.timeRange && searchParam.timeRange[0] ? searchParam.timeRange[0].valueOf() : null;
    const endTime = searchParam.timeRange && searchParam.timeRange[1] ? searchParam.timeRange[1].valueOf() : null;
    const tenantId = userStore.getUserInfo.tenantId.id;
    return {
      ...fetchParam,
      textSearch: searchParam.textSearch,
      startTime: startTime,
      endTime: endTime,
      tenantId: tenantId,
    };
  }
  async function fetchData(param: any) {
    return await getEvents(props.entityType, props.entityId, unref(eventFilter), param);
  }

  function handelClear() {
    createConfirm({
      iconType: 'error',
      title: t('tb.event.action.clearAll'),
      content: t('tb.event.action.clearAllConfirm'),
      centered: false,
      okText: t('tb.event.action.confirm'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await clearEvents(
            props.entityType,
            props.entityId,
            {
              startTime: searchParam.timeRange && searchParam.timeRange[0] ? searchParam.timeRange[0].valueOf() : 0,
              endTime: searchParam.timeRange && searchParam.timeRange[1] ? searchParam.timeRange[1].valueOf() : 0,
            },
            unref(eventFilter),
          );
          showMessage(t('tb.event.action.clearAllSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          reload();
        }
      },
    });
  }

  defineExpose({
    reload,
  });
</script>
