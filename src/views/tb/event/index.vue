<template>
  <div class="event-index">
    <BasicTable @register="registerTable" :columns="tableColumns">
      <template #toolbar>
        <Tooltip placement="bottom">
          <template #title>
            <span>{{ t('清除所有事件') }}</span>
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
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbEventList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, ref, reactive, unref, computed } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { RangePicker, Select, Tooltip } from 'ant-design-vue';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EVENT_TYPE_OPTIONS, EventType } from '/@/enums/eventEnum';
  import { clearEvents, getEvents, EventFilter } from '/@/api/tb/events';
  import { useI18n } from '/@/hooks/web/useI18n';
  import dayjs from 'dayjs';

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
  });

  const { createConfirm, showMessage } = useMessage();

  const rangePresets = ref([
    { label: '今天', value: [dayjs().startOf('D'), dayjs()] },
    { label: '最近1小时', value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: '最近6小时', value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: '最近1天', value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: '最近3天', value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: '最近7天', value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const entityTypeOptions = computed(() => {
    if (EntityType.RULE_NODE == props.entityType) {
      return EVENT_TYPE_OPTIONS.filter((item) => item.value != EventType.DEBUG_RULE_CHAIN);
    } else if (EntityType.RULE_CHAIN == props.entityType) {
      return EVENT_TYPE_OPTIONS.filter((item) => item.value != EventType.DEBUG_RULE_NODE);
    } else {
      return EVENT_TYPE_OPTIONS.filter(
        (item) => item.value != EventType.DEBUG_RULE_NODE && item.value != EventType.DEBUG_RULE_CHAIN,
      );
    }
  });

  const eventFilter = reactive<EventFilter>({
    eventType: EventType.ERROR,
  });

  const searchParam = reactive({
    textSearch: '',
    timeRange: [dayjs().startOf('D'), dayjs()],
  });

  const tableColumns = computed(() => {
    const columns: BasicColumn[] = [
      {
        title: t('事件时间'),
        dataIndex: 'createdTime',
        key: 'createdTime',
        format: 'date|YYYY-MM-DD HH:mm:ss',
        sorter: true,
        width: 180,
        fixed: 'left',
        align: 'center',
      },
      {
        title: t('服务器'),
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
            title: t('方法'),
            dataIndex: 'body.method',
            key: 'method',
            align: 'left',
          },
          {
            title: t('错误'),
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
            title: t('事件'),
            dataIndex: 'body.event',
            key: 'event',
            align: 'left',
          },
          {
            title: t('状态'),
            dataIndex: 'body.status',
            key: 'status',
            align: 'left',
            width: 80,
          },
          {
            title: t('错误'),
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
            title: t('消息处理'),
            dataIndex: 'body.messagesProcessed',
            key: 'messagesProcessed',
            align: 'center',
          },
          {
            title: t('错误发生'),
            dataIndex: 'body.errorsOccurred',
            key: 'errorsOccurred',
            align: 'center',
          },
        );
        break;
      case EventType.DEBUG_RULE_CHAIN:
        columns.push(
          {
            title: t('消息'),
            dataIndex: 'body.message',
            key: 'message',
            align: 'left',
          },
          {
            title: t('错误'),
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
            title: t('类型'),
            dataIndex: 'body.msgDirectionType',
            key: 'msgDirectionType',
            align: 'center',
          },
          {
            title: t('实体类型'),
            dataIndex: 'body.entityType',
            key: 'entityType',
            align: 'center',
          },
          {
            title: t('实体ID'),
            dataIndex: 'body.entityId',
            key: 'entityId',
            align: 'center',
          },
          {
            title: t('消息ID'),
            dataIndex: 'body.msgId',
            key: 'msgId',
            align: 'center',
          },
          {
            title: t('消息类型'),
            dataIndex: 'body.msgType',
            key: 'msgType',
            align: 'center',
          },
          {
            title: t('关联类型'),
            dataIndex: 'body.relationType',
            key: 'relationType',
            align: 'center',
          },
        );
        break;
    }

    return columns;
  });

  const [registerTable, { reload, updateColumn }] = useTable({
    api: fetchData,
    beforeFetch: wrapFetchParams,
    rowKey: (record) => record.id.id,
    showIndexColumn: false,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    // columns: tableColumns,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
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
      title: '清除所有事件',
      content: '确除清空所有事件？',
      centered: false,
      okText: '确认',
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
          showMessage('清空所有事件成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          reload();
        }
      },
    });
  }
</script>
<style lang="less">
  .event-index {
  }
</style>
