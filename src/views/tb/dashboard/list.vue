<template>
  <div class="dashboard-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})" v-show="hasPermission(Authority.TENANT_ADMIN)">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('新增仪表板') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('输入搜索')"
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
      <template #customerIsPublic="{ record }">
        <Checkbox
          :checked="Array.isArray(record.assignedCustomers) && record.assignedCustomers.some((c) => c.public)"
        />
      </template>
      <template #assignedCustomers="{ record }">
        <template v-if="Array.isArray(record.assignedCustomers)">
          <template v-if="record.assignedCustomers.some((c) => !c.public)">
            <Tag v-for="c in record.assignedCustomers.filter((c) => !c.public)" :key="c.customerId?.id || c.title">
              {{ c.title }}
            </Tag>
          </template>
          <span v-else>-</span>
        </template>
        <span v-else>-</span>
      </template>
    </BasicTable>
    <InputForm @register="registerFormModal" @success="handleSuccess" />

    <DetailDrawer
      @register="registerDetailDrawer"
      @edit="handleForm"
      @delete="handleDelete"
      @assignToPublic="handleAssignToPublic"
      @assignToCustomer="handleAssignCustomer"
      @unAssignToPublic="handleUnAssignToPublic"
    />
    <AssignCustomer @register="registerAssignCustomerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbDashboardList',
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
  import { Checkbox, Tag } from 'ant-design-vue';
  import { useUserStore } from '/@/store/modules/user';
  import {
    currentTenantDashboardList,
    assignDashboardToPublicCustomer,
    unassignDashboardFromPublicCustomer,
    deleteDashboard,
    customerDashboardList,
  } from '/@/api/tb/dashboard';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import AssignCustomer from './assignCustomer.vue';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { router } from '/@/router';

  const userStore = useUserStore();

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('仪表板'),
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
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: false,
    },
    {
      title: t('分配客户'),
      dataIndex: 'assignedCustomers',
      key: 'assignedCustomers',
      align: 'left',
      ellipsis: false,
      slot: 'assignedCustomers',
      ifShow: hasPermission(Authority.TENANT_ADMIN),
    },
    {
      title: t('公开'),
      dataIndex: 'customerIsPublic',
      key: 'customerIsPublic',
      width: 80,
      align: 'center',
      slot: 'customerIsPublic',
      ifShow: hasPermission(Authority.TENANT_ADMIN),
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
        icon: 'ant-design:share-alt-outlined',
        title: t('设为公开'),
        ifShow:
          hasPermission(Authority.TENANT_ADMIN) &&
          !(Array.isArray(record.assignedCustomers) && record.assignedCustomers.some((c) => c.public)),
        onClick: handleAssignToPublic.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:rollback-outlined',
        title: t('设为私有'),
        ifShow:
          hasPermission(Authority.TENANT_ADMIN) &&
          Array.isArray(record.assignedCustomers) &&
          record.assignedCustomers.some((c) => c.public),
        onClick: handleUnAssignToPublic.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:contacts-outlined',
        title: t('分配客户'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleAssignCustomer.bind(this, { ...record }),
      },

      {
        icon: 'i-clarity:note-edit-line',
        color: 'success',
        title: t('编辑仪表板'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleDetail.bind(this, { ...record }),
      },

      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除仪表板'),
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
    api: fetchDashboardList,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  async function fetchDashboardList(param: any) {
    return hasPermission(Authority.CUSTOMER_USER)
      ? customerDashboardList(param, userStore.getUserInfo?.customerId.id || '')
      : currentTenantDashboardList(param);
  }

  function handleForm(record: Recordable) {
    openFormModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('确认删除仪表板', { name: record.name }),
      content: t('确认删除仪表板'),
      centered: false,
      okText: t('删除'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteDashboard(record.id.id);
          showMessage(t('删除仪表板成功'));
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
      title: t('tb.dashboard.action.setPublicConfirm', { name: record.name }),
      content: t('tb.dashboard.action.setPublicConfirmContent'),
      centered: false,
      okText: t('tb.dashboard.action.setPublic'),
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await assignDashboardToPublicCustomer(record.id.id);
          showMessage(t('tb.dashboard.action.setPublicSuccess'));
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

  function handleUnAssignToPublic(record: Recordable) {
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
          await unassignDashboardFromPublicCustomer(record.id.id);
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
    router.push({ path: `/dashboard/${record.id.id}` });
  }
</script>
