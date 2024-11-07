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
            <Icon icon="i-fluent:add-12-filled" /> 新增客户
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
        <a @click="handleDetail({ id: record.id, })" :title="record.title">
          {{ record.title }}
        </a></template>
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
  value: router.currentRoute.value.meta.title || '客户',
};



const searchParam = reactive({
  textSearch: '',
})
const tableColumns: BasicColumn[] = [
  {
    title: t('客户名称'),
    dataIndex: 'title',
    key: 'title',
    sorter: true,
    width: 230,
    align: 'left',
    fixed: 'left',
    slot: 'firstColumn',
  },
  {
    title: t('邮箱地址'),
    dataIndex: 'email',
    key: 'email',
    width: 230,
    align: 'left',
  },
  {
    title: t('城市'),
    dataIndex: 'city',
    key: 'city',
    width: 140,
    sorter: true,
    align: 'center',
    slot: 'city',
  },
  {
    title: t('电话'),
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
    align: 'center',
  },
  {
    title: t('详细地址'),
    dataIndex: 'address',
    ellipsis: true,
    key: 'address',
    align: 'center',
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
      icon: 'ant-design:team-outlined',
      title: t('客户用户'),
      disabled: record.title == 'Public',
      onClick: handleCustomerUser.bind(this, { ...record }),
    },
    {
      icon: 'ant-design:delete-outlined',
      color: 'error',
      title: t('删除客户'),
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
  return { ...param, textSearch: searchParam.textSearch }
}

function handleForm(record: Recordable) {
  openModal(true, record);
}

async function handleDelete(record: Recordable) {
  createConfirm({
    iconType: 'error',
    title: `确定删除客户[${record.title}]吗？`,
    content: '请注意：确认后，客户和所有相关数据将不可恢复。',
    centered: false,
    okText: '删除',
    okButtonProps: {
      type: 'primary',
      danger: true,
    },
    onOk: async () => {
      try {
        await deleteCustomer(record.id.id);
        showMessage('删除客户成功！');
      } catch (error: any) {
        console.log(error);
      } finally {
        handleSuccess();
      }
    }

  })
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
<style lang="less">
.customer-list {}
</style>