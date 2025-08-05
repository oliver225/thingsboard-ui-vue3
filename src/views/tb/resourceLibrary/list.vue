<template>
  <div class="resource-library-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} </div>
      </template>

      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增资源 </a-button>
          <Select v-model:value="searchParam.resourceType" @change="reload" style="width: 130px">
            <Select.Option value="">全部 </Select.Option>
            <Select.Option v-for="item in RESOURCE_TYPE_OPTIONS" :key="item.value" :value="item.value">{{
              item.label
            }}</Select.Option>
          </Select>
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
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete" @download="handleDownload" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbResourceLibraryList',
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
  import { resourceList, deleteResource } from '/@/api/tb/resourceLibrary';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { Checkbox, Select } from 'ant-design-vue';
  import { isEqual } from 'lodash-es';
  import { SYS_TENANT_ID } from '/#/constant';
  import { RESOURCE_TYPE_OPTIONS } from '/@/enums/resourceTypeEnum';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || '资源库',
  };

  const searchParam = reactive({
    textSearch: '',
    resourceType: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('标题'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: '资源Key',
      dataIndex: 'resourceKey',
      key: 'resourceKey',
      width: 120,
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 160,
      format: (text: any) => (text ? RESOURCE_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
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
        icon: 'ant-design:download-outlined',
        title: t('导出资源'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除资源'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: resourceList,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(fetchParam: any) {
    return {
      ...fetchParam,
      textSearch: searchParam.textSearch,
      resourceType: searchParam.resourceType,
    };
  }

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    const modalFunc = createConfirm({
      iconType: 'error',
      title: `确定删除资源[${record.title}]吗？`,
      content: '请注意：确认后，资源将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onCancel: () => modalFunc.destroy(),
      onOk: async () => {
        try {
          await deleteResource(record.id.id);
          showMessage('删除资源成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          modalFunc.destroy();
          handleSuccess();
        }
      },
    });
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
  .resource-library-list {
  }
</style>
