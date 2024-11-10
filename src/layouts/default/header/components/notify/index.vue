<template>
  <div :class="prefixCls">
    <Popover
      title=""
      trigger="click"
      :overlayClassName="`${prefixCls}__overlay`"
      @click="handlePopoverClick"
    >
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
  import { onMounted, onBeforeUnmount, watchEffect, defineComponent, ref } from 'vue';
  import { Popover, Tabs, Badge } from 'ant-design-vue';
  import { BellOutlined } from '@ant-design/icons-vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useWebSocket } from '@vueuse/core';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import NotificationList from './NotificationList.vue';
  import { getToken } from '/@/utils/auth';

  export default defineComponent({
    components: { Popover, BellOutlined, Tabs, TabPane: Tabs.TabPane, Badge, NotificationList },
    setup() {
      const { prefixCls } = useDesign('header-notify');
      const { wsPath } = useGlobSetting();
      const { getAndIncrementCmdId } = useWebsocketStore();

      const UN_READ_COUNT_CMD_ID = ref(0);
      const UN_READ_DATA_CMD_ID = ref(0);

      const notificationListData = ref<Notification[]>([]);
      const count = ref(0);

      const { send, data, close } = useWebSocket(`${wsPath}/notifications?token=${getToken()}`, {
        autoReconnect: true,
        autoClose: false,
      });

      // function onNoticeClick(record: ListItem) {
      //   createMessage.success('你点击了通知，ID=' + record.id);
      //   // 可以直接将其标记为已读（为标题添加删除线）,此处演示的代码会切换删除线状态
      //   record.titleDelete = !record.titleDelete;
      // }

      function handleMarkAllAsRead() {
        send(JSON.stringify({ markAllAsReadCmd: { cmdId: getAndIncrementCmdId() } }));
        sendQueryUnRead();
      }

      function handlePopoverClick() {
        sendQueryUnRead();
      }

      watchEffect(() => {
        if (data.value) {
          try {
            const dataObj = JSON.parse(data.value);
            if (dataObj.hasOwnProperty('cmdUpdateType')) {
              if (dataObj.cmdUpdateType == 'NOTIFICATIONS_COUNT') {
                count.value = dataObj.totalUnreadCount;
              } else if (dataObj.cmdUpdateType == 'NOTIFICATIONS') {
                count.value = dataObj.totalUnreadCount;
                notificationListData.value = dataObj.notifications;
                sendCountPacket();
              }
            }
          } catch (error: any) {
            console.log(error);
          }
        }
      });

      onMounted(() => {
        sendCountPacket();
      });
      onBeforeUnmount(() => {
        close();
      });

      function sendCountPacket() {
        if (UN_READ_DATA_CMD_ID.value > 0) {
          send(JSON.stringify({ unsubCmd: { cmdId: UN_READ_DATA_CMD_ID.value } }));
        }
        UN_READ_COUNT_CMD_ID.value = getAndIncrementCmdId();
        send(JSON.stringify({ unreadCountSubCmd: { cmdId: UN_READ_COUNT_CMD_ID.value } }));
      }

      function sendQueryUnRead() {
        if (count.value > 0) {
          if (UN_READ_COUNT_CMD_ID.value > 0) {
            send(JSON.stringify({ unsubCmd: { cmdId: UN_READ_COUNT_CMD_ID.value } }));
          }
          UN_READ_DATA_CMD_ID.value = getAndIncrementCmdId();
          send(
            JSON.stringify({
              unreadSubCmd: { cmdId: UN_READ_DATA_CMD_ID.value, limit: count.value },
            }),
          );
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
