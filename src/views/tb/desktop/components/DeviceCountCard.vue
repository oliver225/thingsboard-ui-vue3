<template>
  <Card size="small" title="设备" class="cursor-pointer" @click="go('/device/list')">
    <template #extra>
      <Icon icon="ant-design:database-outlined" :size="24" color="green" />
    </template>
    <Skeleton v-if="loading" :active="loading" />
    <Row v-else class="py-4 px-4">
      <Col span="8">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1 text-green-600"> 在线 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="activeDevice" color="green" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
      <Col span="8">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1 text-rose-500"> 离线 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="inactiveDevice" color="red" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
      <Col span="8">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1"> 全部 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="total" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
    </Row>
    <!-- <div class="p-2 px-4 flex justify-between">
      <span>&nbsp;</span>
      <span>点击查看设备</span>
    </div> -->
  </Card>
</template>
<script lang="ts" setup>
  import { Card, Row, Col, Skeleton } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { CountTo } from '/@/components/CountTo/index';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { onMounted, onUnmounted, ref } from 'vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { useGo } from '/@/hooks/web/usePage';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  const go = useGo();

  const DEVICE_COUNT_CMD_ID = ref(0);
  const DEVICE_ACTIVE_COUNT_CMD_ID = ref(0);
  const DEVICE_INACTIVE_COUNT_CMD_ID = ref(0);

  const total = ref(0);
  const activeDevice = ref(0);
  const inactiveDevice = ref(0);

  const loading = ref(false);

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  onMounted(() => {
    loading.value = true;
    DEVICE_COUNT_CMD_ID.value = getAndIncrementCmdId();
    DEVICE_ACTIVE_COUNT_CMD_ID.value = getAndIncrementCmdId();
    DEVICE_INACTIVE_COUNT_CMD_ID.value = getAndIncrementCmdId();
    send(
      [DEVICE_COUNT_CMD_ID.value, DEVICE_ACTIVE_COUNT_CMD_ID.value, DEVICE_INACTIVE_COUNT_CMD_ID.value],
      {
        cmds: [
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
            cmdId: DEVICE_ACTIVE_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.DEVICE,
                resolveMultiple: true,
              },
              keyFilters: [
                {
                  valueType: 'BOOLEAN',
                  key: { key: 'active', type: 'ATTRIBUTE' },
                  predicate: {
                    operation: 'EQUAL',
                    type: 'BOOLEAN',
                    value: { defaultValue: true, dynamicValue: null },
                  },
                },
              ],
            },
          },
          {
            cmdId: DEVICE_INACTIVE_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.DEVICE,
                resolveMultiple: true,
              },
              keyFilters: [
                {
                  valueType: 'BOOLEAN',
                  key: { key: 'active', type: 'ATTRIBUTE' },
                  predicate: {
                    operation: 'EQUAL',
                    type: 'BOOLEAN',
                    value: { defaultValue: false, dynamicValue: null },
                  },
                },
              ],
            },
          },
        ],
      },
      onMessage,
    );
  });

  function onMessage(data: any) {
    loading.value = false;
    if (DEVICE_COUNT_CMD_ID.value == data.cmdId) {
      total.value = data.count;
    } else if (DEVICE_ACTIVE_COUNT_CMD_ID.value == data.cmdId) {
      activeDevice.value = data.count;
    } else if (DEVICE_INACTIVE_COUNT_CMD_ID.value == data.cmdId) {
      inactiveDevice.value = data.count;
    }
  }
  onUnmounted(() => {
    if (DEVICE_COUNT_CMD_ID.value > 0) {
      unsubscribe([DEVICE_COUNT_CMD_ID.value, DEVICE_ACTIVE_COUNT_CMD_ID.value, DEVICE_INACTIVE_COUNT_CMD_ID.value], {
        cmds: [
          { cmdId: DEVICE_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
          { cmdId: DEVICE_ACTIVE_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
          { cmdId: DEVICE_INACTIVE_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
        ],
      });
    }
  });
</script>
