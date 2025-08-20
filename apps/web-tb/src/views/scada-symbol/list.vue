<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { ResourceInfo } from '#/api/core/resources-library';
import type { ActionItem } from '#/components/Table';

import { reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { downloadFileFromBlob } from '@vben/utils';

import { useBase64 } from '@vueuse/core';
import { Checkbox, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteImageApi,
  downloadImageApi,
  imageListApi,
  imagePreviewApi,
} from '#/api';
import { TableTopAction } from '#/components/Table';
import { Authority } from '#/constants';
import { convertBytesToSize } from '#/utils';

import Upload from './upload.vue';

defineOptions({
  name: 'ScadaSymbolList',
});
const { hasAccessByCodes } = useAccess();

const previewCache = new Map<string, string>();

const searchParam = reactive({
  textSearch: '',
  includeSystemImages: false,
});

const tableAction = {
  actions: (record: Recordable<any>): ActionItem[] => [
    {
      label: `${$t('下载图像')}`,
      tooltip: `${$t('下载图像')}`,
      icon: 'mdi:download',
      onClick: handleDownload.bind(this, { ...record }),
    },

    {
      label: `${$t('page.remove.title')}`,
      tooltip: `${$t('page.remove.title')}`,
      icon: 'ant-design:delete-outlined',
      color: 'destructive',
      disabled:
        record.imageType === 'system' &&
        hasAccessByCodes([Authority.TENANT_ADMIN]),
      onClick: handleDelete.bind(this, { ...record }),
    },
  ],
};

const tableColumns: VxeGridPropTypes.Columns<ResourceInfo> = [
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
    visible: hasAccessByCodes([Authority.TENANT_ADMIN]),
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
      name: 'CellAction',
      props: tableAction,
    },
    width: 180,
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: tableColumns,
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
    cellConfig: {
      height: 65,
    },
    pagerConfig: {
      pageSize: 10,
    },
  },
});

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: Upload,
});
watch(
  [() => searchParam.textSearch, () => searchParam.includeSystemImages],
  () => {
    gridApi?.query();
  },
);

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
    'SCADA_SYMBOL',
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
        preview = await useBase64(blob).execute();
        if (preview) previewCache.set(key, preview);
      }
      return { ...item, imageType, preview };
    }),
  );
}

async function handleSuccess() {
  await reload();
}

function handleUpload() {
  uploadModalApi
    .setState({
      title: `${$t('上传SCADA 符号')}`,
    })
    .open();
}

function handleDelete(record: any | ResourceInfo) {
  confirm({
    title: `${$t('删除SCADA符号')}[${record.title}]`,
    content: `${$t('确认后SCADA符号将无法恢！')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose: async ({ isConfirm }) => {
      if (isConfirm) {
        await deleteImageApi(record.imageType, record.resourceKey);
        return true;
      }
      return true;
    },
  }).then(async () => {
    message.success(`删除SCADA符号[${record.title}]成功！`);
    await reload();
  });
}

async function handleDownload(record: any | ResourceInfo) {
  const result = await downloadImageApi(
    record.imageType,
    record.resourceKey,
    record.etag,
  );

  downloadFileFromBlob({ fileName: record.resourceKey, source: result });
}
</script>

<template>
  <Page auto-content-height>
    <Grid
      :table-header-title="$t('组态库')"
      table-header-title-help="这是一个SCADA符号库列表 "
    >
      <template #toolbar-actions>
        <TableTopAction
          :btn-title="$t('上传符号')"
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
  </Page>
</template>
