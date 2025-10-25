<template>
  <div class="border-r-4px" v-loading="loading">
    <div class="px-2 pt-2 flex justify-between items-center border-b bg-white">
      <div class="flex items-center">
        <Icon icon="ant-design:arrow-left-outlined" class="cursor-pointer mr-4 text-lg" @click="goBack" />
        <span class="text-xl font-bold mr-2">{{ gatewayName || t('tb.gateway.header.gatewayFallback') }}</span>
        <Tag :color="gatewayStatus.colorClass">{{ gatewayStatus.value }}</Tag>
      </div>
      <div class="space-x-2">
        <a-button type="primary" @click="handleLaunchCommand">{{ t('tb.gateway.action.startCommand') }}</a-button>
        <a-button @click="handleGeneralConfiguration">{{ t('tb.gateway.action.generalSetting') }}</a-button>
      </div>
    </div>
    <div class="p-4 grid grid-cols-5 gap-4 bg-white">
      <div v-for="(item, index) in info" :key="index" class="stat-card">
        <div :class="['stat-indicator', item.colorClass]"></div>
        <div class="stat-content">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value ellipsis">
            <template v-if="item.parts && item.parts.length === 2">
              <span :class="[item.parts[0].class]">{{ item.parts[0].text }}</span>
              <span class="mx-1">/</span>
              <span :class="item.parts[1].class">{{ item.parts[1].text }}</span>
            </template>
            <template v-else>
              <span class="value-text ellipsis" :title="String(item.value)">{{ item.value }}</span>
            </template>
          </div>
        </div>
        <Icon v-if="item.clickable" icon="ant-design:arrow-right-outlined" class="stat-arrow" />
      </div>
    </div>

    <LaunchCommand @register="registerLaunchModal" />
    <GeneralConfigurationDrawer @register="registerDrawer" />
  </div>
</template>

<script lang="ts" setup name="GatewayDetailHeader">
  import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
  import { Tag } from 'ant-design-vue';
  import { useRoute, useRouter } from 'vue-router';

  import { Icon } from '/@/components/Icon';
  import { useDrawer } from '/@/components/Drawer';
  import { useModal } from '/@/components/Modal';

  import { useWebsocketStore } from '/@/store/modules/websocket';

  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EntityFilterType, EntityKeyType, EntityKeyValueType, StringOperation } from '/@/enums/queryEnum';

  import { useI18n } from '/@/hooks/web/useI18n';

  import LaunchCommand from '../launchCommand.vue';
  import GeneralConfigurationDrawer from '../generalConfiguration/index.vue';

  const emit = defineEmits([]);
  const { t } = useI18n('tb');
  const route = useRoute();
  const router = useRouter();

  const gatewayId = route.params.gatewayId as string;

  defineProps({
    gatewayName: {
      type: String,
      default: () => '',
    },
  });

  const gatewayStatus = computed(() => {
    const attribute = statistics.value?.latest?.ATTRIBUTE ?? {};
    const status = attribute?.active?.value === 'true';

    return {
      value: status ? t('tb.gateway.table.online') : t('tb.gateway.table.offline'),
      colorClass: status ? 'success' : 'error',
    };
  });

  const info = computed(() => {
    // error总数
    const all_errors_count = statistics.value?.latest?.TIME_SERIES?.ALL_ERRORS_COUNT?.value ?? 0;
    const entity_field = statistics.value?.latest?.ENTITY_FIELD ?? {};
    const attribute = statistics.value?.latest?.ATTRIBUTE ?? {};

    const active_connectors = parseSafeJson(attribute?.inactive_connectors?.value);
    const inactive_connectors = parseSafeJson(attribute?.inactive_connectors?.value);

    // const status = attribute?.active?.value === 'true';
    const errors_count = all_errors_count !== '' ? all_errors_count : '0';

    return [
      // {
      //   label: 'Status',
      //   value: status ? t('tb.gateway.table.online') : t('tb.gateway.table.offline'),
      //   colorClass: status ? 'bg-green-500' : 'bg-red-500',
      // },
      // { label: 'Gateway Name', value: entity_field?.name?.value || 'N/A', colorClass: 'bg-blue-500' },
      { label: t('tb.gateway.header.version'), value: attribute?.Version?.value || 'N/A', colorClass: 'bg-blue-500' },
      { label: t('tb.gateway.header.type'), value: entity_field?.type?.value || 'N/A', colorClass: 'bg-blue-500' },
      {
        label: t('tb.gateway.header.devicesActiveInactive'),
        parts: [
          { text: deviceCount.deviceActiveCount || 0, class: 'text-green-600' },
          { text: deviceCount.deviceInactiveCount || 0, class: 'text-red-600' },
        ],
        colorClass: 'bg-blue-500',
      },
      {
        label: t('tb.gateway.header.connectorsEnabledDisabled'),
        parts: [
          { text: active_connectors ? active_connectors.length : 0, class: 'text-green-600' },
          { text: inactive_connectors ? inactive_connectors.length : 0, class: 'text-red-600' },
        ],
        colorClass: 'bg-blue-500',
        clickable: false,
      },
      {
        label: t('tb.gateway.header.errors'),
        value: `${errors_count}`,
        colorClass: errors_count > 0 ? 'bg-red-500' : 'bg-green-500',
        clickable: false,
      },
    ];
  });

  function goBack() {
    router.back();
  }

  function parseSafeJson(str: string | undefined | null) {
    if (!str || str.trim() === '') {
      return null;
    }
    try {
      return JSON.parse(str);
    } catch {
      console.warn('Failed to parse JSON:', str);
      return null;
    }
  }

  const [registerLaunchModal, { openModal: openLaunchModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();

  function handleLaunchCommand() {
    openLaunchModal(true, {});
  }

  function handleGeneralConfiguration() {
    openDrawer(true, statistics.value);
  }

  //----------------  webSocket 订阅数据 ------------------

  // 统计数据
  const statistics = ref();
  // devices 统计数值
  const deviceCount = reactive({
    deviceActiveCount: 0,
    deviceInactiveCount: 0,
  });

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const loading = ref(false);

  const cmdId = reactive({
    statisticsCmdID: 0,
    deviceActiveCmdId: 0,
    deviceInactiveCmdId: 0,
  });

  onMounted(() => {
    loading.value = true;
    fetchStatisticsSocket();
    fetchDeviceCountSocket('Active');
    fetchDeviceCountSocket('Inactive');
  });

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribe([cmdId.deviceActiveCmdId, cmdId.deviceInactiveCmdId, cmdId.statisticsCmdID], {
      cmds: [
        { cmdId: cmdId.statisticsCmdID, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE },
        { cmdId: cmdId.deviceInactiveCmdId, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
        { cmdId: cmdId.deviceActiveCmdId, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
      ],
    });
  }

  /**
   * 订阅获取 统计信息的数据
   */
  async function fetchStatisticsSocket() {
    cmdId.statisticsCmdID = getAndIncrementCmdId();
    const keys = [
      {
        type: EntityKeyType.ATTRIBUTE,
        key: 'activeDevices',
      },
      {
        type: EntityKeyType.ATTRIBUTE,
        key: 'inactiveDevices',
      },
      {
        type: EntityKeyType.ATTRIBUTE,
        key: 'active_connectors',
      },
      {
        type: EntityKeyType.ATTRIBUTE,
        key: 'inactive_connectors',
      },
      {
        type: EntityKeyType.ATTRIBUTE,
        key: 'active',
      },
      {
        type: EntityKeyType.ATTRIBUTE,
        key: 'Version',
      },
      {
        type: EntityKeyType.TIME_SERIES,
        key: 'ALL_ERRORS_COUNT',
      },
    ];
    send(
      [cmdId.statisticsCmdID],
      {
        cmds: [
          {
            cmdId: cmdId.statisticsCmdID,
            type: WsCmdType.ENTITY_DATA,
            latestCmd: {
              keys,
            },
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
                  key: 'type',
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
              latestValues: keys,
            },
          },
        ],
      },
      onGatewayStatisticsMessage,
    );
  }

  /**
   * 订阅获取 设备在线的数据
   */
  async function fetchDeviceCountSocket(type: 'Active' | 'Inactive') {
    loading.value = true;
    cmdId[`device${type}CmdId`] = getAndIncrementCmdId();
    send(
      [cmdId[`device${type}CmdId`]],
      {
        cmds: [
          {
            cmdId: cmdId[`device${type}CmdId`],
            type: WsCmdType.ENTITY_COUNT,
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
              keyFilters: [
                {
                  key: {
                    type: EntityKeyType.ATTRIBUTE,
                    key: 'active',
                  },
                  valueType: EntityKeyValueType.BOOLEAN,
                  predicate: {
                    type: EntityKeyValueType.BOOLEAN,
                    operation: StringOperation.EQUAL,
                    // 不同类型,传递查询的不一致
                    value:
                      type === 'Active'
                        ? {
                            defaultValue: true,
                            dynamicValue: null,
                          }
                        : {
                            defaultValue: false,
                          },
                  },
                },
              ],
            },
          },
        ],
      },
      (socketData) => onGatewayDeviceCountMessage(socketData, type),
    );
  }

  function onGatewayStatisticsMessage(socketData: any) {
    loading.value = false;
    const data = socketData?.data;

    if (data) {
      statistics.value = data.data[0];
    }
  }

  function onGatewayDeviceCountMessage(socketData: any, type: 'Active' | 'Inactive') {
    loading.value = false;
    if (socketData?.count) {
      deviceCount[`device${type}Count`] = socketData.count;
    }
  }
</script>

<style lang="less" scoped>
  .stat-card {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid @border-color-base;
    border-radius: @border-radius-base;
    background-color: @component-background;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .stat-indicator {
      width: 4px;
      height: 32px;
      margin-right: 12px;
      border-radius: 2px;
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      font-size: 12px;
      color: @text-color-secondary;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 500;
      color: @text-color;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      display: flex;
      align-items: center;
    }

    .stat-arrow {
      color: @text-color-secondary;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: @primary-color;
      }
    }

    .value-text {
      display: inline-block;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: bottom;
    }
  }
</style>
