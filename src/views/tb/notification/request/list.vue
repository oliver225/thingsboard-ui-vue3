<template>
  <div class="notification-request-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('tb.notification.request.title') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
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
      <template #deliveryMethods="{ record }">
        <Space>
          <CheckableTag v-for="(method, index) in record.deliveryMethods" :key="index">
            {{ method }}
          </CheckableTag>
        </Space>
      </template>
      <template #status="{ record }">
        <Tag color="warning" v-if="NotificationRequestStatus.SCHEDULED == record.status">
          <template #icon>
            <SyncOutlined :spin="true" />
          </template>
          {{ t('tb.notification.request.table.scheduled') }}
        </Tag>
        <Tag color="processing" v-else-if="NotificationRequestStatus.PROCESSING == record.status">
          <template #icon>
            <SyncOutlined :spin="true" />
          </template>
          {{ t('tb.notification.request.table.processing') }}
        </Tag>
        <Tag color="success" v-else-if="NotificationRequestStatus.SENT == record.status">
          {{ t('tb.notification.request.table.sent') }}
        </Tag>
        <Tag color="default" v-else>
          {{ record.status }}
        </Tag>
      </template>
      <template #stats="{ record }">
        <div v-if="!record.stats"> -- </div>
        <div v-else-if="!isEmpty(record.stats.error)">
          <Tag style="cursor: pointer" color="error" @click="handleStats(record)">
            {{ t('tb.notification.request.table.error') }}
          </Tag>
        </div>
        <div v-else-if="!isEmpty(record.stats.errors)">
          <Tag style="cursor: pointer" color="error" @click="handleStats(record)">
            {{
              Object.keys(record.stats.errors)
                .map((key) => Object.keys(record.stats.errors[key]).length)
                .reduce((a, b) => a + b, 0)
            }}
            {{ t('tb.notification.request.table.failed') }}
          </Tag>
        </div>
        <div v-else>
          <Tag style="cursor: pointer" color="success" @click="handleStats(record)">
            {{
              Object.keys(record.stats.sent)
                .map((key) => Number.parseInt(record.stats.sent[key]))
                .reduce((a, b) => a + b, 0)
            }}
            {{ t('tb.notification.request.table.success') }}
          </Tag>
        </div>
      </template>
    </BasicTable>
    <Stats @register="registerStatsModal" @success="handleSuccess" />
    <InputForm @register="registerFormModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbNotificationRequestList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, h } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { notificationRequestList, deleteNotificationRequest } from '/@/api/tb/notification';
  import { useUserStore } from '/@/store/modules/user';
  import { NotificationRequestStatus } from '/@/enums/notificationEnum';
  import { Tag, CheckableTag, Space } from 'ant-design-vue';
  import { SyncOutlined } from '@ant-design/icons-vue';
  import InputForm from './form.vue';
  import { isEmpty } from 'lodash-es';
  import Stats from './stats.vue';

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.notification.request.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.notification.request.table.template'),
      dataIndex: 'templateName',
      key: 'templateName',
      fixed: 'left',
      align: 'left',
      ellipsis: true,
      sorter: true,
    },
    {
      title: t('tb.notification.request.table.deliveryMethods'),
      key: 'deliveryMethods',
      dataIndex: 'deliveryMethods',
      width: 160,
      align: 'center',
      slot: 'deliveryMethods',
    },
    {
      title: t('tb.notification.request.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      slot: 'status',
      sorter: true,
    },
    {
      title: t('tb.notification.request.table.result'),
      align: 'center',
      dataIndex: 'stats',
      key: 'stats',
      slot: 'stats',
      width: 120,
    },
    {
      title: t('tb.notification.request.table.createdTime'),
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
        icon: 'ant-design:send-outlined',
        title: t('tb.notification.request.action.resend'),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
        ifShow: record.status == NotificationRequestStatus.SENT,
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.notification.request.action.delete'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerStatsModal, { openModal: openStatsModal }] = useModal();
  const [registerFormModal, { openModal: openFormModal }] = useModal();

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: notificationRequestList,
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
      title: () =>
        h('span', {
          innerHTML: t('tb.notification.request.action.deleteConfirm', { name: record.templateName || '' }),
        }),
      content: t('tb.notification.request.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.notification.request.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotificationRequest(record.id.id);
          showMessage(t('tb.notification.request.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleForm(record: Recordable) {
    openFormModal(true, { ...record });
  }

  function handleStats(record: Recordable) {
    openStatsModal(true, record.stats);
  }

  function handleSuccess() {
    reload();
  }
</script>
<style lang="less">
  .notification-request-list {
  }
</style>
