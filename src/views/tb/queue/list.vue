<template>
  <div class="queue-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增队列 </a-button>
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
      <template #firstColumn="{ record }">
        <a @click="handleDetail({ id: record.id })" :title="record.name">
          {{ record.name }}
        </a>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbQueueList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { queueList, deleteQueue } from '/@/api/tb/queue';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: '队列设置',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('队列名称'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 260,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: '分区',
      dataIndex: 'partitions',
      key: 'partitions',
      width: 80,
      align: 'center',
    },
    {
      title: '提交策略',
      key: 'submitStrategy',
      dataIndex: 'submitStrategy',
      width: 180,
      sorter: true,
      align: 'left',
      format: (text: any) =>
        text.type ? SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === text.type)?.label || text.type : '',
    },
    {
      title: '处理策略',
      key: 'processingStrategy',
      dataIndex: 'processingStrategy',
      width: 180,
      sorter: true,
      align: 'left',
      format: (text: any) =>
        text.type ? PROCESSING_STRATEGY_OPTIONS.find((item) => item.value === text.type)?.label || text.type : '',
    },

    {
      title: '描述信息',
      dataIndex: 'additionalInfo.description',
      key: 'additionalInfo.description',
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
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除队列'),
        disabled: record.name == 'Main',
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (arg) => queueList(arg, 'TB_RULE_ENGINE'),
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
      title: `确定删除队列[${record.name}]吗？`,
      content: '请注意：确认后，队列和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteQueue(record.id.id);
          showMessage('删除队列成功！');
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

  function handleDetail(record: Recordable) {
    openDrawer(true, record);
  }
</script>
<style lang="less">
  .queue-list {
  }
</style>
