<template>
  <div class="widgets-bundle-list">
    <BasicTable @register="registerTable">
      <!-- <template #headerTop>
        <div class="text-lg font-bold my-2">{{ t(getTitle.value) }}</div>
      </template> -->
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.widgetsBundle.action.add') }}
          </a-button>
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
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const { hasPermission } = usePermission();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.widgetsBundle.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.widgetsBundle.table.title'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      width: 260,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.widgetsBundle.table.description'),
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      ellipsis: true,
    },
    {
      title: t('tb.widgetsBundle.table.system'),
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
    {
      title: t('tb.widgetsBundle.table.createdTime'),
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
        title: t('tb.widgetsBundle.action.open'),
        onClick: handleOpenBundle.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:download-outlined',
        title: t('tb.widgetsBundle.action.export'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.widgetsBundle.action.delete'),
        disabled: !!(hasPermission(Authority.TENANT_ADMIN) && isEqual(SYS_TENANT_ID, record.tenantId)),
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
      title: t('tb.widgetsBundle.action.deleteConfirm', { name: record.title }),
      content: t('tb.widgetsBundle.action.deleteConfirmContent'),
      centered: false,
      okText: t('common.delText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteWidgetsBundle(record.id.id);
          showMessage(t('tb.widgetsBundle.action.deleteSuccess'));
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
