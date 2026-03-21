<template>
  <div class="dashboard-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} ( {{ customer.title }}) </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleAssignCustomer()" v-show="hasPermission(Authority.TENANT_ADMIN)">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('分配新仪表盘') }}
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
        <a @click="handleOpenDashboard({ id: record.id })" :title="record.title">
          {{ record.title }}
        </a>
      </template>
    </BasicTable>

    <DetailDrawer @register="registerDetailDrawer" @unAssignToPublic="handleUnAssignToCustomer" />
    <AssignDashboard @register="registerAssignCustomerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbCustomerDashboardList',
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
  import { useUserStore } from '/@/store/modules/user';
  import { customerDashboardList, unassignDashboardFromCustomer } from '/@/api/tb/dashboard';
  import DetailDrawer from '/@/views/tb/dashboard/detail.vue';
  import AssignDashboard from './assignDashboard.vue';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Customer, getCustomerById } from '/@/api/tb/customer';
  import { router } from '/@/router';
  import { isEmpty } from '/@/utils/is';

  const userStore = useUserStore();

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.dashboard.title'),
  };
  const customer = ref<Customer>({} as Customer);

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.dashboard.table.title'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: false,
    },
    {
      title: t('tb.dashboard.table.createdTime'),
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
        icon: 'ant-design:rollback-outlined',
        title: t('tb.dashboard.action.setSelf'),
        onClick: handleUnAssignToCustomer.bind(this, { ...record }),
      },

      {
        icon: 'i-clarity:note-edit-line',
        color: 'success',
        title: t('tb.dashboard.action.edit'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleDetail.bind(this, { ...record }),
      },
    ],
  };

  const [registerAssignCustomerModal, { openModal: openAssignCustomerModal }] = useModal();
  const [registerDetailDrawer, { openDrawer: openDetailDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: fetchData,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  async function fetchData(param: any) {
    const customerId = router.currentRoute.value.params.customerId as string;
    if (isEmpty(customerId)) {
      return Promise.reject(new Error(t('tb.user.action.customerEmpty')));
    }
    return getCustomerById(customerId).then((res) => {
      customer.value = res;
      return customerDashboardList(param, customer.value.id.id);
    });
  }

  function handleAssignCustomer() {
    openAssignCustomerModal(true, customer.value);
  }

  function handleUnAssignToCustomer(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.dashboard.action.setSelfConfirm', { name: record.name }),
      content: t('tb.dashboard.action.setSelConfirmContent'),
      centered: false,
      okText: t('tb.dashboard.action.setSelf'),
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await unassignDashboardFromCustomer(record.id.id, customer.value.id.id);
          showMessage(t('tb.dashboard.action.setSelfSuccess'));
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

  function handleOpenDashboard(record: Recordable) {
    router.push({ path: `/dashboards/${record.id.id}` });
  }
</script>
