<template>
  <div class="rpc-wrap" v-loading="loading">
    <Card
      :bordered="true"
      class="mb-4"
      size="small"
      :tab-list="tabListNoTitle"
      :active-tab-key="cardActiveTabKey"
      @tabChange="(key) => onTabChange(key)"
    >
      <template #tabBarExtraContent>
        <TimeFilter ref="timeFilterRef" :keys="[cardActiveTabKey]" @apply="fetchGatewayAlarmInfoSocket" />
      </template>

      <BasicTable @register="registerTable" :columns="logColumns">
        <template #level="{ record }">
          <Tag :color="getLevelColor(parseLog(record?.value).level)" style="border-radius: 12px">
            {{ parseLog(record?.value).level }}
          </Tag>
        </template>
        <template #message="{ record }">
          <span>{{ parseLog(record?.value).message }}</span>
        </template>
      </BasicTable>
    </Card>
  </div>
</template>

<script setup lang="ts" name="GatewayRPC">
  import { onUnmounted, ref } from 'vue';
  import { Card, Tag } from 'ant-design-vue';
  import { useRoute } from 'vue-router';

  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import TimeFilter from './ConnectorsComp/base/TimeFilter.vue';
  import { useWebsocketStore } from '/@/store/modules/websocket';

  import { useI18n } from '/@/hooks/web/useI18n';

  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  import { LEVEL_OPTIONS_COLORS } from '../generalConfiguration/components/enums';

  defineProps<{ gatewayName: string }>();

  const { t } = useI18n('tb');

  // TimeFilter 组件引用
  const timeFilterRef = ref();

  // 保存渲染参数（tsCmd 或 historyCmd）
  let renderParams: any = null;

  const route = useRoute();
  const gatewayId = route.params.gatewayId as string;

  const tabListNoTitle = [
    {
      key: 'LOGS',
      tab: t('tb.gateway.details.logs.general'),
    },
    {
      key: 'SERVICE_LOGS',
      tab: t('tb.gateway.details.logs.service'),
    },
    {
      key: 'CONNECTION_LOGS',
      tab: t('tb.gateway.details.logs.connection'),
    },
    {
      key: 'STORAGE_LOGS',
      tab: t('tb.gateway.details.logs.storage'),
    },
    {
      key: 'EXTENSIONS_LOGS',
      tab: t('tb.gateway.details.logs.extension'),
    },
  ];

  const loading = ref(false);

  const cardActiveTabKey = ref('LOGS');

  const logColumns: BasicColumn[] = [
    {
      title: t('tb.gateway.details.logs.createdTime'),
      dataIndex: 'ts',
      key: 'ts',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 210,
      fixed: 'left',
      align: 'center',
    },
    {
      title: 'Level',
      key: 'level',
      width: 100,
      align: 'center',
      slot: 'level',
    },
    {
      title: 'Message',
      key: 'message',
      align: 'left',
      slot: 'message',
      ellipsis: false,
    },
  ];

  const [registerTable, alarmTableActions] = useTable({
    api: () => fetchGatewayAlarmInfoSocket(),
    rowKey: (r) => r.ts,
    showIndexColumn: false,
    showTableSetting: false,
    useSearchForm: false,
    canResize: true,
  });

  // 本地日志数据，第一次为全量，后续增量追加
  const logsRef = ref<any[]>([]);
  const logKeys = ref<Set<string>>(new Set());
  const MAX_LOGS = 1000;

  const getKey = (item: any) => `${item?.ts ?? ''}-${item?.value ?? ''}`;

  function replaceLogs(items: any[]) {
    logsRef.value = (items || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    logKeys.value = new Set(logsRef.value.map((it) => getKey(it)));
    alarmTableActions.setTableData(logsRef.value ?? []);
    alarmTableActions.setPagination({ total: logsRef.value.length });
  }

  function appendLogs(items: any[]) {
    if (!items || !items.length) return;
    let changed = false;
    for (const it of items) {
      const k = getKey(it);
      if (!logKeys.value.has(k)) {
        logKeys.value.add(k);
        logsRef.value.push(it);
        changed = true;
      }
    }
    if (changed) {
      logsRef.value.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      if (logsRef.value.length > MAX_LOGS) logsRef.value = logsRef.value.slice(0, MAX_LOGS);
      alarmTableActions.setTableData(logsRef.value);
      alarmTableActions.setPagination({ total: logsRef.value.length });
    }
  }

  // 解析日志
  function parseLog(value?: string): { level: string; message: string } {
    if (!value) return { level: 'INFO', message: '' };
    const first = value.indexOf('|');
    if (first !== -1) {
      const second = value.indexOf('|', first + 1);
      if (second !== -1) {
        const level = value
          .slice(first + 1, second)
          .trim()
          .toUpperCase();
        const message = value.slice(second + 1).trim();
        return { level, message };
      }
    }
    const dash = value.indexOf(' - ');
    if (dash !== -1) {
      return { level: 'INFO', message: value.slice(dash + 3).trim() };
    }
    return { level: 'INFO', message: value };
  }

  function getLevelColor(level: string): string {
    return LEVEL_OPTIONS_COLORS[level] || 'default';
  }

  const onTabChange = (value: string) => {
    cardActiveTabKey.value = value;
    alarmTableActions.reload();
  };

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const GATEWAY_ALARM_INFO_CMD_ID = ref(0);
  const GATEWAY_ALARM_LIST_CMD_ID = ref(0);

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribeOne(GATEWAY_ALARM_INFO_CMD_ID.value);
    unsubscribeOne(GATEWAY_ALARM_LIST_CMD_ID.value);
  }

  function unsubscribeOne(cmdId: number) {
    if (cmdId > 0) {
      unsubscribe([cmdId], {
        cmds: [{ cmdId: cmdId, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  /**
   * 订阅获取 网关下的报警信息
   * @param result - TimeFilter 的 apply 事件传递的参数（可选）
   */
  async function fetchGatewayAlarmInfoSocket(result?: { tsCmd?: any; historyCmd?: any }) {
    // 如果有 result，说明是从 TimeFilter 的 apply 事件调用的
    if (result) {
      renderParams = result;
    } else {
      // 初次加载，从 TimeFilter 组件获取默认参数
      if (timeFilterRef.value?.getInitialParams) {
        renderParams = timeFilterRef.value.getInitialParams([cardActiveTabKey.value]);
      }
    }
    loading.value = true;
    // 刷新前取消订阅
    unsubscribeOne(GATEWAY_ALARM_INFO_CMD_ID.value);
    unsubscribeOne(GATEWAY_ALARM_LIST_CMD_ID.value);
    // 重新获取 cmdId
    GATEWAY_ALARM_INFO_CMD_ID.value = getAndIncrementCmdId();
    GATEWAY_ALARM_LIST_CMD_ID.value = getAndIncrementCmdId();

    send(
      [GATEWAY_ALARM_INFO_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: GATEWAY_ALARM_INFO_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: {
                  id: gatewayId,
                  entityType: EntityType.DEVICE,
                },
              },
              pageLink: {
                pageSize: 1,
                page: 0,
                sortOrder: {
                  key: {
                    type: EntityKeyType.ENTITY_FIELD,
                    key: 'createdTime',
                  },
                  direction: 'DESC',
                },
              },
              entityFields: [
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'name',
                },
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'label',
                },
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'additionalInfo',
                },
              ],
              latestValues: [],
            },
          },
        ],
      },
      onAlarmInfoMessage,
    );

    send(
      [GATEWAY_ALARM_LIST_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: GATEWAY_ALARM_LIST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            ...renderParams,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: {
                  id: gatewayId,
                  entityType: EntityType.DEVICE,
                },
              },
              pageLink: {
                pageSize: 1,
                page: 0,
                sortOrder: {
                  key: {
                    type: EntityKeyType.ENTITY_FIELD,
                    key: 'createdTime',
                  },
                  direction: 'DESC',
                },
              },
              entityFields: [
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'name',
                },
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'label',
                },
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'additionalInfo',
                },
              ],
              latestValues: [],
            },
          },
        ],
      },
      onAlarmListMessage,
    );

    return [];
  }

  function onAlarmInfoMessage() {
    unsubscribeOne(GATEWAY_ALARM_INFO_CMD_ID.value);
  }

  function onAlarmListMessage(socketData: any) {
    loading.value = false;
    console.log('socketData :>> ', socketData);
    if (socketData?.data) {
      const data = socketData?.data?.data;
      if (data?.[0]?.timeseries) {
        const batch = data?.[0]?.timeseries?.[cardActiveTabKey.value] ?? [];

        // 第一次收到为全量（替换）
        replaceLogs(batch);
      }
    } else if (socketData?.update) {
      const data = socketData?.update;
      if (data?.[0]?.timeseries) {
        const batch = data?.[0]?.timeseries?.[cardActiveTabKey.value] ?? [];

        // 后续为增量（追加去重）
        appendLogs(batch);
      }
    }
  }

  function reload() {
    alarmTableActions.reload();
  }
</script>

<style scoped lang="less">
  .rpc-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;

    height: 96%;

    .label {
      font-size: 12px;
      color: @text-color-secondary;
      margin-bottom: 4px;
    }
    .required {
      color: @error-color;
      margin-left: 2px;
    }
    .response-box {
      min-height: 180px;
      border: 1px solid @border-color-split;
      border-radius: 6px;
      overflow: hidden;
    }
  }
  :deep(.ant-card-body) {
    padding: 12px !important;
  }
</style>
