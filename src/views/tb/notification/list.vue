<template>
  <div class="notification-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('tb.notification.title') }}
        </div>
      </template>
      <template #toolbar>
        <Tooltip placement="top">
          <template #title>
            <span>{{ t('tb.notification.action.markAllRead') }}</span>
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
              { label: t('tb.notification.filter.unread'), value: 'true' },
              { label: t('tb.notification.filter.all'), value: 'false' },
            ]"
          />
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
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
          <span v-html="record.subject"> </span>
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
    value: router.currentRoute.value.meta.title || t('tb.notification.title'),
  };

  const unreadOnly = ref('true');

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.notification.table.type'),
      key: 'type',
      dataIndex: 'type',
      fixed: 'left',
      width: 160,
      sorter: true,
      align: 'center',
      format: (text) => NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == text)?.label || text,
    },
    {
      title: t('tb.notification.table.subject'),
      dataIndex: 'subject',
      key: 'subject',
      width: 300,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: true,
    },
    {
      title: t('tb.notification.table.text'),
      dataIndex: 'text',
      key: 'text',
      align: 'left',
      ellipsis: true,
    },
    {
      title: t('tb.notification.table.createdTime'),
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
        title: t('tb.notification.action.markRead'),
        color: 'success',
        onClick: handleMarkAsRead.bind(this, { ...record }),
        ifShow: record.status == NotificationStatus.SENT,
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.notification.action.deleteNotification'),
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
      title: () => h('span', { innerHTML: t('tb.notification.action.deleteConfirm', { name: record.subject }) }),
      content: t('tb.notification.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.notification.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotification(record.id.id);
          showMessage(t('tb.notification.action.deleteSuccess'));
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
      showMessage(t('tb.notification.action.markReadSuccess'), 'success');
    } catch (error: any) {
      showMessage(t('tb.notification.action.setFailPrefix') + error.message, 'error');
      console.log(error);
    } finally {
      handleSuccess();
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await markAllNotificationAsRead();
      showMessage(t('tb.notification.action.markAllReadSuccess'), 'success');
    } catch (error: any) {
      showMessage(t('tb.notification.action.setFailPrefix') + error.message, 'error');
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
