<template>
  <Card size="small" title="报警" class="cursor-pointer" @click="go('/alarm/list')">
    <template #extra>
      <Icon icon="ant-design:alert-outlined" :size="24" color="blue" />
    </template>
    <Skeleton v-if="loading" :active="loading" />
    <Row v-else class="py-4 px-4">
      <Col span="8">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1 text-rose-500"> 危险 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="criticalAlarmCount" color="red" class="ant-statistic-content-value-int text-2xl" />
            <Icon icon="ant-design:warning-twotone" color="red" :size="24" class="ml-1" />
          </div>
        </div>
      </Col>
      <Col span="8">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1"> 指定给我 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="assignToMeAlarmCount" class="ant-statistic-content-value-int text-2xl" />
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
      <span>点击查看报警</span>
    </div> -->
  </Card>
</template>
<script lang="ts" setup>
  import { Card, Row, Col, Skeleton } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { useGo } from '/@/hooks/web/usePage';
  import { CountTo } from '/@/components/CountTo/index';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useUserStore } from '/@/store/modules/user';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  const go = useGo();

  const { getUserInfo } = useUserStore();

  const ALARM_COUNT_CMD_ID = ref(0);
  const CRITICAL_ALARM_COUNT_CMD_ID = ref(0);
  const ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID = ref(0);

  const total = ref(0);
  const criticalAlarmCount = ref(0);
  const assignToMeAlarmCount = ref(0);

  const loading = ref(false);

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  onMounted(() => {
    loading.value = true;
    ALARM_COUNT_CMD_ID.value = getAndIncrementCmdId();
    CRITICAL_ALARM_COUNT_CMD_ID.value = getAndIncrementCmdId();
    ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID.value = getAndIncrementCmdId();
    send(
      [ALARM_COUNT_CMD_ID.value, CRITICAL_ALARM_COUNT_CMD_ID.value, ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID.value],
      {
        cmds: [
          {
            cmdId: ALARM_COUNT_CMD_ID.value,
            type: WsCmdType.ALARM_COUNT,
            query: { statusList: ['ACTIVE'], searchPropagatedAlarms: false },
          },
          {
            cmdId: CRITICAL_ALARM_COUNT_CMD_ID.value,
            type: WsCmdType.ALARM_COUNT,
            query: {
              statusList: ['ACTIVE'],
              severityList: ['CRITICAL'],
              searchPropagatedAlarms: false,
            },
          },
          {
            cmdId: ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID.value,
            type: WsCmdType.ALARM_COUNT,
            query: {
              statusList: ['ACTIVE'],
              assigneeId: getUserInfo.id,
              searchPropagatedAlarms: false,
            },
          },
        ],
      },
      onMessage,
    );
  });

  function onMessage(data: any) {
    loading.value = false;
    if (ALARM_COUNT_CMD_ID.value == data.cmdId) {
      total.value = data.count;
    } else if (CRITICAL_ALARM_COUNT_CMD_ID.value == data.cmdId) {
      criticalAlarmCount.value = data.count;
    } else if (ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID.value == data.cmdId) {
      assignToMeAlarmCount.value = data.count;
    }
  }
  onUnmounted(() => {
    if (ALARM_COUNT_CMD_ID.value > 0) {
      unsubscribe(
        [ALARM_COUNT_CMD_ID.value, CRITICAL_ALARM_COUNT_CMD_ID.value, ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID.value],
        {
          cmds: [
            { cmdId: ALARM_COUNT_CMD_ID.value, type: WsCmdType.ALARM_COUNT_UNSUBSCRIBE },
            { cmdId: CRITICAL_ALARM_COUNT_CMD_ID.value, type: WsCmdType.ALARM_COUNT_UNSUBSCRIBE },
            {
              cmdId: ASSIGNEE_TO_ME_ALARM_COUNT_CMD_ID.value,
              type: WsCmdType.ALARM_COUNT_UNSUBSCRIBE,
            },
          ],
        },
      );
    }
  });
</script>
