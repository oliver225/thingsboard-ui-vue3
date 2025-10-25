<template>
  <div class="device-profile-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.deviceProfile.action.add') }}
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
      <template #default="{ record }">
        <Checkbox :checked="record.default" />
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete" @default="handleSetDefault" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbDeviceProfileList',
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
  import { Checkbox } from 'ant-design-vue';
  import { deviceProfileList, deleteDeviceProfile, setDefaultDeviceProfile } from '/@/api/tb/deviceProfile';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { TRANSPORT_TYPE_OPTIONS } from '/@/enums/deviceEnum';
  import { router } from '/@/router';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.deviceProfile.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.deviceProfile.table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 260,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.deviceProfile.table.type'),
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      width: 100,
      format: (text: any) => (text ? (text == 'DEFAULT' ? t('tb.deviceProfile.table.default') : text) : ''),
    },

    {
      title: t('tb.deviceProfile.table.transportType'),
      dataIndex: 'transportType',
      key: 'transportType',
      align: 'center',
      width: 100,
      format: (text: any) => (text ? TRANSPORT_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('tb.deviceProfile.table.description'),
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      ellipsis: true,
    },
    {
      title: t('tb.deviceProfile.table.default'),
      dataIndex: 'default',
      key: 'default',
      width: 80,
      align: 'center',
      slot: 'default',
    },
    {
      title: t('tb.deviceProfile.table.createdTime'),
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
        title: t('tb.deviceProfile.action.setDefault'),
        disabled: record.default == true,
        onClick: handleSetDefault.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.deviceProfile.action.delete'),
        disabled: record.default == true,
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: deviceProfileList,
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
      title: t('tb.deviceProfile.confirm.deleteTitle', { name: record.name }),
      content: t('tb.deviceProfile.confirm.deleteContent'),
      centered: false,
      okText: t('tb.deviceProfile.common.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteDeviceProfile(record.id.id);
          showMessage(t('tb.deviceProfile.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  async function handleSetDefault(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.deviceProfile.confirm.setDefaultTitle', { name: record.name }),
      content: t('tb.deviceProfile.confirm.setDefaultContent'),
      centered: false,
      okText: t('tb.deviceProfile.common.confirm'),
      onOk: async () => {
        try {
          await setDefaultDeviceProfile(record.id.id);
          showMessage(t('tb.deviceProfile.action.setDefaultSuccess'));
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
  .device-profile-list {
  }
</style>
