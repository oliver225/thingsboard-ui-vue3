<template>
  <div class="flex flex-col h-full">
    <DetailHeader :gatewayName="gatewayName" class="mb-4" />

    <Tabs v-model:activeKey="tabActiveKey" class="gateways-detail-menu" type="line" :animated="false" size="large">
      <TabPane v-for="tab in tabList" :key="tab.value" :disabled="tab.disabled">
        <template #tab>
          <Icon :icon="tab.icon" :size="16" />
          <Tooltip :title="tab.disabled ? t('tb.gateway.tabs.disabledTip') : tab.label">
            {{ tab.label }}
          </Tooltip>
        </template>
      </TabPane>
    </Tabs>

    <div class="flex-1">
      <Base v-if="tabActiveKey === 'base'" />
      <Shell v-else-if="tabActiveKey === 'remote_shell'" :gatewayName="gatewayName" />
      <RPC v-else-if="tabActiveKey === 'rpc'" :gatewayName="gatewayName" />
      <Logs v-else-if="tabActiveKey === 'logs'" :gatewayName="gatewayName" />
      <Statistics v-else-if="tabActiveKey === 'statistics'" :gatewayName="gatewayName" />
      <Connectors v-else-if="tabActiveKey === 'connectors'" :gatewayName="gatewayName" :active="active" />
      <div v-else class="p-4 text-gray-500">{{ t('tb.gateway.tabs.comingSoon') }}</div>
    </div>
  </div>
</template>
<script lang="ts" setup name="GatewayDetail">
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { Tabs, TabPane, Tooltip } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');

  import { useWebsocketStore } from '/@/store/modules/websocket';

  import { Icon } from '/@/components/Icon';

  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';

  import { GatewaySocketData } from '/@/api/tb/gateways/types';

  import DetailHeader from './details/DetailHeader.vue';
  import Base from './details/Base.vue';
  import Shell from './details/Shell.vue';
  import RPC from './details/RPC.vue';
  import Logs from './details/Logs.vue';
  import Connectors from './details/Connectors.vue';
  import Statistics from './details/Statistics.vue';

  const route = useRoute();
  const gatewayId = route.params.gatewayId as string;

  const tabActiveKey = ref('base');

  // 网关名称
  const gatewayName = computed(() => gatewayGeneralConfig.value?.latest?.ENTITY_FIELD?.name?.value ?? '');
  // 基础配置
  const general_configuration = computed(() => {
    const value = gatewayGeneralConfig.value?.latest.ATTRIBUTE?.general_configuration?.value;
    if (!value && value === '') {
      return {};
    }
    return JSON.parse(value ?? '{}');
  });
  // logger 等级
  const RemoteLoggingLevel = computed(() => {
    const value = gatewayGeneralConfig.value?.latest.ATTRIBUTE?.RemoteLoggingLevel?.value;
    if (!value && value === '') {
      return 'NONE';
    }
    return value;
  });

  const active = computed(() => {
    const value = gatewayGeneralConfig.value?.latest.ATTRIBUTE?.active?.value;
    return value === 'true';
  });

  const tabList = computed(() => {
    return [
      {
        value: 'base',
        label: t('tb.gateway.tabs.base'),
        icon: 'ant-design:dashboard-outlined',
        disabled: false,
      },
      {
        value: 'connectors',
        label: t('tb.gateway.tabs.connectors'),
        icon: 'ant-design:deployment-unit-outlined',
        disabled: false,
      },
      {
        value: 'logs',
        label: t('tb.gateway.tabs.logs'),
        icon: 'ant-design:file-text-outlined',
        disabled: RemoteLoggingLevel.value === 'NONE',
      },
      {
        value: 'statistics',
        label: t('tb.gateway.tabs.statistics'),
        icon: 'ant-design:area-chart-outlined',
        disabled: false,
      },
      {
        value: 'remote_shell',
        label: t('tb.gateway.tabs.remoteShell'),
        icon: 'ant-design:code-outlined',
        disabled: !general_configuration.value?.remoteShell,
      },
      {
        value: 'rpc',
        label: t('tb.gateway.tabs.rpc'),
        icon: 'ant-design:interaction-outlined',
        disabled: false,
      },
    ];
  });

  //----------------  webSocket 订阅数据 ------------------

  const gatewayGeneralConfig = ref<GatewaySocketData>();

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const GATEWAY_INFO_CMD_ID = ref(0);
  const loading = ref(false);

  onMounted(async () => {
    await fetchGeneralConfigSocket();
  });

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    if (GATEWAY_INFO_CMD_ID.value > 0) {
      unsubscribe([GATEWAY_INFO_CMD_ID.value], {
        cmds: [{ cmdId: GATEWAY_INFO_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }

  /**
   * 订阅获取 general_configuration RemoteLoggingLevel 的配置, 控制相关操作是否操作
   */
  async function fetchGeneralConfigSocket() {
    loading.value = true;
    // 刷新前取消订阅
    unsubscribeAll();
    // 重新获取 cmdId
    GATEWAY_INFO_CMD_ID.value = getAndIncrementCmdId();

    send(
      [GATEWAY_INFO_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: GATEWAY_INFO_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            latestCmd: {
              keys: [
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'general_configuration',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'RemoteLoggingLevel',
                },
              ],
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
                  key: 'general_configuration',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'RemoteLoggingLevel',
                },
                {
                  type: EntityKeyType.ATTRIBUTE,
                  key: 'active',
                },
              ],
            },
          },
        ],
      },
      onGatewayDetailGeneralConfigMessage,
    );
  }

  function onGatewayDetailGeneralConfigMessage(socketData: any) {
    loading.value = false;

    const data = socketData?.data;

    if (data) {
      gatewayGeneralConfig.value = data.data[0];
    }
  }
</script>
<style lang="less" scoped>
  .gateways-detail-menu {
    :deep(.ant-tabs-nav) {
      margin-bottom: 8px;
      &::before {
        border-color: @border-color-split;
      }
    }

    :deep(.ant-tabs-nav-wrap) {
      background-color: @background-color-light;
      border-radius: 8px;
      padding: 4px;
    }

    :deep(.ant-tabs-tab) {
      margin: 0 4px;
      padding: 10px 14px !important;
      color: @text-color-secondary;
      border-radius: 6px;
      transition:
        background-color 0.2s ease,
        color 0.2s ease;
    }

    /* Hover 仅对未禁用的标签生效 */
    :deep(.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover) {
      background-color: fade(@primary-color, 8%);
      color: @primary-color;
    }

    /* 禁用态样式 */
    :deep(.ant-tabs-tab.ant-tabs-tab-disabled) {
      cursor: not-allowed !important;
      color: @disabled-color !important;
      opacity: 0.55;
      filter: grayscale(100%);
      background: transparent !important;
    }

    :deep(.ant-tabs-tab.ant-tabs-tab-disabled .ant-tabs-tab-btn) {
      color: @disabled-color !important;
    }

    :deep(.ant-tabs-tab-active) {
      .ant-tabs-tab-btn {
        color: @primary-color;
        font-weight: 600;
      }
      background-color: fade(@primary-color, 12%);
    }

    :deep(.ant-tabs-ink-bar) {
      height: 3px;
      border-radius: 2px;
      background: @primary-color;
    }
  }
</style>
