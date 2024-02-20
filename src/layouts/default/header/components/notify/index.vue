<template>
  <div :class="prefixCls">
    <Popover title="" trigger="click" :overlayClassName="`${prefixCls}__overlay`" @click="handlePopoverClick">
      <Badge :count="count" :numberStyle="numberStyle">
        <BellOutlined />
      </Badge>
      <template #content>
        <NotificationList :list="notificationListData" :markAllAsRead="handleMarkAllAsRead" />
      </template>
    </Popover>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watchEffect } from 'vue';
import { Popover, Tabs, Badge } from 'ant-design-vue';
import { BellOutlined } from '@ant-design/icons-vue';
import { tabListData, ListItem } from './data';
import NotificationList from './NotificationList.vue';
import { useDesign } from '/@/hooks/web/useDesign';
import { useMessage } from '/@/hooks/web/useMessage';
import { useGlobSetting } from '/@/hooks/setting';
import { useUserStore } from '/@/store/modules/user';
import { useWebSocket } from '@vueuse/core';
import { useWebsocketStore } from '/@/store/modules/websocket';
import { Notification } from '/@/api/things/notification';

export default defineComponent({
  components: { Popover, BellOutlined, Tabs, TabPane: Tabs.TabPane, Badge, NotificationList },
  setup() {
    const { prefixCls } = useDesign('header-notify');
    const { createMessage } = useMessage();
    const userStore = useUserStore();
    const { wsPath } = useGlobSetting();
    const { getAndIncrementCmdId } = useWebsocketStore();
    const listData = ref(tabListData);
    const notificationListData = ref<Notification[]>([]);
    const count = ref(0);

    const UN_READ_COUNT_CMD_ID = ref(0);
    const UN_READ_DATA_CMD_ID = ref(0);



    const { send, data, close } = useWebSocket(`${wsPath}/notifications?token=${userStore.getToken}`, { autoReconnect: true, autoClose: false })

    function onNoticeClick(record: ListItem) {
      createMessage.success('你点击了通知，ID=' + record.id);
      // 可以直接将其标记为已读（为标题添加删除线）,此处演示的代码会切换删除线状态
      record.titleDelete = !record.titleDelete;
    }

    function handleMarkAllAsRead() {
      send(JSON.stringify({ markAllAsReadCmd: { cmdId: getAndIncrementCmdId() } }))
      sendQueryUnRead();
    }

    function sendCountPacket() {
      if (UN_READ_DATA_CMD_ID.value > 0) {
        send(JSON.stringify({ unsubCmd: { cmdId: UN_READ_DATA_CMD_ID.value } }))
      }
      UN_READ_COUNT_CMD_ID.value = getAndIncrementCmdId()
      send(JSON.stringify({ unreadCountSubCmd: { cmdId: UN_READ_COUNT_CMD_ID.value } }))
    }

    function sendQueryUnRead() {
      if (count.value > 0) {
        if (UN_READ_COUNT_CMD_ID.value > 0) {
          send(JSON.stringify({ unsubCmd: { cmdId: UN_READ_COUNT_CMD_ID.value } }))
        }
        UN_READ_DATA_CMD_ID.value = getAndIncrementCmdId();
        send(JSON.stringify({ unreadSubCmd: { cmdId: UN_READ_DATA_CMD_ID.value, limit: count.value } }))
      }
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
    })

    onMounted(() => {
      sendCountPacket();
    })
    onBeforeUnmount(() => {
      close();
    })

    return {
      prefixCls,
      listData,
      count,
      notificationListData,
      handleMarkAllAsRead,
      onNoticeClick,
      handlePopoverClick,
      numberStyle: {
        height: '12px',
        fontSize: '10px',
        lineHeight: '12px',
      },
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
      width: 400px;
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
