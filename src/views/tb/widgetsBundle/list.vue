<template>
  <div class="widgets-bundle-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">{{ t(getTitle.value) }}</div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> 新增部件包
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #firstColumn="{ record }">
        <a @click="handleDetail({ id: record.id })" :title="record.title">
          {{ record.title }}
        </a>
      </template>
      <template #isSystem="{ record }">
        <Checkbox :checked="isEqual(SYS_TENANT_ID, record.tenantId)" />
      </template>
    </BasicTable>
    <WidgetTypeInfoList @register="registerWidgetType" @success="handleSuccess" />
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer
      @register="registerDrawer"
      @edit="handleForm"
      @delete="handleDelete"
      @download="handleDownload"
      @open="handleOpenBundle"
    />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbWidgetsBundleList',
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
  import { router } from '/@/router';
  import { widgetsBundleList, deleteWidgetsBundle } from '/@/api/tb/widgetsBundle';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { Checkbox } from 'ant-design-vue';
  import { isEqual } from 'lodash-es';
  import { SYS_TENANT_ID } from '/#/constant';
  import WidgetTypeInfoList from './widgetTypesInfo.vue';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || '部件包',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('标题'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      width: 260,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: '描述信息',
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      ellipsis: true,
    },
    {
      title: '系统',
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 80,
      align: 'center',
      slot: 'isSystem',
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
        icon: 'ant-design:folder-open-outlined',
        title: t('打开部件包'),
        onClick: handleOpenBundle.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:download-outlined',
        title: t('导出部件包'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除部件包'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerWidgetType, { openDrawer: openWidgetType }] = useDrawer();
  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: widgetsBundleList,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'title', sortOrder: 'ASC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(fetchParam: any) {
    return { ...fetchParam, textSearch: searchParam.textSearch };
  }

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    const modalFunc = createConfirm({
      iconType: 'error',
      title: `确定删除部件包[${record.title}]吗？`,
      content: '请注意：确认后，部件包和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteWidgetsBundle(record.id.id);
          showMessage('删除部件包成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleOpenBundle(record: Recordable) {
    openWidgetType(true, record);
  }

  function handleDownload(record: Recordable) {
    console.log(record);
  }

  function handleSuccess() {
    reload();
  }

  function handleDetail(record: Recordable) {
    openDrawer(true, record);
  }
</script>
<style lang="less">
  .widgets-bundle-list {
  }
</style>
