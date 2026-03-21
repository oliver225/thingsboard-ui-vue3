<template>
  <div class="asset-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} ( {{ customer.title }}) </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleAssignCustomer()">
            <Icon icon="ant-design:contacts-outlined" /> {{ t('分配新资产') }}
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
    </BasicTable>
    <DetailDrawer @register="registerDetailDrawer" @unAssignFromCustomer="handleUnAssignFromCustomer" />
    <AssignAsset @register="registerAssignCustomerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbCustomerAssetList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, ref } from 'vue';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { Authority } from '/@/enums/authorityEnum';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStore } from '/@/store/modules/user';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { assetProfileInfoList } from '/@/api/tb/assetProfile';
  import { unAssignAssetFromCustomer, getCustomerAssetInfoList } from '/@/api/tb/asset';
  import DetailDrawer from '/@/views/tb/asset/detail.vue';
  import AssignAsset from './assignAsset.vue';
  import { Customer, getCustomerById } from '/@/api/tb/customer';
  import { isEmpty } from '/@/utils/is';

  const userStore = useUserStore();

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.asset.title'),
  };

  const customer = ref<Customer>({} as Customer);

  const assetProfileList = ref<any[]>([]);

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.asset.form.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: false,
    },
    {
      title: t('tb.asset.form.profile'),
      dataIndex: 'assetProfileName',
      key: 'assetProfileId',
      align: 'left',
      ellipsis: false,
      filterMultiple: false,
      filters: assetProfileList.value.map((item) => ({ text: item.name, value: item.id.id })),
    },
    {
      title: t('tb.asset.form.label'),
      dataIndex: 'label',
      key: 'label',
      align: 'left',
      ellipsis: false,
    },
    {
      title: t('tb.asset.detail.createdTime'),
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
        title: t('tb.asset.action.unAssignCustomer'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle,
        onClick: handleUnAssignFromCustomer.bind(this, { ...record }),
      },
    ],
  };

  const [registerAssignCustomerModal, { openModal: openAssignCustomerModal }] = useModal();
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
    const assetProfileId = param.assetProfileId ? param.assetProfileId[0] : null;
    return { ...param, textSearch: searchParam.textSearch, assetProfileId: assetProfileId };
  }

  async function fetchData(param: any) {
    const customerId = router.currentRoute.value.params.customerId as string;
    if (isEmpty(customerId)) {
      return Promise.reject(new Error(t('tb.user.action.customerEmpty')));
    }
    return getCustomerById(customerId).then((res) => {
      customer.value = res;
      return assetProfileInfoList({ pageSize: 2147483647, page: 0, sortProperty: 'name', sortOrder: 'ASC' }).then(
        (result) => {
          assetProfileList.value = result.data;
          updateColumn({
            title: t('tb.asset.form.profile'),
            dataIndex: 'assetProfileName',
            key: 'assetProfileId',
            align: 'left',
            ellipsis: false,
            filters: assetProfileList.value.map((item) => ({ text: item.name, value: item.id.id })),
          });
          return getCustomerAssetInfoList(param, customer.value.id.id);
        },
      );
    });
  }

  function handleAssignCustomer() {
    openAssignCustomerModal(true, customer.value);
  }

  function handleUnAssignFromCustomer(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.asset.action.setPrivateConfirm', { name: record.name }),
      content: t('tb.asset.action.setPrivateConfirmContent'),
      centered: false,
      okText: t('tb.asset.action.confirmText'),
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await unAssignAssetFromCustomer(record.id.id);
          showMessage(t('tb.asset.action.setPrivateSuccess'));
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
<style lang="less"></style>
