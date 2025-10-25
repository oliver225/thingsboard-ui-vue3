<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    width="90%"
    :showFooter="false"
    :maskClosable="true"
    :contentWrapperStyle="{ margin: '0' }"
  >
    <template #title>
      <div class="flex items-center space-x-4">
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{
              connectorName
                ? t('tb.gateway.details.connectorLogs.title', { connectorName })
                : t('tb.gateway.details.connectorLogs.fallbackTitle')
            }}
          </span>
          <span class="text-sm">{{ t('tb.gateway.details.connectorLogs.subtitle') }}</span>
        </div>
      </div>
    </template>

    <div class="p-4 pt-0 border-b flex items-center justify-between">
      <RadioGroup v-model:value="activeTab" button-style="solid">
        <RadioButton value="connector">{{ t('tb.gateway.details.connectorLogs.connector') }}</RadioButton>
        <RadioButton value="converter">{{ t('tb.gateway.details.connectorLogs.converter') }}</RadioButton>
      </RadioGroup>

      <TimeFilter ref="timeFilterRef" :keys="[cardActiveTabKey]" @apply="fetchConnectorLogs" />
    </div>

    <div v-loading="loading">
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
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup name="LogsDrawer">
  import { ref, computed, onUnmounted, watch } from 'vue';
  import { RadioGroup, RadioButton, Tag } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import TimeFilter from './base/TimeFilter.vue';
  import { useWebsocketStore } from '/@/store/modules/websocket';

  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { LEVEL_OPTIONS_COLORS } from '../../generalConfiguration/components/enums';
  import { useI18n } from '/@/hooks/web/useI18n';

  const emit = defineEmits(['register']);

  const activeTab = ref('connector');
  const connectorName = ref<string>('');
  const gatewayId = ref<string>('');
  const loading = ref(false);

  // TimeFilter 组件引用
  const timeFilterRef = ref();

  // 保存渲染参数（tsCmd 或 historyCmd）
  let renderParams: any = null;

  // 动态生成 cardActiveTabKey
  const cardActiveTabKey = computed(() => {
    if (!connectorName.value) return '';
    return activeTab.value === 'connector' ? `${connectorName.value}_LOGS` : `${connectorName.value}_converter_LOGS`;
  });

  const { t } = useI18n();

  const logColumns: BasicColumn[] = [
    {
      title: t('tb.gateway.details.connectorLogs.createdTime'),
      dataIndex: 'ts',
      key: 'ts',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 210,
      fixed: 'left',
      align: 'center',
    },
    {
      title: t('tb.gateway.details.connectorLogs.level'),
      key: 'level',
      width: 100,
      align: 'center',
      slot: 'level',
    },
    {
      title: t('tb.gateway.details.connectorLogs.message'),
      key: 'message',
      align: 'left',
      slot: 'message',
      ellipsis: false,
    },
  ];

  const [registerTable, tableActions] = useTable({
    api: () => fetchConnectorLogs(),
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
    tableActions.setTableData(logsRef.value ?? []);
    tableActions.setPagination({ total: logsRef.value.length });
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
      tableActions.setTableData(logsRef.value);
      tableActions.setPagination({ total: logsRef.value.length });
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

  // 监听 tab 切换，重新加载数据
  watch(activeTab, () => {
    if (gatewayId.value) {
      tableActions.reload();
    }
  });

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const CONNECTOR_LOGS_INFO_CMD_ID = ref(0);
  const CONNECTOR_LOGS_LIST_CMD_ID = ref(0);

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribeOne(CONNECTOR_LOGS_INFO_CMD_ID.value);
    unsubscribeOne(CONNECTOR_LOGS_LIST_CMD_ID.value);
  }

  function unsubscribeOne(cmdId: number) {
    if (cmdId > 0) {
      unsubscribe([cmdId], {
        cmds: [{ cmdId: cmdId, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  /**
   * 订阅获取 连接器下的日志信息
   * @param result - TimeFilter 的 apply 事件传递的参数（可选）
   */
  async function fetchConnectorLogs(result?: { tsCmd?: any; historyCmd?: any }) {
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
    unsubscribeOne(CONNECTOR_LOGS_INFO_CMD_ID.value);
    unsubscribeOne(CONNECTOR_LOGS_LIST_CMD_ID.value);
    // 重新获取 cmdId
    CONNECTOR_LOGS_INFO_CMD_ID.value = getAndIncrementCmdId();
    CONNECTOR_LOGS_LIST_CMD_ID.value = getAndIncrementCmdId();

    send(
      [CONNECTOR_LOGS_INFO_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: CONNECTOR_LOGS_INFO_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: {
                  id: gatewayId.value,
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
      onLogsInfoMessage,
    );

    send(
      [CONNECTOR_LOGS_LIST_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: CONNECTOR_LOGS_LIST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            ...renderParams,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: {
                  id: gatewayId.value,
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
      onLogsListMessage,
    );

    return [];
  }

  function onLogsInfoMessage() {
    unsubscribeOne(CONNECTOR_LOGS_INFO_CMD_ID.value);
  }

  function onLogsListMessage(socketData: any) {
    loading.value = false;

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

  const [registerDrawer] = useDrawerInner(async (data) => {
    // 重置状态
    activeTab.value = 'connector';
    connectorName.value = data?.connectorName || '';
    gatewayId.value = data?.gatewayId || '';

    // 加载日志数据
    if (gatewayId.value) {
      await fetchConnectorLogs();
    }
  });
</script>

<style scoped lang="less">
  :deep(.scrollbar__view) {
    margin: 0 !important;
  }

  .tb-detail-menu {
    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
      background-color: #f5f5f5;
      padding: 0 16px;
    }

    :deep(.ant-tabs-tab) {
      padding: 12px 16px;
      margin: 0;

      .menu-text {
        font-size: 14px;
        font-weight: 500;
      }

      .menu-badge {
        display: inline-block;
        padding: 0 6px;
        height: 18px;
        line-height: 18px;
        font-size: 12px;
        background-color: #1890ff;
        color: white;
        border-radius: 9px;
        min-width: 18px;
        text-align: center;
      }
    }

    :deep(.ant-tabs-tab-active) {
      background-color: white;
    }
  }
</style>
