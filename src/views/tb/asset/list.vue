<template>
  <div class="asset-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})" v-show="hasPermission(Authority.TENANT_ADMIN)">
            <Icon icon="i-fluent:add-12-filled" /> 新增资产
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
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
    name: 'ViewsTbAssetList',
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
    deleteAsset,
    getTenantAssetInfoList,
    getCustomerAssetInfoList,
    unAssignAssetFromCustomer,
    assignAssetToPublicCustomer,
  } from '/@/api/tb/asset';
  import InputForm from './form.vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import DetailDrawer from './detail.vue';
  import AssignCustomer from './assignCustomer.vue';
  import { Authority } from '/@/enums/authorityEnum';
  import { assetProfileInfoList } from '/@/api/tb/assetProfile';

  const userStore = useUserStore();

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: '资产',
  };

  const assetProfileList = ref<any[]>([]);

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('名称'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
      ellipsis: false,
    },
    {
      title: '资产配置',
      dataIndex: 'assetProfileName',
      key: 'assetProfileId',
      align: 'left',
      ellipsis: false,
      filterMultiple: false,
      filters: assetProfileList.value.map((item) => ({ text: item.name, value: item.id.id })),
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      align: 'left',
      ellipsis: false,
    },
    {
      title: '客户',
      dataIndex: 'customerTitle',
      key: 'customerTitle',
      align: 'left',
      ellipsis: false,
      ifShow: hasPermission(Authority.TENANT_ADMIN),
    },

    {
      title: '公开',
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
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle,
        onClick: handleAssignToPublic.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:contacts-outlined',
        title: t('分配客户'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle,
        onClick: handleAssignCustomer.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:rollback-outlined',
        title: t('取消分配客户'),
        ifShow: hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle,
        onClick: handleUnAssignFromCustomer.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除资产配置'),
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
    api: fetchAssetList,
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

  async function fetchAssetList(param: any) {
    return await assetProfileInfoList({ pageSize: 2147483647, page: 0, sortProperty: 'name', sortOrder: 'ASC' }).then(
      (result) => {
        assetProfileList.value = result.data;
        updateColumn({
          title: '资产配置',
          dataIndex: 'assetProfileName',
          key: 'assetProfileId',
          align: 'left',
          ellipsis: false,
          filters: assetProfileList.value.map((item) => ({ text: item.name, value: item.id.id })),
        });
        return hasPermission(Authority.CUSTOMER_USER)
          ? getCustomerAssetInfoList(param, userStore.getUserInfo?.customerId.id || '')
          : getTenantAssetInfoList(param);
      },
    );
  }

  function handleForm(record: Recordable) {
    openFormModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: `确定删除资产[${record.name}]吗？`,
      content: '请注意：确认后，资产和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteAsset(record.id.id);
          showMessage('删除资产配置成功！');
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
      title: `确定要将资产[${record.name}]设为公开吗？`,
      content: '请注意：确认后，资产及其所有数据将被公开并被他人访问。',
      centered: false,
      okText: '确认',
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await assignAssetToPublicCustomer(record.id.id);
          showMessage('资产设置为公开成功！');
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
      title: `确定要将资产[${record.name}]设为私有吗？`,
      content: '请注意：确认后，资产及其所有数据将被私有化，无法被他人访问。',
      centered: false,
      okText: '确认',
      okButtonProps: {
        type: 'primary',
      },
      onOk: async () => {
        try {
          await unAssignAssetFromCustomer(record.id.id);
          showMessage('资产设为私有成功！');
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
  .asset-list {
  }
</style>
