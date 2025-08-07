<template>
  <Card size="small" title="客户" class="cursor-pointer" @click="go('/customer/list')">
    <template #extra>
      <Icon icon="ant-design:team-outlined" :size="24" color="purple" />
    </template>
    <Skeleton v-if="loading" :active="loading" />
    <Row v-else class="py-4 px-4">
      <Col span="12">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1"> 客户 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="customerTotal" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
      <Col span="12">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1"> 客户用户 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="customerUserTotal" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
    </Row>
    <!-- <div class="p-2 px-4 flex justify-between">
      <span>&nbsp;</span>
      <span>点击查看客户</span>
    </div> -->
  </Card>
</template>

<script lang="ts" setup>
  import { Card, Row, Col, Skeleton } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { CountTo } from '/@/components/CountTo/index';
  import { useGo } from '/@/hooks/web/usePage';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { onMounted, onUnmounted, ref } from 'vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { Authority } from '/@/enums/authorityEnum';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  const go = useGo();

  const CUSTOMER_COUNT_CMD_ID = ref(0);
  const CUSTOMER_USER_COUNT_CMD_ID = ref(0);

  const customerTotal = ref(0);
  const customerUserTotal = ref(0);

  const loading = ref(false);

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  onMounted(() => {
    loading.value = true;
    CUSTOMER_COUNT_CMD_ID.value = getAndIncrementCmdId();
    CUSTOMER_USER_COUNT_CMD_ID.value = getAndIncrementCmdId();
    send(
      [CUSTOMER_COUNT_CMD_ID.value, CUSTOMER_USER_COUNT_CMD_ID.value],
      {
        cmds: [
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
            cmdId: CUSTOMER_USER_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.USER,
                resolveMultiple: true,
              },
              keyFilters: [
                {
                  valueType: 'STRING',
                  key: { key: 'authority', type: 'ENTITY_FIELD' },
                  predicate: {
                    operation: 'EQUAL',
                    type: 'STRING',
                    value: { defaultValue: Authority.CUSTOMER_USER, dynamicValue: null },
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
    if (CUSTOMER_COUNT_CMD_ID.value == data.cmdId) {
      customerTotal.value = data.count;
    } else if (CUSTOMER_USER_COUNT_CMD_ID.value == data.cmdId) {
      customerUserTotal.value = data.count;
    }
  }
  onUnmounted(() => {
    if (CUSTOMER_COUNT_CMD_ID.value > 0) {
      unsubscribe([CUSTOMER_COUNT_CMD_ID.value, CUSTOMER_USER_COUNT_CMD_ID.value], {
        cmds: [
          { cmdId: CUSTOMER_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
          { cmdId: CUSTOMER_USER_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
        ],
      });
    }
  });
</script>
