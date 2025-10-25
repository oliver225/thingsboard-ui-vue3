<template>
  <div>
    <Card :title="t('tb.alarm.title')">
      <BasicTable @register="registerAlarmTable">
        <template #severity="{ record }">
          <span v-if="record.severity">
            <Tag :color="ALARM_SEVERITY_OPTIONS.find((item) => item.value === record.severity)?.color">
              {{ ALARM_SEVERITY_OPTIONS.find((item) => item.value === record.severity)?.label }}
            </Tag>
          </span>
        </template>
      </BasicTable>
    </Card>

    <!-- Activity Modal -->
    <ActivityModal @register="registerActivityModal" />
    <!-- Detail Modal -->
    <DetailModal @register="registerModal" />
  </div>
</template>

<script lang="ts" setup name="GatewayBase">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { Card, Tag } from 'ant-design-vue';
  import dayjs from 'dayjs';

  import { BasicTable, useTable } from '/@/components/Table';
  import { useModal } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import DetailModal from '/@/views/tb/alarm/detail.vue';

  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { ALARM_SEVERITY_OPTIONS, ALARM_SHOW_STATUS_OPTIONS, ALARM_STATUS_OPTIONS } from '/@/enums/alarmEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';

  import ActivityModal from './ActivityModal.vue';

  const route = useRoute();
  const gatewayId = route.params.gatewayId as string;
  const { t } = useI18n('');

  const [registerAlarmTable, alarmTableActions] = useTable({
    api: fetchGatewayAlarmListSocket,
    beforeFetch: (param) => {
      if (param.sortOrder) {
        param.sortOrder = {
          direction: param.sortOrder.toUpperCase(),
          key: {
            key: param.sortProperty,
            type: EntityKeyType.ENTITY_FIELD,
          },
        };
        delete param.sortProperty;
      }

      return {
        ...param,
      };
    },
    rowKey: (record) => record.entityId.id,
    columns: [
      {
        title: t('tb.alarm.table.createdTime'),
        dataIndex: 'createdTime',
        sorter: true,
        format: (text) => {
          if (text) {
            return dayjs.unix(Math.floor(Number(text) / 1000)).format('YYYY-MM-DD HH:mm:ss');
          }
          return '';
        },
      },
      { title: t('tb.alarm.table.type'), dataIndex: 'type' },
      {
        title: t('tb.alarm.table.severity'),
        dataIndex: 'severity',
        filters: ALARM_SEVERITY_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
        slot: 'severity',
      },
      {
        title: t('tb.alarm.table.details'),
        dataIndex: 'details',
        format: (text: any) => (text ? JSON.stringify(text) || text : ''),
      },
      {
        title: t('tb.alarm.table.status'),
        dataIndex: 'status',
        filters: ALARM_STATUS_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
        format: (text: any) =>
          text ? ALARM_SHOW_STATUS_OPTIONS.find((item) => item.value === text)?.label || text : '',
      },
    ],
    actionColumn: {
      width: 120,
      actions: (record: Recordable) => [
        {
          icon: 'ant-design:bell-outlined',
          title: t('tb.gateway.details.activity.title'),
          onClick: () => openActivity(record),
        },
        {
          icon: 'ant-design:profile-outlined',
          title: t('tb.alarm.detail.title'),
          color: 'success',
          onClick: () => openDetail(record),
        },
      ],
    },
    showIndexColumn: true,
    bordered: true,
    useSearchForm: false,
    showTableSetting: false,
    ellipsis: false,
  });

  const [registerActivityModal, { openModal: openActivityModal }] = useModal();
  const [registerModal, { openModal: openDetailModal }] = useModal();

  function openActivity(record: Recordable) {
    const id = record?.id?.id || '';
    openActivityModal(true, { alarmId: id });
  }

  function openDetail(record: Recordable) {
    openDetailModal(true, record);
  }

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const GATEWAY_ALARM_LIST_CMD_ID = ref(0);

  onMounted(async () => {});

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribeDevice();
  }

  function unsubscribeDevice() {
    if (GATEWAY_ALARM_LIST_CMD_ID.value > 0) {
      unsubscribe([GATEWAY_ALARM_LIST_CMD_ID.value], {
        cmds: [{ cmdId: GATEWAY_ALARM_LIST_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  /**
   * 订阅获取 网关下的设备列表
   */
  async function fetchGatewayAlarmListSocket(pageLink?: any) {
    alarmTableActions.setLoading(true);
    // 刷新前取消订阅
    unsubscribeDevice();
    // 重新获取 cmdId
    GATEWAY_ALARM_LIST_CMD_ID.value = getAndIncrementCmdId();

    send(
      [GATEWAY_ALARM_LIST_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: GATEWAY_ALARM_LIST_CMD_ID.value,
            type: WsCmdType.ALARM_DATA,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: {
                  id: gatewayId,
                  entityType: EntityType.DEVICE,
                },
              },
              pageLink: {
                page: 0,
                pageSize: 10,
                textSearch: null,
                typeList: [],
                severityList: [],
                statusList: [],
                searchPropagatedAlarms: false,
                sortOrder: {
                  key: {
                    key: 'createdTime',
                    type: EntityKeyType.ALARM_FIELD,
                  },
                  direction: 'DESC',
                },
                timeWindow: 2592000000,
                ...pageLink,
              },
              alarmFields: [
                {
                  type: EntityKeyType.ALARM_FIELD,
                  key: 'createdTime',
                },
                {
                  type: EntityKeyType.ALARM_FIELD,
                  key: 'type',
                },
                {
                  type: EntityKeyType.ALARM_FIELD,
                  key: 'severity',
                },
                {
                  type: EntityKeyType.ALARM_FIELD,
                  key: 'details',
                },
                {
                  type: EntityKeyType.ALARM_FIELD,
                  key: 'status',
                },
              ],
              entityFields: [],
              latestValues: [],
            },
          },
        ],
      },
      onGatewayAlarmListMessage,
    );
  }

  function onGatewayAlarmListMessage(socketData: any) {
    alarmTableActions.setLoading(false);
    const data = socketData?.data;

    if (data) {
      alarmTableActions.setTableData(data?.data ?? []);
      alarmTableActions.setPagination({
        total: data?.totalElements ?? 0,
      });
    }
  }
</script>

<style lang="less" scoped>
  .gateway-base-wrap {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :deep(.ant-card-body) {
    padding: 12px !important;
  }
</style>
