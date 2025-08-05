<template>
  <div class="notification-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('通知列表') }}
        </div>
      </template>
      <template #toolbar>
        <Tooltip placement="top">
          <template #title>
            <span>{{ t('设置全部已读') }}</span>
          </template>
          <Icon
            icon="ant-design:check-circle-outlined"
            :size="20"
            @click="handleMarkAllAsRead"
            :style="{ color: 'green' }"
          />
        </Tooltip>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <Segmented
            v-model:value="unreadOnly"
            @change="reload()"
            :options="[
              { label: '未读', value: 'true' },
              { label: '所有', value: 'false' },
            ]"
          />
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
            allow-clear
            @change="reload()"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>

      <template #firstColumn="{ record }">
        <a @click="handleDetail({ ...record })" :title="record.subject">
          <span v-html="record.subject" />
        </a>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbNotificationList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, ref, h } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Tooltip, Segmented } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import {
    notificationList,
    deleteNotification,
    markAllNotificationAsRead,
    markNotificationAsRead,
  } from '/@/api/tb/notification';
  import { useUserStore } from '/@/store/modules/user';
  import { NOTIFICATION_TYPE_OPTIONS, NotificationStatus } from '/@/enums/notificationEnum';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';

  dayjs.locale('zh-cn');
  dayjs.extend(relativeTime);

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || '通知列表',
  };

  const unreadOnly = ref('true');

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: '类型',
      key: 'type',
      dataIndex: 'type',
      fixed: 'left',
      width: 160,
      sorter: true,
      align: 'center',
      format: (text) => NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == text)?.label || text,
    },
    {
      title: t('主题'),
      dataIndex: 'subject',
      key: 'subject',
      width: 300,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: true,
    },
    {
      title: '消息',
      dataIndex: 'text',
      key: 'text',
      align: 'left',
      ellipsis: true,
    },
    {
      title: t('创建时间'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:check-outlined',
        title: t('设置为已读'),
        color: 'success',
        onClick: handleMarkAsRead.bind(this, { ...record }),
        ifShow: record.status == NotificationStatus.SENT,
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除通知'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (arg) => notificationList(arg, unreadOnly.value == 'true'),
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    return { ...param, textSearch: searchParam.textSearch };
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: () => h('span', { innerHTML: `确定删除通知[${record.subject}]吗？` }),
      content: '请注意：确认后，通知相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotification(record.id.id);
          showMessage('删除通知成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  async function handleMarkAsRead(record: Recordable) {
    try {
      const res = await markNotificationAsRead(record.id.id);
      showMessage('设置为已读成功！', 'success');
    } catch (error: any) {
      showMessage(`设置失败:${error.message}`, 'error');
      console.log(error);
    } finally {
      handleSuccess();
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await markAllNotificationAsRead();
      showMessage('设置所有为已读成功！', 'success');
    } catch (error: any) {
      showMessage(`设置失败:${error.message}`, 'error');
      console.log(error);
    } finally {
      handleSuccess();
    }
  }

  function handleDetail(record: Recordable) {
    createConfirm({
      iconType: 'success',
      icon: () =>
        h(Icon, {
          icon: record.additionalConfig.icon.enabled
            ? record.additionalConfig.icon.icon
            : 'ant-design:info-circle-filled',
          color: record.additionalConfig.icon.enabled ? record.additionalConfig.icon.color : 'blue',
        }),
      title: () =>
        h('div', { style: { width: '100%' } }, [
          h('span', { innerHTML: record.subject }),
          h(
            'span',
            { style: { float: 'right', 'font-size': '12px', 'font-weight': 'normal', color: 'rgba(0, 0, 0, 0.55)' } },
            dayjs(record.createdTime).fromNow(),
          ),
        ]),
      content: () => h('div', { innerHTML: record.text }),
      okCancel: false,
      okText: record.additionalConfig.actionButtonConfig.enabled ? record.additionalConfig.actionButtonConfig.text : '',
      onOk: () => {
        if (record.additionalConfig.actionButtonConfig.enabled) {
          if (record.additionalConfig.actionButtonConfig.linkType == 'LINK') {
            window.open(record.additionalConfig.actionButtonConfig.link, '_blank');
          }
        }
      },
    });
  }

  function handleSuccess() {
    reload();
  }
</script>
<style lang="less">
  .notification-list {
    .ant-segmented-item-selected {
      background-color: @primary-color !important;
      color: @white !important;
    }
  }
</style>
