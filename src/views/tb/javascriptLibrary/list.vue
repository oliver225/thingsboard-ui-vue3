<template>
  <div class="javascript-library-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} </div>
      </template>

      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.javascriptLibrary.action.add') }}
          </a-button>
          <Select v-model:value="searchParam.resourceSubType" @change="() => reload()" style="width: 130px">
            <Select.Option value="">{{ t('tb.javascriptLibrary.filter.all') }} </Select.Option>
            <Select.Option v-for="item in JAVASCRIPT_TYPE_OPTIONS" :key="item.value" :value="item.value">{{
              item.label
            }}</Select.Option>
          </Select>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
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
    <DetailDrawer @register="registerDrawer" @delete="handleDelete" @download="handleDownload" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbJavaScriptLibraryList',
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
  import { resourceList, deleteResource, resourceDownload } from '/@/api/tb/resourceLibrary';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { Checkbox, Select } from 'ant-design-vue';
  import { isEqual } from 'lodash-es';
  import { SYS_TENANT_ID } from '/#/constant';
  import { JAVASCRIPT_TYPE_OPTIONS } from '/@/enums/resourceTypeEnum';
  import { downloadByData } from '/@/utils/file/download';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const { hasPermission } = usePermission();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.javascriptLibrary.title'),
  };

  const searchParam = reactive({
    textSearch: '',
    resourceType: 'JS_MODULE',
    resourceSubType: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.javascriptLibrary.table.title'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.javascriptLibrary.table.resourceSubType'),
      dataIndex: 'resourceSubType',
      key: 'resourceSubType',
      width: 260,
      format: (text: any) => (text ? JAVASCRIPT_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('tb.javascriptLibrary.table.system'),
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
    {
      title: t('tb.javascriptLibrary.table.createdTime'),
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
        title: t('tb.javascriptLibrary.action.download'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        disabled: !!(hasPermission(Authority.TENANT_ADMIN) && record.link.indexOf('system') > -1),
        title: t('tb.javascriptLibrary.action.delete'),
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
      resourceSubType: searchParam.resourceSubType,
    };
  }

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    const modalFunc = createConfirm({
      iconType: 'error',
      title: t('tb.javascriptLibrary.action.deleteConfirm', { title: record.title }),
      content: t('tb.javascriptLibrary.action.deleteConfirmContent'),
      centered: false,
      okText: t('common.delText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onCancel: () => modalFunc.destroy(),
      onOk: async () => {
        try {
          await deleteResource(record.id.id);
          showMessage(t('tb.javascriptLibrary.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          modalFunc.destroy();
          handleSuccess();
        }
      },
    });
  }

  async function handleDownload(record: Recordable) {
    const data = await resourceDownload(record.id.id);
    downloadByData(data, record.fileName);
  }

  function handleSuccess() {
    reload();
  }

  function handleDetail(record: Recordable) {
    openDrawer(true, record);
  }
</script>
