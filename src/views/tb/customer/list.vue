<template>
  <div class="customer-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.customer.action.add') }}
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
        <a @click="handleDetail({ id: record.id })" :title="record.title">
          {{ record.title }}
        </a></template
      >
      <template #city="{ record }">
        {{ areaList.city_list[record.city] }}
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete" @user="handleCustomerUser" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbCustomerList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { customerList, deleteCustomer } from '/@/api/tb/customer';
  import { areaList } from '@vant/area-data';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.customer.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.customer.table.name'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      width: 230,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.customer.table.email'),
      dataIndex: 'email',
      key: 'email',
      width: 230,
      align: 'left',
    },
    {
      title: t('tb.customer.table.city'),
      dataIndex: 'city',
      key: 'city',
      width: 140,
      sorter: true,
      align: 'center',
      slot: 'city',
    },
    {
      title: t('tb.customer.table.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      align: 'center',
    },
    {
      title: t('tb.customer.table.address'),
      dataIndex: 'address',
      ellipsis: true,
      key: 'address',
      align: 'center',
    },
    {
      title: t('tb.customer.table.createdTime'),
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
        icon: 'ant-design:team-outlined',
        title: t('tb.customer.action.customerUser'),
        disabled: record.title == 'Public',
        onClick: handleCustomerUser.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.customer.action.delete'),
        disabled: record.title == 'Public',
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: customerList,
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
      title: t('tb.customer.action.deleteConfirm', { name: record.title }),
      content: t('tb.customer.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.customer.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteCustomer(record.id.id);
          showMessage(t('tb.customer.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleCustomerUser(record: Recordable) {
    router.push(`/customer/${record.id.id}/users`);
  }

  function handleSuccess() {
    reload();
  }

  function handleDetail(record: Recordable) {
    openDrawer(true, record);
  }
</script>
<style lang="less"></style>
