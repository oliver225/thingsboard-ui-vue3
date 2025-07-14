<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ResourceApi } from '#/api';

import { reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { Authority } from '@vben/constants';
import { $t } from '@vben/locales';
import {
  blobToBase64,
  convertBytesToSize,
  downloadFileFromBlob,
} from '@vben/utils';

import { Checkbox, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteImageApi,
  downloadImageApi,
  imageListApi,
  imagePreviewApi,
} from '#/api';
import { ToolBar, TopAction } from '#/components/Table';

import Embed from './embed.vue';
import Form from './form.vue';
import Upload from './upload.vue';

defineOptions({
  name: 'ImageList',
});
const { hasAccessByCodes } = useAccess();

const previewCache = new Map<string, string>();

const searchParam = reactive({
  textSearch: '',
  includeSystemImages: false,
});

watch(
  [() => searchParam.textSearch, () => searchParam.includeSystemImages],
  () => {
    gridApi?.query();
  },
);

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: Upload,
});
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
});
const [EmbedModal, embedModalApi] = useVbenModal({
  connectedComponent: Embed,
});
async function reload() {
  searchParam.textSearch = '';
  await gridApi?.reload();
}

async function fetch({ page, sort }: any) {
  const res = await imageListApi(
    {
      page: page.currentPage - 1,
      pageSize: page.pageSize,
      sortProperty: sort.field,
      sortOrder: sort.order,
      ...searchParam,
    },
    'IMAGE',
    searchParam.includeSystemImages,
  );
  const data = await afterFetch(res.data);
  return {
    ...res,
    data,
  };
}

/**
 * 处理图片数据，生成 base64 预览
 * @param {Array} dataList
 * @returns {Promise<Array>}
 */
async function afterFetch(dataList: any[]) {
  return Promise.all(
    dataList.map(async (item) => {
      const imageType = item.link.includes('system') ? 'system' : 'tenant';
      const key = `${imageType}_${item.resourceKey}_${item.etag}`;
      let preview = previewCache.get(key);
      if (!preview) {
        const { data, headers } = await imagePreviewApi(
          imageType,
          item.resourceKey,
          item.etag,
        );
        const blob = new Blob([data], { type: headers['content-type'] });
        preview = await blobToBase64(blob);
        if (preview) previewCache.set(key, preview);
      }
      return { ...item, imageType, preview };
    }),
  );
}

async function handleSuccess() {
  await reload();
}

function handleForm({ row }: any) {
  formModalApi
    .setState({
      title: `${$t('编辑图像')}`,
    })
    .setData({ imageType: row.imageType, resourceKey: row.resourceKey })
    .open();
}

function handleUpload() {
  uploadModalApi
    .setState({
      title: `${$t('上传图像')}`,
    })
    .open();
}

function handleDelete({ row }: any) {
  confirm({
    title: `${$t('删除图像')}[${row.title}]`,
    content: `${$t('确认后图像将无法恢！')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose: async ({ isConfirm }) => {
      if (isConfirm) {
        await deleteImageApi(row.imageType, row.resourceKey);
        return true;
      }
      return true;
    },
  }).then(async () => {
    message.success(`删除图像[${row.title}]成功！`);
    await reload();
  });
}

function handleEmbed({ row }: any) {
  embedModalApi.setData({ ...row }).open();
}

async function handleDownload({ row }: any) {
  const result = await downloadImageApi(
    row.imageType,
    row.resourceKey,
    row.etag,
  );

  downloadFileFromBlob({ fileName: row.resourceKey, source: result });
}

const tableAction = {
  actions: [
    {
      label: `${$t('下载图像')}`,
      tooltip: `${$t('下载图像')}`,
      icon: 'mdi:download',
      onClick: handleDownload,
    },
    {
      label: `${$t('嵌入图像')}`,
      tooltip: `${$t('嵌入图像')}`,
      icon: 'ant-design:code-outlined',
      onClick: handleEmbed,
    },
    {
      label: `${$t('编辑图像')}`,
      tooltip: `${$t('编辑图像')}`,
      icon: 'ant-design:edit-outlined',
      onClick: handleForm,
    },
    {
      label: `${$t('page.remove.title')}`,
      tooltip: `${$t('page.remove.title')}`,
      icon: 'ant-design:delete-outlined',
      danger: true,
      disabled: ({ row }: any) =>
        row.imageType === 'system' && hasAccessByCodes(Authority.TENANT_ADMIN),
      onClick: handleDelete,
    },
  ],
};

const gridOptions: VxeGridProps<ResourceApi.ResourceInfo> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'title',
      title: $t('名称'),
      sortable: true,
      slots: { default: 'title-image' },
    },
    {
      field: 'descriptor.height',
      title: $t('分辨率'),
      slots: { default: 'resolution' },
      width: 160,
    },
    {
      field: 'descriptor.size',
      title: $t('文件大小'),
      slots: { default: 'descriptorSize' },
      align: 'right',
      width: 160,
    },
    {
      field: 'imageType',
      title: $t('系统'),
      visible: hasAccessByCodes(Authority.TENANT_ADMIN),
      cellRender: {
        name: 'CellCheckbox',
        props: {
          convert: (value: any) => value === 'system',
        },
      },

      align: 'center',
      width: 100,
    },
    {
      field: 'createdTime',
      sortable: true,
      width: 160,
      formatter: 'formatDateTime',
      title: $t('tenant.form.createdTime'),
    },
    {
      title: $t('page.action.title'),
      field: 'action',
      align: 'center',
      fixed: 'right',
      cellRender: {
        name: 'CellActions',
        props: tableAction,
      },
      width: 200,
    },
  ],
  cellConfig: {
    height: 65,
  },
  pagerConfig: {
    pageSize: 10,
  },
  proxyConfig: {
    ajax: {
      query: fetch,
    },
    sort: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :top-title="$t('图像库')" top-title-help="这是一个图像库列表">
      <template #toolbar-tools>
        <ToolBar :api="gridApi" />
      </template>
      <template #toolbar-actions>
        <TopAction
          :btn-title="$t('上传图像')"
          btn-icon="mdi:upload"
          v-model:search-text="searchParam.textSearch"
          @btn-click="handleUpload()"
        />
        <Checkbox
          v-access:code="[Authority.TENANT_ADMIN]"
          v-model:checked="searchParam.includeSystemImages"
        >
          包含系统图像
        </Checkbox>
      </template>

      <template #title-image="{ row }">
        <div class="flex items-center space-x-4">
          <div class="h-12 w-12">
            <img class="img-content-clip" :src="row.preview" />
          </div>
          <span>{{ row.title }}</span>
        </div>
      </template>
      <template #resolution="{ row }">
        <span> {{ row.descriptor?.width }}</span>
        <span class="mx-1">×</span>
        <span> {{ row.descriptor?.height }}</span>
      </template>
      <template #descriptorSize="{ row }">
        <span> {{ convertBytesToSize(row.descriptor?.size) }}</span>
      </template>
    </Grid>
    <UploadModal @success="handleSuccess" />
    <FormModal @success="handleSuccess" />
    <EmbedModal />
  </Page>
</template>
