<template>
  <div class="notification-recipient-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('tb.notification.recipient.title') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.notification.recipient.action.add') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #configurationType="{ record }">
        <Tag color="green">
          {{
            NOTIFICATION_RECIPIENT_TYPE_OPTIONS.find((item) => item.value == record?.configuration?.type)?.label ||
            record?.configuration?.type
          }}
        </Tag>
      </template>
      <template #configurationUsersFilter="{ record }">
        <Tag color="purple" v-if="record.configuration.type == NotificationRecipientType.PLATFORM_USERS">
          {{
            NOTIFICATION_RECIPIENT_USER_FILTER_OPTIONS.find(
              (item) => item.value == record?.configuration?.usersFilter.type,
            )?.label || record?.configuration?.type
          }}
        </Tag>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbNotificationRecipientList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Tag } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { notificationTargetList, deleteNotificationTarget } from '/@/api/tb/notificationTarget';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import {
    NotificationRecipientType,
    NOTIFICATION_RECIPIENT_TYPE_OPTIONS,
    NOTIFICATION_RECIPIENT_USER_FILTER_OPTIONS,
  } from '/@/enums/notificationEnum';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.notification.recipient.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.notification.recipient.table.group'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
    },
    {
      title: t('tb.notification.recipient.table.type'),
      dataIndex: 'configuration.type',
      key: 'configuration.type',
      align: 'left',
      width: 160,
      slot: 'configurationType',
    },
    {
      title: t('tb.notification.recipient.table.filterUsers'),
      dataIndex: 'configuration.usersFilter',
      key: 'configuration.usersFilter',
      align: 'left',
      width: 160,
      slot: 'configurationUsersFilter',
    },
    {
      title: t('tb.notification.recipient.table.description'),
      dataIndex: 'configuration.description',
      key: 'configuration.description',
      align: 'left',
    },
    {
      title: t('tb.notification.recipient.table.createdTime'),
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
        icon: 'i-clarity:note-edit-line',
        title: t('tb.notification.recipient.action.edit'),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.notification.recipient.action.delete'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: notificationTargetList,
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

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.notification.recipient.action.deleteConfirm', { name: record.name }),
      content: t('tb.notification.recipient.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.notification.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotificationTarget(record.id.id);
          showMessage(t('tb.notification.recipient.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }
  function handleSuccess() {
    reload();
  }
</script>
<style lang="less">
  .notification-recipient-list {
  }
</style>
