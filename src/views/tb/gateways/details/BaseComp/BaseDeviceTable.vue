<template>
  <Card :tab-list="tabListNoTitle" :active-tab-key="cardActiveTabKey" @tabChange="(key) => onTabChange(key)">
    <BasicTable @register="registerTable" />
  </Card>
</template>

<script lang="ts" setup name="GatewayBase">
  import { computed, h, onMounted, onUnmounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Card, Tag } from 'ant-design-vue';

  import { BasicTable, useTable } from '/@/components/Table';

  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EntityFilterType, EntityKeyType, EntityKeyValueType, StringOperation } from '/@/enums/queryEnum';
  import { useI18n } from '/@/hooks/web/useI18n';

  const { t } = useI18n('tb');
  const route = useRoute();
  const router = useRouter();
  const gatewayId = route.params.gatewayId as string;

  const tabListNoTitle = computed(() => {
    const base = [
      {
        key: 'ALL',
        tab: t('common.all'),
      },
    ];

    const types: any[] = [
      ...new Set(
        gatewayDeviceAll.value
          ?.map((item) => item?.latest?.ATTRIBUTE?.connectorType?.value as string)
          ?.filter((value): value is string => typeof value === 'string' && value !== ''),
      ),
    ];

    types.forEach((key) => {
      base.push({
        key: key,
        tab: key.toUpperCase(),
      });
    });

    return base;
  });

  const cardActiveTabKey = ref('ALL');

  const [registerTable, deviceTableActions] = useTable({
    api: fetchGatewayDeviceListSocket,
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
        title: t('tb.gateway.table.name'),
        dataIndex: 'latest.ENTITY_FIELD.name.value',
        key: 'name',
        sorter: true,
        align: 'left',
        fixed: 'left',
        ellipsis: false,
      },
      { title: t('tb.gateway.details.devices.table.deviceType'), dataIndex: 'latest.ENTITY_FIELD.type.value' },
      {
        title: t('tb.gateway.table.status'),
        dataIndex: 'latest.ATTRIBUTE.active.value',
        key: 'active',
        align: 'center',
        width: 100,
        filterMultiple: false,
        filters: [
          { text: t('tb.gateway.table.online'), value: 'true' },
          { text: t('tb.gateway.table.offline'), value: 'false' },
        ],
        customRender: ({ text }) => {
          if (text === 'true') {
            return h(Tag, { color: 'success' }, () => t('tb.gateway.table.online'));
          }

          return h(Tag, { color: 'error' }, () => t('tb.gateway.table.offline'));
        },
      },
      { title: t('tb.gateway.details.devices.table.connectorName'), dataIndex: 'latest.ATTRIBUTE.connectorName.value' },
      { title: t('tb.gateway.details.devices.table.connectorType'), dataIndex: 'latest.ATTRIBUTE.connectorType.value' },
    ],
    actionColumn: {
      width: 80,
      actions: (record: Recordable) => [
        {
          icon: 'i-ant-design:eye-outlined',
          title: t('tb.gateway.details.devices.action.showDeviceInfo'),
          onClick: showDeviceInfo.bind(this, { ...record }),
        },
      ],
    },
    showIndexColumn: false,
    bordered: true,
    useSearchForm: false,
    showTableSetting: false,
    pagination: { pageSize: 10 },
  });

  const onTabChange = (value: string) => {
    cardActiveTabKey.value = value;
    deviceTableActions.reload();
  };

  function showDeviceInfo(record: Recordable) {
    router.push(`/device/list`);
  }

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const GATEWAY_DEVICE_LIST_CMD_ID = ref(0);
  const GATEWAY_DEVICE_ALL_CMD_ID = ref(0);

  const gatewayDeviceAll = ref();

  const loading = ref(false);

  onMounted(async () => {
    await fetchGatewayAllDeviceSocket();
  });

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribeDevice();
    unsubscribeDeviceAll();
  }

  function unsubscribeDevice() {
    if (GATEWAY_DEVICE_LIST_CMD_ID.value > 0) {
      unsubscribe([GATEWAY_DEVICE_LIST_CMD_ID.value], {
        cmds: [{ cmdId: GATEWAY_DEVICE_LIST_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  function unsubscribeDeviceAll() {
    if (GATEWAY_DEVICE_ALL_CMD_ID.value > 0) {
      unsubscribe([GATEWAY_DEVICE_ALL_CMD_ID.value], {
        cmds: [{ cmdId: GATEWAY_DEVICE_ALL_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  /**
   * 订阅获取 网关下的设备列表
   */
  async function fetchGatewayDeviceListSocket(pageLink?: any) {
    deviceTableActions.setLoading(true);
    // 刷新前取消订阅
    unsubscribeDevice();
    // 重新获取 cmdId
    GATEWAY_DEVICE_LIST_CMD_ID.value = getAndIncrementCmdId();

    let keyFilters;
    if (cardActiveTabKey.value !== 'ALL') {
      keyFilters = [
        {
          key: {
            type: EntityKeyType.ATTRIBUTE,
            key: 'connectorType',
          },
          valueType: EntityKeyValueType.STRING,
          predicate: {
            operation: StringOperation.EQUAL,
            value: {
              defaultValue: cardActiveTabKey.value,
              dynamicValue: null,
            },
            ignoreCase: true,
            type: EntityKeyValueType.STRING,
          },
        },
      ];
    }

    send(
      [GATEWAY_DEVICE_LIST_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: GATEWAY_DEVICE_LIST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            latestCmd: {
              keys: [
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'active',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'connectorName',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'connectorType',
                },
              ],
            },
            query: {
              entityFilter: {
                type: EntityFilterType.RELATIONS_QUERY,
                resolveMultiple: true,
                rootStateEntity: true,
                stateEntityParamName: null,
                defaultStateEntity: null,
                rootEntity: {
                  id: gatewayId,
                  entityType: EntityType.DEVICE,
                },
                direction: 'FROM',
                maxLevel: 1,
                fetchLastLevelOnly: false,
                filters: [
                  {
                    relationType: 'Created',
                    entityTypes: ['DEVICE'],
                  },
                ],
              },
              pageLink: {
                page: 0,
                pageSize: 10,
                textSearch: null,
                dynamic: true,
                sortOrder: {
                  key: {
                    key: 'name',
                    type: EntityKeyType.ENTITY_FIELD,
                  },
                  direction: 'ASC',
                },
                ...pageLink,
              },
              keyFilters,
              entityFields: [
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'type',
                },
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
              latestValues: [
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'active',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'connectorName',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'connectorType',
                },
              ],
            },
          },
        ],
      },
      onGatewayDeviceListMessage,
    );
  }

  /**
   * 订阅获取 网关下的所有设备列表, 获取类型
   */
  async function fetchGatewayAllDeviceSocket() {
    loading.value = true;
    // 刷新前取消订阅
    unsubscribeDeviceAll();
    // 重新获取 cmdId
    GATEWAY_DEVICE_ALL_CMD_ID.value = getAndIncrementCmdId();

    send(
      [GATEWAY_DEVICE_ALL_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: GATEWAY_DEVICE_ALL_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            latestCmd: {
              keys: [
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'connectorType',
                },
              ],
            },
            query: {
              entityFilter: {
                type: EntityFilterType.RELATIONS_QUERY,
                resolveMultiple: true,
                rootStateEntity: true,
                stateEntityParamName: null,
                defaultStateEntity: null,
                rootEntity: {
                  id: gatewayId,
                  entityType: EntityType.DEVICE,
                },
                direction: 'FROM',
                maxLevel: 1,
                fetchLastLevelOnly: false,
                filters: [
                  {
                    relationType: 'Created',
                    entityTypes: ['DEVICE'],
                  },
                ],
              },
              pageLink: {
                page: 0,
                pageSize: 1024,
                textSearch: null,
                dynamic: true,
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
              latestValues: [
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'connectorType',
                },
              ],
            },
          },
        ],
      },
      onGatewayDeviceAllMessage,
    );
  }

  function onGatewayDeviceListMessage(socketData: any) {
    deviceTableActions.setLoading(false);
    const data = socketData?.data;

    if (data) {
      deviceTableActions.setTableData(data?.data ?? []);
      deviceTableActions.setPagination({
        total: data?.totalElements ?? 0,
      });
    }
  }

  function onGatewayDeviceAllMessage(socketData: any) {
    deviceTableActions.setLoading(false);
    const data = socketData?.data;

    if (data) {
      gatewayDeviceAll.value = data?.data ?? [];
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
