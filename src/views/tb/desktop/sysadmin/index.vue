<template>
  <div>
    <Row :gutter="16">
      <Col span="24">
        <Row :gutter="[16, 16]">
          <Col span="12">
            <Row :gutter="[16, 16]">
              <Col span="12">
                <Card size="small" title="租户">
                  <template #extra>
                    <a-button size="small" type="primary" @click="() => go('/tenant/list')">添加租户</a-button>
                  </template>
                  <div class="p-2">
                    <CountTo :endVal="tenantCount" class="text-xl font-bold" />
                  </div>
                </Card>
              </Col>
              <Col span="12">
                <Card size="small" title="租户配置">
                  <template #extra>
                    <a-button size="small" type="default" @click="() => go('/tenant-profile/list')">添加配置</a-button>
                  </template>
                  <div class="p-2">
                    <CountTo :endVal="tenantProfileCount" class="text-xl font-bold" />
                  </div>
                </Card>
              </Col>
              <Col span="6">
                <Card size="small" title="设备">
                  <template #extra>
                    <Icon icon="ant-design:database-outlined" :size="18" color="green" />
                  </template>
                  <div class="p-2">
                    <CountTo :endVal="deviceCount" class="text-xl font-bold" />
                  </div>
                </Card>
              </Col>
              <Col span="6">
                <Card size="small" title="资产">
                  <template #extra>
                    <Icon icon="ant-design:desktop-outlined" :size="18" color="orange" />
                  </template>
                  <div class="p-2">
                    <CountTo :endVal="assetCount" class="text-xl font-bold" />
                  </div>
                </Card>
              </Col>
              <Col span="6">
                <Card size="small" title="用户">
                  <template #extra>
                    <Icon icon="ant-design:user-outlined" :size="18" color="purple" />
                  </template>
                  <div class="p-2">
                    <CountTo :endVal="userCount" class="text-xl font-bold" />
                  </div>
                </Card>
              </Col>
              <Col span="6">
                <Card size="small" title="客户">
                  <template #extra>
                    <Icon icon="ant-design:team-outlined" :size="18" />
                  </template>
                  <div class="p-2">
                    <CountTo :endVal="customerCount" class="text-xl font-bold" />
                  </div>
                </Card>
              </Col>
              <Col span="24">
                <Card size="small" :tab-list="tabListTitle" :active-tab-key="activeKey" @tabChange="onTabChange">
                  <p v-if="activeKey === 'tab1'">
                    <MessageTransportBar />
                  </p>
                  <p v-if="activeKey === 'tab2'">
                    <StorageDataPointsBar />
                  </p>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span="12">
            <Row :gutter="[16, 16]">
              <Col span="8">
                <Card size="small">
                  <div class="text-lg mt-4 mb-2"> CPU </div>
                  <div class="p-2">
                    <CountTo :endVal="cpuUsage" suffix="%" class="text-xl font-bold" />
                    <span class="font-bold text-slate-400"> | {{ cpuCount }} cores</span>
                  </div>
                </Card>
              </Col>
              <Col span="8">
                <Card size="small">
                  <div class="text-lg mt-4 mb-2"> 内存 </div>
                  <div class="p-2">
                    <CountTo :endVal="memoryUsage" suffix="%" class="text-xl font-bold" />
                    <span class="font-bold text-slate-400"> | {{ convertBytesToSize(totalMemory) }} </span>
                  </div>
                </Card>
              </Col>
              <Col span="8">
                <Card size="small">
                  <div class="text-lg mt-4 mb-2"> 硬盘 </div>
                  <div class="p-2">
                    <CountTo :endVal="discUsage" suffix="%" class="text-xl font-bold" />
                    <span class="font-bold text-slate-400"> | {{ convertBytesToSize(totalDiscSpace) }}</span>
                  </div>
                </Card>
              </Col>
              <Col span="24">
                <Card size="small" title="服务器状态">
                  <CpuStateLine height="400px" />
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span="24">
            <Card size="small">
              <GeoMap height="600px" />
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  </div>
</template>
<script lang="ts" setup>
  import { Card, Row, Col } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { CountTo } from '/@/components/CountTo/index';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { useGo } from '/@/hooks/web/usePage';
  import GeoMap from '../components/chart/GeoMap.vue';
  import MessageTransportBar from '../components/chart/MessageTransportBar.vue';
  import StorageDataPointsBar from '../components/chart/StorageDataPointsBar.vue';
  import CpuStateLine from '../components/chart/CpuStateLine.vue';
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { isArray } from 'lodash-es';
  const go = useGo();
  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const TENANT_COUNT_CMD_ID = ref(0);
  const TENANT_PROFILE_COUNT_CMD_ID = ref(0);
  const DEVICE_COUNT_CMD_ID = ref(0);
  const ASSET_COUNT_CMD_ID = ref(0);
  const USER_COUNT_CMD_ID = ref(0);
  const CUSTOMER_COUNT_CMD_ID = ref(0);
  const CPU_STATUS_CMD_ID = ref(0);

  const tenantCount = ref(0);
  const tenantProfileCount = ref(0);
  const deviceCount = ref(0);
  const assetCount = ref(0);
  const userCount = ref(0);
  const customerCount = ref(0);

  const cpuUsage = ref(0);
  const cpuCount = ref(0);
  const memoryUsage = ref(0);
  const totalMemory = ref(0);
  const discUsage = ref(0);
  const totalDiscSpace = ref(0);

  const activeKey = ref('tab1');
  const tabListTitle = [
    {
      key: 'tab1',
      tab: '信息传输',
    },
    {
      key: 'tab2',
      tab: '实时数据存储点数',
    },
  ];

  function onTabChange(key) {
    activeKey.value = key;
  }

  function sendEntityCountPacket() {
    send(
      [
        TENANT_COUNT_CMD_ID.value,
        TENANT_PROFILE_COUNT_CMD_ID.value,
        DEVICE_COUNT_CMD_ID.value,
        ASSET_COUNT_CMD_ID.value,
        USER_COUNT_CMD_ID.value,
        CUSTOMER_COUNT_CMD_ID.value,
        CPU_STATUS_CMD_ID.value,
      ],
      {
        cmds: [
          {
            cmdId: TENANT_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.TENANT,
                resolveMultiple: true,
              },
            },
          },
          {
            cmdId: TENANT_PROFILE_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.TENANT_PROFILE,
                resolveMultiple: true,
              },
            },
          },
          {
            cmdId: DEVICE_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.DEVICE,
                resolveMultiple: true,
              },
            },
          },
          {
            cmdId: ASSET_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.ASSET,
                resolveMultiple: true,
              },
            },
          },
          {
            cmdId: USER_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.USER,
                resolveMultiple: true,
              },
            },
          },
          {
            cmdId: CUSTOMER_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.CUSTOMER,
                resolveMultiple: true,
              },
            },
          },
          {
            cmdId: CPU_STATUS_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            latestCmd: {
              keys: [
                { type: 'TIME_SERIES', key: 'cpuUsage' },
                { type: 'TIME_SERIES', key: 'cpuCount' },
                { type: 'TIME_SERIES', key: 'memoryUsage' },
                { type: 'TIME_SERIES', key: 'totalMemory' },
                { type: 'TIME_SERIES', key: 'discUsage' },
                { type: 'TIME_SERIES', key: 'totalDiscSpace' },
              ],
            },
            query: {
              entityFilter: { type: 'apiUsageState', resolveMultiple: true },
              entityFields: [
                { type: 'ENTITY_FIELD', key: 'name' },
                { type: 'ENTITY_FIELD', key: 'label' },
                { type: 'ENTITY_FIELD', key: 'additionalInfo' },
              ],
              pageLink: { dynamic: true, page: 0, pageSize: 1024, textSearch: null },
              latestValues: [
                { type: 'TIME_SERIES', key: 'cpuUsage' },
                { type: 'TIME_SERIES', key: 'cpuCount' },
                { type: 'TIME_SERIES', key: 'memoryUsage' },
                { type: 'TIME_SERIES', key: 'totalMemory' },
                { type: 'TIME_SERIES', key: 'discUsage' },
                { type: 'TIME_SERIES', key: 'totalDiscSpace' },
              ],
            },
          },
        ],
      },
      onMessage,
    );
  }

  function onMessage(data: any) {
    if (TENANT_COUNT_CMD_ID.value == data.cmdId) {
      tenantCount.value = data.count;
    } else if (TENANT_PROFILE_COUNT_CMD_ID.value == data.cmdId) {
      tenantProfileCount.value = data.count;
    } else if (DEVICE_COUNT_CMD_ID.value == data.cmdId) {
      deviceCount.value = data.count;
    } else if (ASSET_COUNT_CMD_ID.value == data.cmdId) {
      assetCount.value = data.count;
    } else if (USER_COUNT_CMD_ID.value == data.cmdId) {
      userCount.value = data.count;
    } else if (CUSTOMER_COUNT_CMD_ID.value == data.cmdId) {
      customerCount.value = data.count;
    } else if (CPU_STATUS_CMD_ID.value == data.cmdId) {
      if (isArray(data.update) && data.update[0].latest?.TIME_SERIES) {
        cpuCount.value = Number.parseInt(data.update[0].latest?.TIME_SERIES.cpuCount.value);
        cpuUsage.value = Number.parseInt(data.update[0].latest?.TIME_SERIES.cpuUsage.value);
        memoryUsage.value = Number.parseInt(data.update[0].latest?.TIME_SERIES.memoryUsage.value);
        totalMemory.value = Number.parseInt(data.update[0].latest?.TIME_SERIES.totalMemory.value);
        discUsage.value = Number.parseInt(data.update[0].latest?.TIME_SERIES.discUsage.value);
        totalDiscSpace.value = Number.parseInt(data.update[0].latest?.TIME_SERIES.totalDiscSpace.value);
      }
    }
  }

  function unsubscribeEntityCount() {
    const unsubscribeCmds: Array<any> = [];
    if (TENANT_COUNT_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: TENANT_COUNT_CMD_ID.value,
        type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE,
      });
    }
    if (TENANT_PROFILE_COUNT_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: TENANT_PROFILE_COUNT_CMD_ID.value,
        type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE,
      });
    }
    if (DEVICE_COUNT_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: DEVICE_COUNT_CMD_ID.value,
        type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE,
      });
    }
    if (ASSET_COUNT_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: ASSET_COUNT_CMD_ID.value,
        type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE,
      });
    }
    if (USER_COUNT_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: USER_COUNT_CMD_ID.value,
        type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE,
      });
    }
    if (CUSTOMER_COUNT_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: CUSTOMER_COUNT_CMD_ID.value,
        type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE,
      });
    }
    if (CPU_STATUS_CMD_ID.value > 0) {
      unsubscribeCmds.push({
        cmdId: CPU_STATUS_CMD_ID.value,
        type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE,
      });
    }
    unsubscribe(
      [
        TENANT_COUNT_CMD_ID.value,
        TENANT_PROFILE_COUNT_CMD_ID.value,
        DEVICE_COUNT_CMD_ID.value,
        ASSET_COUNT_CMD_ID.value,
        USER_COUNT_CMD_ID.value,
        CUSTOMER_COUNT_CMD_ID.value,
      ],
      {
        cmds: unsubscribeCmds,
      },
    );
  }

  function initCmdId() {
    TENANT_COUNT_CMD_ID.value = getAndIncrementCmdId();
    TENANT_PROFILE_COUNT_CMD_ID.value = getAndIncrementCmdId();
    DEVICE_COUNT_CMD_ID.value = getAndIncrementCmdId();
    ASSET_COUNT_CMD_ID.value = getAndIncrementCmdId();
    USER_COUNT_CMD_ID.value = getAndIncrementCmdId();
    CUSTOMER_COUNT_CMD_ID.value = getAndIncrementCmdId();
    CPU_STATUS_CMD_ID.value = getAndIncrementCmdId();
  }

  function convertBytesToSize(bytes: number) {
    const sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb']; // 存储单位的数组
    if (bytes === 0) {
      return '0 b';
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Number(bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }

  onBeforeUnmount(() => {
    unsubscribeEntityCount();
  });

  onMounted(() => {
    initCmdId();
    sendEntityCountPacket();
  });
</script>
