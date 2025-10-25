<template>
  <div class="notification-template-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('tb.notification.template.title') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.notification.template.action.add') }}
          </a-button>
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
          <CheckableTag
            v-for="(method, index) in Object.keys(record.configuration.deliveryMethodsTemplates)"
            :key="index"
          >
            {{ method }}
          </CheckableTag>
        </Space>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbNotificationTemplateList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, h } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { notificationTemplateList, deleteNotificationTemplate } from '/@/api/tb/notificationTemplate';
  import { useUserStore } from '/@/store/modules/user';
  import { NOTIFICATION_TYPE_OPTIONS } from '/@/enums/notificationEnum';
  import InputForm from './form.vue';
  import { useModal } from '/@/components/Modal';
  import { CheckableTag, Space } from 'ant-design-vue';

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.notification.template.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.notification.template.table.template'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      align: 'left',
      ellipsis: false,
    },
    {
      title: t('tb.notification.template.table.notificationType'),
      key: 'notificationType',
      dataIndex: 'notificationType',
      width: 160,
      sorter: true,
      align: 'center',
      format: (text) => NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == text)?.label || text,
    },
    {
      title: t('tb.notification.template.table.deliveryMethods'),
      key: 'deliveryMethods',
      dataIndex: 'deliveryMethods',
      width: 160,
      align: 'center',
      slot: 'deliveryMethods',
    },
    {
      title: t('tb.notification.template.table.createdTime'),
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
        title: t('tb.notification.template.action.edit'),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.notification.template.action.delete'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };
  const [registerModal, { openModal }] = useModal();

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: notificationTemplateList,
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
      title: () => h('span', { innerHTML: t('tb.notification.template.action.deleteConfirm', { name: record.name }) }),
      content: t('tb.notification.template.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.notification.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotificationTemplate(record.id.id);
          showMessage(t('tb.notification.template.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  function handleSuccess() {
    reload();
  }
</script>
<style lang="less">
  .notification-template-list {
  }
</style>
