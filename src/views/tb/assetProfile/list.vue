<template>
  <div class="asset-profile-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> 新增资产配置
          </a-button>
          <a-input v-model:value="searchParam.textSearch" placeholder="输入搜索内容" allow-clear @change="reload"
            style="width: 240px;">
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
  name: "ViewsTbAssetProfileList",
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
import { assetProfileList, deleteAssetProfile, setDefaultAssetProfile } from '/@/api/tb/assetProfile';
import InputForm from './form.vue';
import DetailDrawer from './detail.vue';



const { t } = useI18n('tb');
const { createConfirm, showMessage } = useMessage();

const getTitle = {
  value: '资产配置',
};


const searchParam = reactive({
  textSearch: '',
})
const tableColumns: BasicColumn[] = [
  {
    title: t('名称'),
    dataIndex: 'name',
    key: 'name',
    sorter: true,
    width: 260,
    align: 'left',
    fixed: 'left',
    slot: 'firstColumn',
  },
  {
    title: '描述信息',
    dataIndex: 'description',
    key: 'description',
    align: 'left',
    ellipsis: true,
  },
  {
    title: '默认',
    dataIndex: 'default',
    key: 'default',
    width: 80,
    align: 'center',
    slot: 'default'
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
]

const actionColumn: BasicColumn = {
  width: 160,
  actions: (record: Recordable) => [
    {
      icon: 'ant-design:flag-outlined',
      title: t('设为默认资产配置'),
      disabled: record.name == 'TbServiceQueue' || record.default == true,
      onClick: handleSetDefault.bind(this, { ...record }),
    },
    {
      icon: 'ant-design:delete-outlined',
      color: 'error',
      title: t('删除资产配置'),
      disabled: record.name == 'TbServiceQueue' || record.default == true,
      onClick: handleDelete.bind(this, { ...record }),
    },
  ],
};

const [registerModal, { openModal }] = useModal();
const [registerDrawer, { openDrawer }] = useDrawer();
const [registerTable, { reload }] = useTable({
  rowKey: (record) => record.id.id,
  api: assetProfileList,
  beforeFetch: wrapFetchParams,
  defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
  columns: tableColumns,
  actionColumn: actionColumn,
  showTableSetting: true,
  useSearchForm: false,
  canResize: true,
});

function wrapFetchParams(param: any) {

  return { ...param, textSearch: searchParam.textSearch }
}


function handleForm(record: Recordable) {
  openModal(true, record);
}

async function handleDelete(record: Recordable) {
  createConfirm({
    iconType: 'error',
    title: `确定删除资产配置[${record.name}]吗？`,
    content: '请注意：确认后，资产配置和所有相关数据将不可恢复。',
    centered: false,
    okText: '删除',
    okButtonProps: {
      type: 'primary',
      danger: true,
    },
    onOk: async () => {
      try {
        await deleteAssetProfile(record.id.id);
        showMessage('删除资产配置成功！');
      } catch (error: any) {
        console.log(error);
      } finally {
        handleSuccess();
      }
    }

  })
}

async function handleSetDefault(record: Recordable) {
  createConfirm({
    iconType: 'info',
    title: `确定要将资产配置[${record.name}]设置为默认吗？`,
    content: '确认后，资产配置将被标记为默认，并将用于未指定配置的新资产',
    centered: false,
    okText: '确认',
    onOk: async () => {
      try {
        await setDefaultAssetProfile(record.id.id);
        showMessage('设置默认资产配置成功！');
      } catch (error: any) {
        console.log(error);
      } finally {
        handleSuccess();
      }
    }

  })
}

function handleSuccess() {
  reload();
}

function handleDetail(record: Recordable) {
  openDrawer(true, record);
}


</script>
<style lang="less">
.asset-profile-list {}
</style>