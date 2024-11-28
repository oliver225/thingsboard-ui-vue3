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
            <Icon icon="i-fluent:add-12-filled" /> 新增设备配置
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
  name: "ViewsTbDeviceProfileList",
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
import ImageCard from './imageCard.vue';
import { TRANSPORT_TYPE_OPTIONS } from '/@/enums/deviceEnum';



const { t } = useI18n('tb');
const { createConfirm, showMessage } = useMessage();

const getTitle = {
  value: '设备配置',
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
    title: '配置类型',
    dataIndex: 'type',
    key: 'type',
    align: 'center',
    width: 100,
    format: (text: any) => text ? text == 'DEFAULT' ? '默认' : text : ''
  },

  {
    title: '传输方式',
    dataIndex: 'transportType',
    key: 'transportType',
    align: 'center',
    width: 100,
    format: (text: any) => text ? TRANSPORT_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''
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
      title: t('设为默认设备配置'),
      disabled: record.default == true,
      onClick: handleSetDefault.bind(this, { ...record }),
    },
    {
      icon: 'ant-design:delete-outlined',
      color: 'error',
      title: t('删除设备配置'),
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

  return { ...param, textSearch: searchParam.textSearch }
}


function handleForm(record: Recordable) {
  openModal(true, record);
}

async function handleDelete(record: Recordable) {
  createConfirm({
    iconType: 'error',
    title: `确定删除设备配置[${record.name}]吗？`,
    content: '请注意：确认后，设备配置和所有相关数据将不可恢复。',
    centered: false,
    okText: '删除',
    okButtonProps: {
      type: 'primary',
      danger: true,
    },
    onOk: async () => {
      try {
        await deleteDeviceProfile(record.id.id);
        showMessage('删除设备配置成功！');
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
    title: `确定要将设备配置[${record.name}]设置为默认吗？`,
    content: '确认后，设备配置将被标记为默认，并将用于未指定配置的新设备。',
    centered: false,
    okText: '确认',
    onOk: async () => {
      try {
        await setDefaultDeviceProfile(record.id.id);
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
.device-profile-list {}
</style>