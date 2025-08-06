<template>
  <div class="ota-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增包 </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #firstColumn="{ record }">
        <a @click="handleDetail({ id: record.id })" :title="record.title">
          {{ record.title }}
        </a>
      </template>
      <template #checksum="{ record }">
        <div v-if="!isEmpty(record.checksum)"> {{ record.checksumAlgorithm }}: {{ record.checksum }} </div>
      </template>
      <template #dataSize="{ record }">
        <div v-if="record.dataSize">
          {{ convertBytesToSize(record.dataSize) }}
        </div>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete" @download="handleDownload" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbOtaPackageList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { convertBytesToSize } from '/@/utils';
  import { isEmpty } from 'lodash-es';
  import { downloadByData } from '/@/utils/file/download';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { getOtaPackageList, deleteOtaPackage, downloadOtaPackage } from '/@/api/tb/otaPackage';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: 'OTA升级',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('标题'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('版本'),
      dataIndex: 'version',
      key: 'version',
      width: 100,
      sorter: true,
      fixed: 'left',
      align: 'left',
    },
    {
      title: t('版本标签'),
      dataIndex: 'tag',
      key: 'tag',
      align: 'left',
    },
    {
      title: t('包类型'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      sorter: true,
      align: 'center',
      format: (text) => (text == 'FIRMWARE' ? '固件' : '软件'),
    },
    {
      title: t('直接URL'),
      dataIndex: 'url',
      key: 'url',
      sorter: true,
      align: 'center',
    },
    {
      title: t('文件名'),
      dataIndex: 'fileName',
      key: 'fileName',
      sorter: true,
      align: 'left',
    },
    {
      title: t('文件大小'),
      dataIndex: 'dataSize',
      key: 'dataSize',
      sorter: true,
      width: 100,
      align: 'right',
      slot: 'dataSize',
    },
    {
      title: t('校验和'),
      dataIndex: 'checksum',
      key: 'checksum',
      align: 'left',
      slot: 'checksum',
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
        icon: 'ant-design:download-outlined',
        title: t('下载包'),
        onClick: handleDownload.bind(this, { ...record }),
        disabled: !record.dataSize,
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除包'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: getOtaPackageList,
    beforeFetch: wrapFetchParams,
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
      title: `确定删除OTA升级[${record.title}]吗？`,
      content: '请注意：确认后，OTA升级将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteOtaPackage(record.id.id);
          showMessage('删除成功！');
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

  async function handleDownload(record: Recordable) {
    if (record.dataSize) {
      const res = await downloadOtaPackage(record.id.id);
      let name = res.headers['content-disposition'];
      name = name && name.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      name = name && name.length >= 1 && name[1].replace("utf-8'zh_cn'", '');
      downloadByData(res.data, name);
    }
  }
</script>
<style lang="less">
  .ota-list {
  }
</style>
