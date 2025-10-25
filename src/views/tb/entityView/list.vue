<template>
  <div class="entityView-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})" v-show="hasPermission(Authority.TENANT_ADMIN)">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.entityView.action.add') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
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

      <template #customerIsPublic="{ record }">
        <Checkbox :checked="record.customerIsPublic" />
      </template>
    </BasicTable>
    <InputForm @register="registerFormModal" @success="handleSuccess" />
    <DetailDrawer
      @register="registerDetailDrawer"
      @edit="handleForm"
      @delete="handleDelete"
      @assignToPublic="handleAssignToPublic"
      @assignToCustomer="handleAssignCustomer"
      @unAssignFromCustomer="handleUnAssignFromCustomer"
    />
    <AssignCustomer @register="registerAssignCustomerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbEntityViewList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { Checkbox } from 'ant-design-vue';
  import { useUserStore } from '/@/store/modules/user';
  import {
    getEntityViewTypes,
    deleteEntityView,
    getTenantEntityViewInfos,
    getCustomerEntityViewInfos,
    unAssignEntityViewFromCustomer,
    assignEntityViewToPublicCustomer,
  } from '/@/api/tb/entityView';
  import InputForm from './form.vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import DetailDrawer from './detail.vue';
  import AssignCustomer from './assignCustomer.vue';
  import { Authority } from '/@/enums/authorityEnum';
  import { router } from '/@/router';

  const userStore = useUserStore();

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.entityView.title'),
  };

  const entityViewTypeList = ref<any[]>([]);

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.entityView.table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: false,
    },
    {
      title: t('tb.entityView.table.type'),
      dataIndex: 'type',
      key: 'type',
      align: 'left',
      filterMultiple: false,
      filters: entityViewTypeList.value.map((item) => ({ text: item.type, value: item.type })),
    },
    {
      title: t('tb.entityView.table.customer'),
      dataIndex: 'customerTitle',
      key: 'customerTitle',
      align: 'left',
      ellipsis: false,
      ifShow: hasPermission(Authority.TENANT_ADMIN),
    },

    {
      title: t('tb.entityView.table.public'),
      dataIndex: 'customerIsPublic',
      key: 'customerIsPublic',
      width: 80,
      align: 'center',
      slot: 'customerIsPublic',
      ifShow: hasPermission(Authority.TENANT_ADMIN),
    },
    {
      title: t('tb.entityView.table.createdTime'),
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
        icon: 'ant-design:share-alt-outlined',
        title: t('tb.entityView.action.setPublic'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle,
        onClick: handleAssignToPublic.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:contacts-outlined',
        title: t('tb.entityView.action.assignCustomer'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle,
        onClick: handleAssignCustomer.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:rollback-outlined',
        title: t('tb.entityView.action.unassignCustomer'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle,
        onClick: handleUnAssignFromCustomer.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.entityView.action.delete'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerAssignCustomerModal, { openModal: openAssignCustomerModal }] = useModal();
  const [registerFormModal, { openModal: openFormModal }] = useModal();
  const [registerDetailDrawer, { openDrawer: openDetailDrawer }] = useDrawer();
  const [registerTable, { reload, updateColumn }] = useTable({
    rowKey: (record) => record.id.id,
    api: fetchEntityViewList,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    const type = param.type ? param.type[0] : null;
    return { ...param, textSearch: searchParam.textSearch, type: type };
  }

  async function fetchEntityViewList(param: any) {
    return await getEntityViewTypes().then((result) => {
      entityViewTypeList.value = result;
      updateColumn({
        title: t('tb.entityView.table.type'),
        dataIndex: 'type',
        key: 'type',
        align: 'left',
        filters: entityViewTypeList.value.map((item) => ({ text: item.type, value: item.type })),
      });
      return hasPermission(Authority.CUSTOMER_USER)
        ? getCustomerEntityViewInfos(param, userStore.getUserInfo?.customerId.id || '')
        : getTenantEntityViewInfos(param);
    });
  }

  function handleForm(record: Recordable) {
    openFormModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.entityView.action.deleteConfirm', { name: record.name }),
      content: t('tb.entityView.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.entityView.common.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteEntityView(record.id.id);
          showMessage(t('tb.entityView.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleAssignToPublic(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.entityView.action.setPublicConfirm', { name: record.name }),
      content: t('tb.entityView.action.setPublicConfirmContent'),
      centered: false,
      okText: t('tb.entityView.common.confirm'),
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await assignEntityViewToPublicCustomer(record.id.id);
          showMessage(t('tb.entityView.action.setPublicSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleAssignCustomer(record: Recordable) {
    openAssignCustomerModal(true, { ...record });
  }

  function handleUnAssignFromCustomer(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.entityView.action.unassignCustomerConfirm', { name: record.name }),
      content: t('tb.entityView.action.unassignCustomerConfirmContent'),
      centered: false,
      okText: t('tb.entityView.common.confirm'),
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await unAssignEntityViewFromCustomer(record.id.id);
          showMessage(t('tb.entityView.action.unassignCustomerSuccess'));
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
    openDetailDrawer(true, record);
  }
</script>
<style lang="less">
  .entityView-list {
  }
</style>
