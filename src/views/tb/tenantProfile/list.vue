<template>
  <div class="tenant-profile-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.tenantProfile.action.add') }}
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
      <template #isolatedTbRuleEngine="{ record }">
        <Checkbox :checked="record.isolatedTbRuleEngine" />
      </template>
      <template #default="{ record }">
        <Checkbox :checked="record.default" />
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer
      @register="registerDrawer"
      @edit="handleForm"
      @delete="handleDelete"
      @default="handleSetProfileDefault"
    />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbTenantProfileList',
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
  import { tenantProfileList, deleteTenantProfile, setTenantProfileDefault } from '/@/api/tb/tenantProfile';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { Checkbox } from 'ant-design-vue';
  import { router } from '/@/router';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.tenantProfile.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.tenantProfile.table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 260,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.tenantProfile.table.description'),
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      ellipsis: true,
    },
    {
      title: t('tb.tenantProfile.table.isolatedTbRuleEngine'),
      dataIndex: 'isolatedTbRuleEngine',
      key: 'isolatedTbRuleEngine',
      width: 120,
      align: 'center',
      slot: 'isolatedTbRuleEngine',
    },
    {
      title: t('tb.tenantProfile.table.default'),
      dataIndex: 'default',
      key: 'default',
      width: 120,
      align: 'center',
      slot: 'default',
    },
    {
      title: t('tb.tenantProfile.table.createdTime'),
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
        icon: 'ant-design:flag-outlined',
        title: t('tb.tenantProfile.action.setDefault'),
        onClick: handleSetProfileDefault.bind(this, { ...record }),
        ifShow: !!!record?.default,
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.tenantProfile.action.delete'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: tenantProfileList,
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
      title: t('tb.tenantProfile.action.deleteConfirm', { name: record.name }),
      content: t('tb.tenantProfile.action.deleteConfirmContent'),
      centered: false,
      okText: t('common.delText'),
      onOk: async () => {
        try {
          await deleteTenantProfile(record.id.id);
          showMessage(t('tb.tenantProfile.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  async function handleSetProfileDefault(record: Recordable) {
    createConfirm({
      iconType: 'warning',
      title: t('tb.tenantProfile.action.setDefaultConfirm', { name: record.name }),
      centered: false,
      okText: t('common.okText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await setTenantProfileDefault(record.id.id);
          showMessage(t('tb.tenantProfile.action.setDefaultSuccess'));
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
    openDrawer(true, record);
  }
</script>
<style lang="less">
  .tenant-profile-list {
  }
</style>
