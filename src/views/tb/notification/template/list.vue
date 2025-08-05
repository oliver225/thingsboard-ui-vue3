<template>
  <div class="notification-template-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('通知模板') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增模板 </a-button>
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
    value: router.currentRoute.value.meta.title || '通知模板',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('模板'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      align: 'left',
      ellipsis: false,
    },
    {
      title: '通知类型',
      key: 'notificationType',
      dataIndex: 'notificationType',
      width: 160,
      sorter: true,
      align: 'center',
      format: (text) => NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == text)?.label || text,
    },

    {
      title: t('接收方式'),
      key: 'deliveryMethods',
      dataIndex: 'deliveryMethods',
      width: 160,
      align: 'center',
      slot: 'deliveryMethods',
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
        title: t('编辑通知模板'),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除通知模板'),
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
      title: () => h('span', { innerHTML: `确定删除通知模板[${record.name}]吗？` }),
      content: '请注意：确认后，通知模板相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotificationTemplate(record.id.id);
          showMessage('删除通知模板成功！');
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
