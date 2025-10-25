<template>
  <div class="rpc-wrap">
    <Card :title="t('tb.gateway.details.rpc.title')" :bordered="true" class="mb-4" size="small">
      <!-- 第一行：Command + Timeout + Send + Terminal 按钮 -->
      <div class="flex gap-4">
        <div class="flex flex-col gap-3 w-3/10">
          <div class="w-full">
            <div class="label">{{ t('tb.gateway.details.rpc.command') }}<span class="required">*</span></div>
            <Select
              v-model:value="command"
              :placeholder="t('tb.gateway.details.rpc.commandPlaceholder')"
              class="w-full"
            >
              <Select.Option v-for="opt in COMMAND_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </Select.Option>
            </Select>
          </div>
          <div>
            <div class="label">{{ t('tb.gateway.details.rpc.timeout') }}</div>
            <InputNumber v-model:value="timeoutSec" :min="1" :max="600" :step="1" class="!w-full" />
          </div>
          <a-button type="primary" @click="handleSend" :loading="sending">
            {{ t('tb.gateway.details.rpc.send') }}
          </a-button>
          <a-button @click="openTerminal">{{ t('tb.gateway.details.rpc.openTerminal') }}</a-button>
        </div>

        <!-- 第二行：Response -->
        <div class="mt-4 flex-1">
          <div class="label mb-1">{{ t('tb.gateway.details.rpc.response') }}</div>
          <div class="response-box">
            <CodeEditor :value="responseStr" :readonly="true" wrapLongLines language="json" />
          </div>
        </div>
      </div>
    </Card>

    <!-- RPC Logs -->
    <Card :title="t('tb.gateway.details.rpc.logsTitle')" :bordered="true" class="mb-4" size="small">
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

    <!-- RPC debug terminal 弹窗 -->
    <RpcTerminalModal :gatewayName="gatewayName" @register="registerModal" />
  </div>
</template>

<script setup lang="ts" name="GatewayRPC">
  import { onUnmounted, ref } from 'vue';
  import { Card, Select, InputNumber, Tag } from 'ant-design-vue';
  import { useRoute } from 'vue-router';

  import { CodeEditor } from '/@/components/CodeEditor';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useModal } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';

  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';

  import { rpcSendTwoway } from '/@/api/tb/gateways/rpc';

  import RpcTerminalModal from './RpcComp/RpcTerminalModal.vue';
  import { COMMAND_OPTIONS } from './RpcComp/enum';
  import { LEVEL_OPTIONS_COLORS } from '../generalConfiguration/components/enums';

  const { gatewayName } = defineProps<{ gatewayName: string }>();

  const route = useRoute();
  const gatewayId = route.params.gatewayId as string;
  const { showMessage } = useMessage();
  const { t } = useI18n('');

  const command = ref<string>('gateway_ping');
  const timeoutSec = ref<number>(60);
  const responseStr = ref<string>('');
  const sending = ref<boolean>(false);

  const [registerModal, { openModal }] = useModal();
  function openTerminal() {
    openModal(true);
  }

  const logColumns: BasicColumn[] = [
    {
      title: t('tb.gateway.details.rpc.timestamp'),
      dataIndex: 'ts',
      key: 'ts',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 180,
      fixed: 'left',
      align: 'center',
    },
    {
      title: t('tb.gateway.details.rpc.level'),
      key: 'level',
      width: 100,
      align: 'center',
      slot: 'level',
    },
    {
      title: t('tb.gateway.details.rpc.message'),
      key: 'message',
      align: 'left',
      slot: 'message',
    },
  ];

  const [registerTable, alarmTableActions] = useTable({
    api: fetchRPCAlarmListSocket,
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
    alarmTableActions.setTableData(logsRef.value);
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

  async function handleSend() {
    try {
      sending.value = true;
      const res = await rpcSendTwoway(gatewayId, {
        method: command.value,
        params: undefined as any,
        timeout: Math.max(1, timeoutSec.value) * 1000,
      });
      responseStr.value = JSON.stringify(res ?? {}, null, 2);
      showMessage(t('tb.gateway.details.rpc.sendSuccess'));
    } catch (e: any) {
      responseStr.value = JSON.stringify({ error: e?.message || String(e) }, null, 2);
    } finally {
      sending.value = false;
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

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const RPC_ALARM_LIST_CMD_ID = ref(0);

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribeAlarm();
  }

  function unsubscribeAlarm() {
    if (RPC_ALARM_LIST_CMD_ID.value > 0) {
      unsubscribe([RPC_ALARM_LIST_CMD_ID.value], {
        cmds: [{ cmdId: RPC_ALARM_LIST_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  /**
   * 订阅获取 网关下的设备列表
   */
  async function fetchRPCAlarmListSocket(pageLink?: any) {
    alarmTableActions.setLoading(true);
    // // 刷新前取消订阅
    unsubscribeAlarm();
    // 重新获取 cmdId
    RPC_ALARM_LIST_CMD_ID.value = getAndIncrementCmdId();

    send(
      [RPC_ALARM_LIST_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: RPC_ALARM_LIST_CMD_ID.value,
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
                pageSize: 1024,
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
      onRPCAlarmListMessage1,
    );
    send(
      [RPC_ALARM_LIST_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: RPC_ALARM_LIST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            tsCmd: {
              keys: ['SERVICE_LOGS'],
              startTs: 1757314818456,
              timeWindow: 604800000,
              interval: 1000,
              intervalType: 'MILLISECONDS',
              limit: 200,
              timeZoneId: 'Asia/Shanghai',
              agg: 'NONE',
            },
          },
        ],
      },
      onRPCAlarmListMessage,
    );
  }
  function onRPCAlarmListMessage1(d: any) {}
  function onRPCAlarmListMessage(socketData: any) {
    alarmTableActions.setLoading(false);
    const update = socketData?.update;
    const batch = update?.[0]?.timeseries?.SERVICE_LOGS ?? [];
    if (!Array.isArray(batch) || batch.length === 0) return;

    // 第一次收到为全量（替换），后续为增量（追加去重）
    if (logKeys.value.size === 0) {
      replaceLogs(batch);
    } else {
      appendLogs(batch);
    }
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
