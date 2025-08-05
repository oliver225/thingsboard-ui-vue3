<template>
  <div class="notification-recipient-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('通知接收人') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> 新增接收人
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
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
    value: router.currentRoute.value.meta.title || '通知接收人组',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('接收人组'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
    },
    {
      title: t('类型'),
      dataIndex: 'configuration.type',
      key: 'configuration.type',
      align: 'left',
      width: 160,
      slot: 'configurationType',
    },
    {
      title: t('过滤用户'),
      dataIndex: 'configuration.usersFilter',
      key: 'configuration.usersFilter',
      align: 'left',
      width: 160,
      slot: 'configurationUsersFilter',
    },
    {
      title: t('描述'),
      dataIndex: 'configuration.description',
      key: 'configuration.description',
      align: 'left',
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
        icon: 'i-clarity:note-edit-line',
        title: t('编辑通知接收组'),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除通知接收组'),
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
      title: `确定删除通知接收组[${record.name}]吗？`,
      content: '请注意：确认后，通知接收组将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotificationTarget(record.id.id);
          showMessage('删除通知接收组成功！');
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
