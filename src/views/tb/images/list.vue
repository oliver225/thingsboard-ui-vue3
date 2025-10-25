<template>
  <div>
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleUpload({})">
            <Icon icon="ant-design:upload-outlined" /> {{ t('tb.images.action.uploadImage') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
            allow-clear
            @change="reload()"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
          <template v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Checkbox v-model:checked="searchParam.includeSystemImages" @change="reload()">
              {{ t('tb.images.select.includeSystemImages') }}
            </Checkbox>
          </template>
        </div>
      </template>
      <template #firstColumn="{ record }">
        <Space>
          <div class="cursor-pointer h-10 w-10 overflow-hidden mr-6" @click="handleDetail(record)">
            <img class="img-content-clip" :src="record.publicLink" :alt="record.name" />
          </div>
          <span>
            {{ record.title }}
          </span>
        </Space>
      </template>
      <template #resolution="{ record }"> {{ record.descriptor.width }}×{{ record.descriptor.height }} </template>
      <template #descriptorSize="{ record }">
        <div v-if="record.descriptor.size">
          {{ convertBytesToSize(record.descriptor.size) }}
        </div>
        <div v-else> - </div>
      </template>
      <template #isSystem="{ record }">
        <Checkbox :checked="record.link.indexOf('system') > -1" />
      </template>
      <template #itemContainer="{ record }">
        <div class="w-52 h-68 p-2 bg-slate-100">
          <div class="cursor-pointer h-50 w-full content-center">
            <img
              :src="record.publicLink"
              :alt="record.name"
              class="cursor-pointer w-full"
              @click="handleDetail(record)"
            />
          </div>
          <div class="px-1">
            <div class="h-9 font-bold text-ellipsis overflow-hidden whitespace-nowrap">
              {{ record.title }}
            </div>
            <Space :size="1">
              <template #split>
                <Divider type="vertical" />
              </template>
              <div>{{ record.descriptor?.width }}×{{ record.descriptor?.height }}</div>
              <div> {{ convertBytesToSize(record.descriptor?.size) }}</div>
            </Space>
          </div>
        </div>
      </template>
    </BasicTable>
    <EmbedImage @register="registerEmbedModal" />
    <Detail
      @register="registerDetailModal"
      @upload="handleUpload"
      @download="handleDownload"
      @embed="handleEmbedImage"
    />
    <ImageUpload @register="registerUploadModal" @success="handleSuccess()" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbImageList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { convertBytesToSize } from '/@/utils';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { imageList, deleteImage, downloadImage, imagePreview } from '/@/api/tb/images';
  import { Space, Checkbox, Divider } from 'ant-design-vue';
  import EmbedImage from './embedImage.vue';
  import Detail from './detail.vue';
  import ImageUpload from './upload.vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import { downloadByData } from '/@/utils/file/download';

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.images.title'),
  };

  const searchParam = reactive({
    textSearch: '',
    includeSystemImages: false,
  });

  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.images.table.name'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.images.table.createdTime'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
    {
      title: t('tb.images.table.resolution'),
      dataIndex: 'descriptor.height',
      key: 'descriptor.height',
      align: 'center',
      width: 100,
      slot: 'resolution',
    },
    {
      title: t('tb.images.table.size'),
      dataIndex: 'descriptor.size',
      key: 'descriptor.size',
      sorter: true,
      width: 100,
      align: 'right',
      slot: 'descriptorSize',
    },
    {
      title: t('tb.images.table.system'),
      dataIndex: 'link',
      key: 'link',
      ifShow: hasPermission(Authority.TENANT_ADMIN),
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 180,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:download-outlined',
        title: t('tb.images.action.downloadImage'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:code-outlined',
        title: t('tb.images.action.embedImage'),
        onClick: handleEmbedImage.bind(this, { ...record }),
      },
      {
        icon: 'i-clarity:note-edit-line',
        color: 'success',
        title: t('tb.images.action.editImage'),
        onClick: handleDetail.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        ifShow: !!!(hasPermission(Authority.TENANT_ADMIN) && record.link.indexOf('system') > -1),
        title: t('tb.images.action.deleteImage'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerEmbedModal, { openModal: openEmbedModal }] = useModal();
  const [registerDetailModal, { openModal: openDetailModal }] = useModal();
  const [registerUploadModal, { openModal: openUploadModal }] = useModal();

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (param) => imageList(param, searchParam.includeSystemImages),
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    // afterFetch: handlePreviewImage,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    return {
      ...param,
      imageSubType: 'IMAGE',
      textSearch: searchParam.textSearch,
    };
  }

  async function handlePreviewImage(data: any[]) {
    for (let i = 0; i < data.length; i++) {
      await fetchPreviewImage(data[i]).then((base64) => (data[i].preview = base64));
    }
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.images.action.deleteConfirm', { title: record.title }),
      content: t('tb.images.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.images.action.deleteButton'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteImage(record.link);
          showMessage(t('tb.images.action.deleteSuccess'));
          handleSuccess();
        } catch (error: any) {
          if (error.success == false) {
            forceDelete(record, error);
          }
          console.log(error);
        }
      },
    });
  }
  async function forceDelete(record: Recordable, errorMsg: any) {
    const showEntities: any[] = [];
    const types = Object.keys(errorMsg.references);
    types.forEach((type) => {
      const entities = errorMsg.references[type];
      entities.forEach((entity) => {
        showEntities.push({ type: type, name: entity.name });
      });
    });
    createConfirm({
      iconType: 'error',
      title: t('tb.images.action.forceDeleteConfirmTitle'),
      content: t('tb.images.action.forceDeleteConfirmContent'),
      centered: false,
      okText: t('tb.images.action.forceDeleteButton'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteImage(record.link, true);
          showMessage(t('tb.images.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  async function fetchPreviewImage(record: Recordable) {
    return new Promise((resolve) => {
      imagePreview(record.link).then((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          resolve(e.target?.result);
        };
        fileReader.readAsDataURL(file);
      });
    });
  }

  async function handleDownload(record: Recordable) {
    const res = await downloadImage(record.link);
    let name = res.headers['content-disposition'];
    name = name && name.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    name = name && name.length >= 1 && name[1].replace("utf-8'zh_cn'", '');
    downloadByData(res.data, name);
  }

  function handleSuccess() {
    reload();
  }

  function handleEmbedImage(record: Recordable) {
    openEmbedModal(true, record);
  }

  function handleDetail(record: Recordable) {
    openDetailModal(true, record);
  }

  function handleUpload(record: Recordable) {
    openUploadModal(true, record);
  }
</script>
