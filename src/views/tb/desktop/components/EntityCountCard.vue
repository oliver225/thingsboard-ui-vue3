<template>
  <Card size="small" title="实体" class="cursor-pointer" @click="go('/entity/index')">
    <template #extra>
      <Icon icon="ant-design:desktop-outlined" :size="24" color="orange" />
    </template>
    <Skeleton v-if="loading" :active="loading" />
    <Row v-else class="py-4 px-4">
      <Col span="12">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1"> 资产 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="assetTotal" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
      <Col span="12">
        <div class="ant-statistic">
          <div class="ant-statistic-title mb-1"> 实体视图 </div>
          <div class="ant-statistic-content">
            <CountTo :endVal="entityViewTotal" class="ant-statistic-content-value-int text-2xl" />
          </div>
        </div>
      </Col>
    </Row>
    <!-- <div class="p-2 px-4 flex justify-between">
      <span>&nbsp;</span>
      <span>点击查看实体</span>
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

  const ASSET_COUNT_CMD_ID = ref(0);
  const ENTITY_VIEW_COUNT_CMD_ID = ref(0);

  const assetTotal = ref(0);
  const entityViewTotal = ref(0);

  const loading = ref(false);

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  onMounted(() => {
    loading.value = true;
    ASSET_COUNT_CMD_ID.value = getAndIncrementCmdId();
    ENTITY_VIEW_COUNT_CMD_ID.value = getAndIncrementCmdId();
    send(
      [ASSET_COUNT_CMD_ID.value, ENTITY_VIEW_COUNT_CMD_ID.value],
      {
        cmds: [
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
            cmdId: ENTITY_VIEW_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_COUNT,
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.ENTITY_VIEW,
                resolveMultiple: true,
              },
            },
          },
        ],
      },
      onMessage,
    );
  });

  function onMessage(data: any) {
    loading.value = false;
    if (ASSET_COUNT_CMD_ID.value == data.cmdId) {
      assetTotal.value = data.count;
    } else if (ENTITY_VIEW_COUNT_CMD_ID.value == data.cmdId) {
      entityViewTotal.value = data.count;
    }
  }
  onUnmounted(() => {
    if (ASSET_COUNT_CMD_ID.value > 0) {
      unsubscribe([ASSET_COUNT_CMD_ID.value, ENTITY_VIEW_COUNT_CMD_ID.value], {
        cmds: [
          { cmdId: ASSET_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
          { cmdId: ENTITY_VIEW_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_COUNT_UNSUBSCRIBE },
        ],
      });
    }
  });
</script>
