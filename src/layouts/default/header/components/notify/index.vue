<template>
  <div :class="prefixCls">
    <Popover title="" trigger="hover" :overlayClassName="`${prefixCls}__overlay`" @click="handlePopoverClick">
      <Badge :count="count" dot :numberStyle="numberStyle">
        <BellOutlined />
      </Badge>
      <template #content>
        <NotificationList :list="notificationListData" :markAllAsRead="handleMarkAllAsRead" />
      </template>
    </Popover>
  </div>
</template>
<script lang="ts">
  import { onMounted, defineComponent, ref } from 'vue';
  import { Popover, Tabs, Badge } from 'ant-design-vue';
  import { BellOutlined } from '@ant-design/icons-vue';
  import { Notification } from '/@/api/tb/notification';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import NotificationList from './NotificationList.vue';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  export default defineComponent({
    components: { Popover, BellOutlined, Tabs, TabPane: Tabs.TabPane, Badge, NotificationList },
    setup() {
      const { prefixCls } = useDesign('header-notify');

      const { getAndIncrementCmdId, send: websocketSend } = useWebsocketStore();

      const NOTIFICATIONS_COUNT_CMD_ID = ref(0);
      const NOTIFICATIONS_CMD_ID = ref(0);

      const notificationListData = ref<Notification[]>([]);
      const count = ref(0);

      // function onNoticeClick(record: ListItem) {
      //   createMessage.success('你点击了通知，ID=' + record.id);
      //   // 可以直接将其标记为已读（为标题添加删除线）,此处演示的代码会切换删除线状态
      //   record.titleDelete = !record.titleDelete;
      // }

      function handleMarkAllAsRead() {
        const cmdId = getAndIncrementCmdId();
        websocketSend(
          cmdId,
          {
            cmds: [{ cmdId: cmdId, type: WsCmdType.MARK_ALL_NOTIFICATIONS_AS_READ }],
          },
          onWebsocketMessage,
        );
      }

      function handlePopoverClick() {
        sendQueryNotifictionList();
      }

      onMounted(() => {
        NOTIFICATIONS_COUNT_CMD_ID.value = getAndIncrementCmdId();
        NOTIFICATIONS_CMD_ID.value = getAndIncrementCmdId();
        sendCountPacket();
      });

      function sendCountPacket() {
        websocketSend(
          NOTIFICATIONS_COUNT_CMD_ID.value,
          {
            cmds: [{ cmdId: NOTIFICATIONS_COUNT_CMD_ID.value, type: WsCmdType.NOTIFICATIONS_COUNT }],
          },
          onWebsocketMessage,
        );
      }

      function sendQueryNotifictionList() {
        websocketSend(
          NOTIFICATIONS_CMD_ID.value,
          {
            cmds: [
              {
                cmdId: NOTIFICATIONS_CMD_ID.value,
                type: WsCmdType.NOTIFICATIONS,
                types: [],
                limit: 100,
              },
            ],
          },
          onWebsocketMessage,
        );
      }

      function onWebsocketMessage(data: any) {
        if (data.cmdUpdateType == WsCmdType.NOTIFICATIONS_COUNT) {
          count.value = data.totalUnreadCount || 0;
        }
        if (data.cmdUpdateType == WsCmdType.NOTIFICATIONS) {
          notificationListData.value = data.notifications || [];
        }
      }

      return {
        prefixCls,
        notificationListData,
        count,
        handleMarkAllAsRead,
        handlePopoverClick,
        numberStyle: {},
      };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'jeesite-header-notify';

  .@{prefix-cls} {
    padding-top: 2px;

    &__overlay {
      max-width: 360px;

      .ant-popover-content {
        width: 300px;
      }
    }

    .ant-tabs-content {
      width: 300px;
    }

    .ant-badge {
      font-size: 18px;

      .ant-badge-multiple-words {
        padding: 0 4px;
      }

      svg {
        width: 0.9em;
      }
    }
  }
</style>
