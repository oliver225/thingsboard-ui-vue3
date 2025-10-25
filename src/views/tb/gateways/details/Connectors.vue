<template>
  <div class="connectors-wrap">
    <div class="left">
      <Card size="small" class="stretch-card">
        <template #title>
          {{ t('tb.gateway.details.connectors.title') }}
          <Tooltip :title="t('tb.gateway.details.connectors.doubleClickTip')">
            <a>
              <Icon :icon="'ant-design:info-circle-outlined'" />
            </a>
          </Tooltip>
        </template>

        <template #extra>
          <Button type="primary" size="small" @click="openAdd()">
            {{ t('tb.gateway.details.connectors.addNew') }}
          </Button>
        </template>

        <BasicTable @register="registerTable" @row-db-click="handleRowClick">
          <template #firstColumn="{ record }">
            <a :title="record.title">{{ record?.latest?.ENTITY_FIELD?.name?.value }}</a>
          </template>

          <template #status="{ record }">
            <Tooltip>
              <template #title>
                {{
                  !record?.__enabled
                    ? t('tb.gateway.details.connectors.errorsInactive')
                    : (record?.__errorsCount ?? 0) > 0
                      ? t('tb.gateway.details.connectors.errorsCount', { count: record.__errorsCount })
                      : t('tb.gateway.details.connectors.errorsZero')
                }}
              </template>
              <span
                :class="[
                  'status-dot',
                  !record?.__enabled ? 'status-gray' : (record?.__errorsCount ?? 0) > 0 ? 'status-red' : 'status-green',
                ]"
                :title="
                  !record?.__enabled
                    ? t('tb.gateway.details.connectors.disconnected')
                    : t('tb.gateway.details.connectors.connected')
                "
              ></span>
            </Tooltip>
          </template>
        </BasicTable>
      </Card>
    </div>

    <div class="right">
      <div class="right-content">
        <Transition name="component-fade" mode="out-in" appear>
          <!-- 加载状态 -->
          <div v-if="componentLoading" key="loading" class="loading-container">
            <Spin size="large" :tip="t('tb.gateway.details.connectors.loading')">
              <div class="loading-content"></div>
            </Spin>
          </div>

          <!-- 组件内容 -->
          <component
            v-else-if="selectConnectors"
            :key="selectConnectors?.key || 'component'"
            :is="activeComp"
            v-bind="componentProps"
            @save="handleSave"
            @reset="handleReset"
          />

          <!-- 协议未支持状态 -->
          <div v-else-if="selectConnectors && !activeComp" key="unsupported" class="unsupported">
            <div class="unsupported-content">
              <div class="unsupported-icon">
                <Icon icon="ant-design:exclamation-circle-outlined" class="icon-large" />
              </div>
              <h3 class="unsupported-title">{{ t('tb.gateway.details.connectors.protocolNotSupported') }}</h3>
              <p class="unsupported-description">
                {{
                  t('tb.gateway.details.connectors.protocolDeveloping', {
                    protocol: selectConnectors.value.type?.toUpperCase(),
                  })
                }}
              </p>
              <div class="unsupported-info">
                <div class="info-item">
                  <span class="label">{{ t('tb.gateway.details.connectors.connectorName') }}</span>
                  <span class="value">{{ selectConnectors.value.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ t('tb.gateway.details.connectors.protocolType') }}</span>
                  <span class="value">{{ selectConnectors.value.type?.toUpperCase() }}</span>
                </div>
              </div>
              <div class="unsupported-actions">
                <Button @click="selectConnectors = null" size="large">
                  {{ t('tb.gateway.details.connectors.backToSelect') }}
                </Button>
                <Button type="primary" @click="openAdd" size="large">
                  {{ t('tb.gateway.details.connectors.createOther') }}
                </Button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else key="empty" class="empty">
            <div class="empty-content">
              <div class="empty-icon">
                <svg
                  t="1678886400000"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="2476"
                  width="64"
                  height="64"
                >
                  <path
                    d="M512 1024C230.4 1024 64 857.6 64 576S230.4 128 512 128s448 166.4 448 448-166.4 448-448 448z m0-832C265.6 192 128 329.6 128 576s137.6 384 384 384 384-137.6 384-384S758.4 192 512 192z"
                    p-id="2477"
                    fill="#c0c4cc"
                  />
                  <path
                    d="M512 768c-140.8 0-256-115.2-256-256s115.2-256 256-256 256 115.2 256 256-115.2 256-256 256z m0-448c-102.4 0-192 92.8-192 192s92.8 192 192 192 192-92.8 192-192-92.8-192-192-192z"
                    p-id="2478"
                    fill="#c0c4cc"
                  />
                  <path d="M512 640c-64 0-128-32-128-128h256c0 96-64 128-128 128z" p-id="2479" fill="#c0c4cc" />
                </svg>
              </div>
              <h3 class="empty-title">{{ t('tb.gateway.details.connectors.noConnectorSelected') }}</h3>
              <p class="empty-description">{{ t('tb.gateway.details.connectors.noConnectorSelectedDescription') }}</p>
              <div class="empty-actions">
                <Button type="primary" @click="openAdd" size="large">{{
                  t('tb.gateway.details.connectors.createNewConnector')
                }}</Button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <AddConnectorModal @register="registerModal" @success="handleSuccess" />
    <LogsDrawer @register="registerLogsDrawer" />
  </div>
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent, h, nextTick, onMounted, onUnmounted, ref, Transition } from 'vue';
  import { Button, Card, Switch, Tooltip, Tag, Spin } from 'ant-design-vue';
  import { useRoute } from 'vue-router';

  import { BasicTable, useTable } from '/@/components/Table';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';

  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { isEqual } from 'lodash-es';

  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';
  import { Scope } from '/@/enums/telemetryEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';

  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { deleteEntityAttributes, getAttributesByScope, saveEntityAttributesV1 } from '/@/api/tb/telemetry';

  import AddConnectorModal from './ConnectorsComp/AddConnectorModal.vue';
  import LogsDrawer from './ConnectorsComp/LogsDrawer.vue';

  import MqttConfig from './ConnectorsComp/MqttConfig.vue';
  import ModbusConfig from './ConnectorsComp/ModbusConfig.vue';
  import OpcuaConfig from './ConnectorsComp/OpcuaConfig.vue';

  import { CONNECTOR_KEY_TYPE } from '/@/enums/gateway';

  const compMap = {
    mqtt: MqttConfig,
    modbus: ModbusConfig,
    // grpc: defineAsyncComponent(() => import('./ConnectorsComp/GrpcConfig.vue')),
    opcua: OpcuaConfig,
    // ble: defineAsyncComponent(() => import('./ConnectorsComp/BleConfig.vue')),
    // request: defineAsyncComponent(() => import('./ConnectorsComp/RequestConfig.vue')),
  };

  const TIME_COUNT_KEY = '_ERRORS_COUNT';

  const props = withDefaults(
    defineProps<{
      active: boolean;
    }>(),
    {
      active: false,
    },
  );

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const route = useRoute();
  const entityId = {
    id: route.params.gatewayId as string,
    entityType: EntityType.DEVICE,
  };

  const selectConnectors = ref();
  const componentLoading = ref(false);

  const componentProps = computed(() => {
    return {
      connector: selectConnectors.value,
      version: version.value,
      connectorNames: [...activeConnectors.value, ...inactiveConnectors.value],
    };
  });

  const activeComp = computed(() => {
    if (selectConnectors.value) {
      return compMap?.[selectConnectors.value.value.type] ?? null;
    }
    return null;
  });

  const [registerTable, connectorsTableActions] = useTable({
    rowKey: (record) => record.value.name,
    rowClassName: (record: any) => {
      return selectConnectors.value?.key === record.key ? 'row-selected' : '';
    },
    columns: [
      {
        title: t('tb.gateway.details.connectors.enabled'),
        dataIndex: '__enabled',
        width: 90,
        customRender: ({ record }: any) => {
          return h(Switch, {
            size: 'small',
            checked: record.__enabled,
            'onUpdate:checked': (v: any) => onToggleEnabled(record, v),
          });
        },
      },
      { title: t('tb.gateway.details.connectors.name'), dataIndex: 'value.name' },
      {
        title: t('tb.gateway.details.connectors.type'),
        dataIndex: 'value.type',
        width: 120,
        customRender: ({ text }: any) => String(text ?? '').toUpperCase(),
      },
      {
        title: t('tb.gateway.details.connectors.configuration'),
        width: 120,
        customRender: ({ record }: any) => {
          if (!record.__skipSync) {
            return h(Tag, { color: 'red' }, { default: () => t('tb.gateway.details.connectors.outOfSync') });
          }

          return h(Tag, { color: 'blue' }, { default: () => t('tb.gateway.details.connectors.sync') });
        },
      },
      {
        title: t('tb.gateway.details.connectors.status'),
        width: 80,
        slot: 'status',
      },
    ],
    actionColumn: {
      width: 120,
      actions: (record: Recordable) => [
        {
          icon: 'ant-design:play-circle-outlined',
          color: 'success',
          title: t('tb.gateway.details.connectors.rpc'),
          disabled: !record.__skipSync,
        },
        {
          icon: 'i-ant-design:schedule-outlined',
          title: t('tb.gateway.details.connectors.logs'),
          onClick: handleOpenLogs.bind(this, { ...record }),
        },
        {
          icon: 'ant-design:delete-outlined',
          color: 'error',
          title: t('tb.gateway.details.connectors.delete'),
          onClick: handleDelete.bind(this, { ...record }),
        },
      ],
    },
    showIndexColumn: false,
    bordered: true,
    useSearchForm: false,
    showTableSetting: false,
    ellipsis: false,
  });

  const [registerModal, { openModal }] = useModal();
  const [registerLogsDrawer, { openDrawer: openLogsDrawer }] = useDrawer();

  function openAdd() {
    openModal(true, {
      version: version.value,
      inactiveConnectors: inactiveConnectors.value,
      activeConnectors: activeConnectors.value,
    });
  }

  onMounted(() => {
    nextTick(() => {
      fetch();
    });
  });

  function handleRowClick(record: Recordable) {
    // 如果点击的是同一个连接器，不需要重新加载
    if (selectConnectors.value?.key === record.key) {
      return;
    }

    // 设置加载状态并立即更新连接器数据
    componentLoading.value = true;
    selectConnectors.value = record;

    // 给异步组件加载时间
    setTimeout(() => {
      componentLoading.value = false;
    }, 200);
  }

  /**
   * 保存连接器配置
   * @param record 当前连接器配置 不包含附加信息
   * @param connector 连接器配置 包含__enabled、__skipSync等附加信息
   */
  async function handleSave(record: Recordable, connector: Recordable) {
    const scope = connector.__enabled ? Scope.SHARED_SCOPE : Scope.SERVER_SCOPE;
    const scopeKey = connector.__enabled ? CONNECTOR_KEY_TYPE.ACTIVE : CONNECTOR_KEY_TYPE.INACTIVE;

    // 1. 正常修改, 名称没有修改
    if (record.name === connector.key) {
      await saveEntityAttributesV1(entityId, scope, {
        [record.name]: record,
      });

      await fetchDetails();
    } else {
      // 2. 修改名称

      // 更新 activeConnectors 和 inactiveConnectors 需要根据__enabled状态
      const active = activeConnectors.value.filter((item) => item !== connector.key);
      const inactive = inactiveConnectors.value.filter((item) => item !== connector.key);

      connector.__enabled ? active.push(record.name) : inactive.push(record.name);

      await saveEntityAttributesV1(entityId, scope, {
        [scopeKey]: connector.__enabled ? active : inactive,
      });

      // 保存更新后的名称列表和新的connector配置
      await saveEntityAttributesV1(entityId, scope, {
        [record.name]: record,
      });

      // 删除旧的connector
      await deleteEntityAttributes(entityId, scope, [connector.key]);

      // 更新 activeConnectors 和 inactiveConnectors
      activeConnectors.value = active;
      inactiveConnectors.value = inactive;

      await fetchDetails();
    }

    // 更新 selectConnectors
    selectConnectors.value = { ...connector, value: record };
  }

  function handleReset(resetConnector: Recordable) {
    // 更新 selectConnectors 为重置后的数据
    selectConnectors.value = resetConnector;
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.gateway.details.connectors.deleteConnectorConfirm', { name: record.key }),
      content: t('tb.gateway.details.connectors.allConnectorDataWillBeDeleted'),
      centered: false,
      okText: t('tb.gateway.action.deleteText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          const scope = record.__enabled ? Scope.SHARED_SCOPE : Scope.SERVER_SCOPE;
          const scopeKey = record.__enabled ? CONNECTOR_KEY_TYPE.ACTIVE : CONNECTOR_KEY_TYPE.INACTIVE;

          // 如果删除的是当前选中的连接器，清空选中状态
          if (selectConnectors.value?.key === record.key) {
            selectConnectors.value = null;
          }

          // 删除当前点击
          await deleteEntityAttributes(entityId, scope, [record.key]);

          // 从activeConnectors和inactiveConnectors当中获取对应状态的 inactive_connectors或者active_connectors
          const active = activeConnectors.value.filter((item) => item !== record.key);
          const inactive = inactiveConnectors.value.filter((item) => item !== record.key);

          await saveEntityAttributesV1(entityId, scope, {
            [scopeKey]: record.__enabled ? active : inactive,
          });

          // 更新 activeConnectors 和 inactiveConnectors
          activeConnectors.value = active;
          inactiveConnectors.value = inactive;

          await fetchDetails();
          showMessage(t('tb.gateway.details.connectors.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        }
      },
    });
  }

  function handleSuccess(active: string[], inactive: string[]) {
    activeConnectors.value = active;
    fetchDetails();
  }

  function handleOpenLogs(record: Recordable) {
    openLogsDrawer(true, {
      connectorName: record?.value?.name || record?.key,
      gatewayId: entityId.id,
    });
  }

  // 切换启用状态：不更新 dataSource / connectorsNames，仅生成 active/inactive 名称集合
  async function onToggleEnabled(record: any, v: any) {
    connectorsTableActions.setLoading(true);

    const name = String(record?.key ?? '');

    const active: string[] = v
      ? [...activeConnectors.value, name]
      : activeConnectors.value.filter((item) => item !== name);

    const inactive: string[] = v
      ? inactiveConnectors.value.filter((item) => item !== name)
      : [...inactiveConnectors.value, name];

    const config = dataSource.value.find((item) => item.key === name);

    // 更新激活
    await saveEntityAttributesV1(entityId, Scope.SHARED_SCOPE, {
      [CONNECTOR_KEY_TYPE.ACTIVE]: active,
    });
    // 更新关闭
    await saveEntityAttributesV1(entityId, Scope.SERVER_SCOPE, {
      [CONNECTOR_KEY_TYPE.INACTIVE]: inactive,
    });
    // 删除当前点击
    await deleteEntityAttributes(entityId, v ? Scope.SERVER_SCOPE : Scope.SHARED_SCOPE, [record.key]);
    // 保存当前点击
    await saveEntityAttributesV1(entityId, v ? Scope.SHARED_SCOPE : Scope.SERVER_SCOPE, {
      [record.key]: config.value,
    });

    // 更新 activeConnectors 和 inactiveConnectors
    activeConnectors.value = active;
    inactiveConnectors.value = inactive;

    // 更新列表及socket
    await fetchDetails();
  }

  // 列表数据
  const dataSource = ref<any>([]);
  // version
  const version = ref<string>('');

  const activeConnectors = ref<string[]>([]);
  const inactiveConnectors = ref<string[]>([]);

  const activeConnectorsData = ref<any>([]);
  const inactiveConnectorsData = ref<any>([]);
  const clientConnectorsData = ref<any>([]);

  // 初始化更新
  async function fetch() {
    connectorsTableActions.setLoading(true);

    // 获取共享属性
    const __active = await getAttributesByScope(entityId, Scope.SHARED_SCOPE, {
      keys: CONNECTOR_KEY_TYPE.ACTIVE,
    });

    // 获取服务端属性
    const __inactive = await getAttributesByScope(entityId, Scope.SERVER_SCOPE, {
      keys: CONNECTOR_KEY_TYPE.INACTIVE,
    });

    activeConnectors.value = __active.map((item) => item.value as unknown as string).flatMap((item) => item);
    inactiveConnectors.value = __inactive.map((item) => item.value as unknown as string).flatMap((item) => item);

    // 获取客户端属性
    const versionRes = await getAttributesByScope(entityId, Scope.CLIENT_SCOPE, { keys: 'Version' });
    if (versionRes.length) {
      version.value = versionRes[0].value as unknown as string;
    }

    fetchDetails();
  }
  // 更新列表详细内容及socket
  async function fetchDetails() {
    connectorsTableActions.setLoading(true);

    // 共享属性
    const activeConnectorData = await getAttributesByScope(entityId, Scope.SHARED_SCOPE);
    // 服务端属性
    const inactiveConnectorData = await getAttributesByScope(entityId, Scope.SERVER_SCOPE);
    // 服务端属性
    const clientConnectorData = await getAttributesByScope(entityId, Scope.CLIENT_SCOPE);

    // 过滤出共享属性中包含的activeConnectors和inactiveConnectors
    const active = activeConnectorData.filter((item) => activeConnectors.value.includes(item.key as string));
    const inactive = inactiveConnectorData.filter((item) => inactiveConnectors.value.includes(item.key as string));
    const client = clientConnectorData.filter((item) => activeConnectors.value.includes(item.key as string));

    activeConnectorsData.value = active;
    inactiveConnectorsData.value = inactive;
    clientConnectorsData.value = client;

    // 合并数据
    const combinedData = [...active, ...inactive, ...client];

    // 处理
    const latestData = combinedData.reduce((acc, attribute) => {
      const existingItemIndex = acc.findIndex((item) => item.key === attribute.key);

      const enabled = activeConnectors.value.includes(attribute.key as string);

      if (existingItemIndex === -1) {
        acc.push({ ...attribute, __enabled: enabled, __errorsCount: 0 });
      } else if (
        attribute.lastUpdateTs &&
        attribute.lastUpdateTs > acc[existingItemIndex].lastUpdateTs &&
        !isConnectorSynced(acc[existingItemIndex])
      ) {
        acc[existingItemIndex] = { ...attribute, __skipSync: true, __enabled: enabled, __errorsCount: 0 };
      }

      return acc;
    }, []);

    dataSource.value = latestData;
    connectorsTableActions.setTableData(dataSource.value);

    if (latestData.length) {
      fetchInitErrorCountSocket();
      fetchInitConnectorClientAttributeSocket();
    } else {
      connectorsTableActions.setLoading(false);
    }
  }

  /**
   * 判断连接器配置是否相同
   * @param sharedDataConfigJson 共享属性中的配置
   * @param connectorDataConfigJson 当前连接器配置
   */
  function hasSameConfigFn(sharedDataConfigJson, connectorDataConfigJson): boolean {
    const { name, id, enableRemoteLogging, logLevel, reportStrategy, configVersion, ...sharedDataConfig } =
      sharedDataConfigJson;
    const {
      name: connectorName,
      id: connectorId,
      enableRemoteLogging: connectorEnableRemoteLogging,
      logLevel: connectorLogLevel,
      reportStrategy: connectorReportStrategy,
      configVersion: connectorConfigVersion,
      ...connectorConfig
    } = connectorDataConfigJson;

    return isEqual(sharedDataConfig, connectorConfig);
  }

  /**
   * 判断连接器是否同步
   * @param attribute
   */
  function isConnectorSynced(attribute): boolean {
    const connectorData = attribute.value;

    if (!connectorData.ts || attribute.__skipSync || !props.active) {
      return false;
    }
    const clientIndex = activeConnectorsData.value.findIndex((data) => {
      const sharedData = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return sharedData.name === connectorData.name;
    });

    if (clientIndex === -1) {
      return false;
    }
    const sharedIndex = inactiveConnectorsData.value.findIndex((data) => {
      const sharedData = data.value;
      const hasSameName = sharedData.name === connectorData.name;
      const hasEmptyConfig = isEqual(sharedData.configurationJson, {}) && hasSameName;
      const hasSameConfig = hasSameConfigFn(sharedData.configurationJson, connectorData.configurationJson);
      const isRecentlyCreated = sharedData.ts && sharedData.ts <= connectorData.ts;
      return hasSameName && isRecentlyCreated && (hasSameConfig || hasEmptyConfig);
    });
    return sharedIndex !== -1;
  }

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const CONNECTORS_ERROR_COUNT_CMD_ID = ref(0);
  const CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID = ref(0);

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribeDevice();
    unsubscribeAttribute();
  }

  function unsubscribeDevice() {
    if (CONNECTORS_ERROR_COUNT_CMD_ID.value > 0) {
      unsubscribe([CONNECTORS_ERROR_COUNT_CMD_ID.value], {
        cmds: [{ cmdId: CONNECTORS_ERROR_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  function unsubscribeAttribute() {
    if (CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value > 0) {
      unsubscribe([CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value], {
        cmds: [{ cmdId: CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  async function fetchInitConnectorClientAttributeSocket() {
    const cmds = {
      cmdId: CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value,
      type: WsCmdType.ATTRIBUTES,
      entityId: entityId.id,
      entityType: entityId.entityType,
      scope: Scope.CLIENT_SCOPE,
    };

    if (CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value > 0) {
      send([CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value], {
        cmds: [
          {
            ...cmds,
            unsubscribe: true,
          },
        ],
      });
    }

    CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value = getAndIncrementCmdId();

    send(
      [CONNECTOR_CLIENT_ATTRIBUTE_CMD_ID.value],
      {
        cmds: [cmds],
      },
      onConnectorsCountMessage,
    );
  }

  /**
   * 初始化获取网关下所有连接器的错误数量
   */
  async function fetchInitErrorCountSocket() {
    // 刷新前取消订阅
    unsubscribeDevice();
    // 重新获取 cmdId
    CONNECTORS_ERROR_COUNT_CMD_ID.value = getAndIncrementCmdId();

    send(
      [CONNECTORS_ERROR_COUNT_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: CONNECTORS_ERROR_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: entityId,
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
              latestValues: [...activeConnectors.value, ...inactiveConnectors.value].map((item) => ({
                type: EntityKeyType.TIME_SERIES,
                key: `${item}${TIME_COUNT_KEY}`,
              })),
            },
          },
        ],
      },
      onConnectorsCountMessage,
    );
  }

  // 初始化表格 status 字段, 并发送后续订阅
  function onConnectorsCountMessage(socketData: any) {
    connectorsTableActions.setLoading(false);
    const data = socketData?.data?.data;
    if (data?.[0]?.latest?.TIME_SERIES) {
      renderSocketToTable(data?.[0]?.latest?.TIME_SERIES);

      // 订阅后续更新
      send(
        [CONNECTORS_ERROR_COUNT_CMD_ID.value],
        {
          cmds: [
            {
              cmdId: CONNECTORS_ERROR_COUNT_CMD_ID.value,
              type: WsCmdType.ENTITY_DATA,
              latestCmd: {
                keys: [...activeConnectors.value, ...inactiveConnectors.value].map((item) => ({
                  type: EntityKeyType.TIME_SERIES,
                  key: `${item}${TIME_COUNT_KEY}`,
                })),
              },
            },
          ],
        },
        onUpdateConnectorsCountMessage,
      );
    }
  }

  // 更新表格 status 字段
  function onUpdateConnectorsCountMessage(socketData: any) {
    const data = socketData?.update?.[0]?.latest?.TIME_SERIES;
    renderSocketToTable(data);
  }

  function renderSocketToTable(data) {
    if (!data) return;

    // 提取这次返回中包含的 connector 名称集合
    const presentNames = new Set<string>(Object.keys(data).map((k) => k.replace(TIME_COUNT_KEY, '')));

    presentNames.forEach((name) => {
      const conn = dataSource.value.find((conn) => conn.value.name === name);
      if (conn) {
        conn.__errorsCount = data[`${name}${TIME_COUNT_KEY}`].value;
        connectorsTableActions.updateTableDataRecord(name, conn);
      }
    });
  }
</script>

<style scoped lang="less">
  .connectors-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    height: 98%;
  }

  .left {
    min-width: 520px;
    display: flex;
    flex-direction: column;
  }

  .left-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .right {
    min-width: 340px;
    display: flex;
    flex-direction: column;
  }

  .right-content {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  :deep(.row-selected) td {
    background-color: fade(@primary-color, 12%) !important;
  }
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .status-green {
    background: @green-5;
  }
  .status-gray {
    background: @text-color-secondary;
  }
  .status-red {
    background: @red-5;
  }
  .stretch-card {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .stretch-card :deep(.ant-card-body) {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
  .title {
    font-weight: 600;
  }

  .loading-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 4px;

    .loading-content {
      width: 100%;
      height: 200px;
    }
  }

  // 组件过渡动画
  .component-fade-enter-active,
  .component-fade-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .component-fade-enter-from {
    opacity: 0;
    transform: translateY(15px);
  }

  .component-fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }

  .component-fade-enter-to,
  .component-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
  }

  // 确保组件内容也使用绝对定位
  .right-content > .component-fade-enter-active:not(.loading-container):not(.empty),
  .right-content > .component-fade-leave-active:not(.loading-container):not(.empty) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .unsupported {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    // border: 1px solid #ffd666;
    border-radius: 4px;

    &-content {
      text-align: center;
      padding: 40px 20px;
      max-width: 400px;
    }

    &-icon {
      margin-bottom: 16px;

      .icon-large {
        font-size: 48px;
        color: #fa8c16;
      }
    }

    &-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 500;
      color: @text-color;
    }

    &-description {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: @text-color-secondary;
      line-height: 1.5;
    }

    &-info {
      background: #fffbe6;
      border: 1px solid #fff1b8;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          font-size: 13px;
          color: @text-color-secondary;
        }

        .value {
          font-size: 13px;
          font-weight: 500;
          color: @text-color;
        }
      }
    }

    &-actions {
      display: flex;
      gap: 12px;
      justify-content: center;

      button {
        min-width: 120px;
      }
    }
  }

  .empty {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;

    &-content {
      text-align: center;
      padding: 40px 20px;
    }

    &-icon {
      margin-bottom: 16px;

      svg {
        opacity: 0.6;
      }
    }

    &-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
      color: @text-color;
    }

    &-description {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: @text-color-secondary;
      line-height: 1.5;
    }

    &-actions {
      button {
        margin: 0 auto;
      }
    }
  }
</style>
