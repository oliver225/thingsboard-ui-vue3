<template>
  <div class="device-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} ( {{ customer.title }}) </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleAssignCustomer()">
            <Icon icon="ant-design:contacts-outlined" /> {{ t('分配新设备') }}
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
      <template #active="{ record }">
        <Tag v-if="record.active == true" color="success">{{ t('tb.device.table.online') }}</Tag>
        <Tag v-if="record.active == false" color="error">{{ t('tb.device.table.offline') }}</Tag>
      </template>
      <template #gateway="{ record }">
        <Checkbox :checked="record.additionalInfo?.gateway || false" />
      </template>
    </BasicTable>
    <DetailDrawer
      @register="registerDetailDrawer"
      @credentials="handleCredentials"
      @unAssignFromCustomer="handleUnAssignFromCustomer"
    />
    <AssignDevice @register="registerAssignDeviceModal" @success="handleSuccess" />
    <Credentials @register="registerCredentialsModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbCustomerDeviceList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, ref } from 'vue';
  import { router } from '/@/router';
  import { Checkbox, Tag } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import Icon from '/@/components/Icon/src/Icon.vue';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { getDeviceProfileInfoList } from '/@/api/tb/deviceProfile';
  import { unAssignDeviceFromCustomer, getCustomerDeviceInfoList } from '/@/api/tb/device';
  import DetailDrawer from '/@/views/tb/device/detail.vue';
  import AssignDevice from './assignDevice.vue';
  import Credentials from '/@/views/tb/device/credentials.vue';
  import { Customer, getCustomerById } from '/@/api/tb/customer';
  import { isEmpty } from '/@/utils/is';

  const userStore = useUserStore();

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.device.title'),
  };

  const customer = ref<Customer>({} as Customer);

  const deviceProfileList = ref<any[]>([]);

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.device.table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: false,
    },
    {
      title: t('tb.device.table.deviceProfile'),
      dataIndex: 'deviceProfileName',
      key: 'deviceProfileId',
      align: 'left',
      ellipsis: false,
      filterMultiple: false,
      filters: deviceProfileList.value.map((item) => ({ text: item.name, value: item.id.id })),
    },
    {
      title: t('tb.device.table.label'),
      dataIndex: 'label',
      key: 'label',
      align: 'left',
      ellipsis: false,
    },

    {
      title: t('tb.device.table.status'),
      dataIndex: 'active',
      key: 'active',
      align: 'center',
      width: 100,
      slot: 'active',
      filterMultiple: false,
      filters: [
        { text: t('tb.device.table.online'), value: 'true' },
        { text: t('tb.device.table.offline'), value: 'false' },
      ],
    },
    {
      title: t('tb.device.table.gateway'),
      dataIndex: 'gateway',
      key: 'gateway',
      width: 80,
      align: 'center',
      slot: 'gateway',
    },
    {
      title: t('tb.device.table.createdTime'),
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
        title: t('tb.device.action.unassignCustomer'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle,
        onClick: handleUnAssignFromCustomer.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:safety-outlined',
        title: t('tb.device.action.manageCredentials'),
        onClick: handleCredentials.bind(this, { ...record }),
      },
    ],
  };

  const [registerCredentialsModal, { openModal: openCredentialsModal }] = useModal();
  const [registerAssignDeviceModal, { openModal: openAssignDeviceModal }] = useModal();
  const [registerDetailDrawer, { openDrawer: openDetailDrawer }] = useDrawer();
  const [registerTable, { reload, updateColumn }] = useTable({
    rowKey: (record) => record.id.id,
    api: fetchData,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    const active = param.active ? param.active[0] : null;
    const deviceProfileId = param.deviceProfileId ? param.deviceProfileId[0] : null;
    return {
      ...param,
      textSearch: searchParam.textSearch,
      active: active,
      deviceProfileId: deviceProfileId,
    };
  }

  async function fetchData(param: any) {
    const customerId = router.currentRoute.value.params.customerId as string;
    if (isEmpty(customerId)) {
      return Promise.reject(new Error(t('tb.user.action.customerEmpty')));
    }

    return getCustomerById(customerId).then((res) => {
      customer.value = res;
      return getDeviceProfileInfoList({
        pageSize: 2147483647,
        page: 0,
        sortProperty: 'name',
        sortOrder: 'ASC',
      }).then((result) => {
        deviceProfileList.value = result.data;
        updateColumn({
          title: t('tb.device.table.deviceProfile'),
          dataIndex: 'deviceProfileName',
          key: 'deviceProfileId',
          align: 'left',
          ellipsis: false,
          filters: deviceProfileList.value.map((item) => ({ text: item.name, value: item.id.id })),
        });
        return getCustomerDeviceInfoList(param, customer.value.id.id);
      });
    });
  }

  function handleCredentials(record: Recordable) {
    openCredentialsModal(true, { ...record });
  }

  function handleAssignCustomer() {
    openAssignDeviceModal(true, customer.value);
  }

  function handleUnAssignFromCustomer(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.device.action.unassignCustomerConfirm', { name: record.name }),
      content: t('tb.device.action.unassignCustomerConfirmContent'),
      centered: false,
      okText: t('tb.device.action.unassignCustomer'),
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await unAssignDeviceFromCustomer(record.id.id);
          showMessage(t('tb.device.action.unassignCustomerSuccess'));
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
  .device-list {
  }
</style>
