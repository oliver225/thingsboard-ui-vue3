<template>
  <div class="notification-rule-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('通知规则') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增规则 </a-button>
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
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbNotificationRuleList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { notificationRuleInfoList, deleteNotificationRule } from '/@/api/tb/notificationRule';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import { NOTIFICATION_TYPE_OPTIONS } from '/@/enums/notificationEnum';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || '通知规则',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('名称'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
    },
    {
      title: t('消息模版'),
      dataIndex: 'templateName',
      key: 'templateName',
      align: 'left',
    },
    {
      title: t('触发'),
      dataIndex: 'triggerType',
      key: 'triggerType',
      sorter: true,
      width: 160,
      format: (text) => NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == text)?.label || text,
    },
    {
      title: t('描述'),
      dataIndex: 'additionalConfig.description',
      key: 'additionalConfig.description',
      align: 'left',
      ellipsis: false,
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
        title: t('编辑通知规则'),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除通知规则'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: notificationRuleInfoList,
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
      title: `确定删除通知规则[${record.name}]吗？`,
      content: '请注意：确认后，通知规则将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteNotificationRule(record.id.id);
          showMessage('删除通知规则成功！');
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
  .notification-rule-list {
  }
</style>
