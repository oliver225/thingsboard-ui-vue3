<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ResourceApi } from '#/api';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { convertBytesToSize, downloadByData } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Image, Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteImageApi,
  downloadImageApi,
  imageListApi,
  imagePreviewApi,
} from '#/api';

import Embed from './embed.vue';
import Upload from './upload.vue';

defineOptions({
  name: 'ImageList',
});

const previewCache = new Map<string, string>();

const searchParam = reactive({
  textSearch: '',
  includeSystemImages: false,
});

watch(
  () => searchParam.textSearch,
  () => {
    gridApi?.query();
  },
);

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: Upload,
});
const [EmbedModal, embedModalApi] = useVbenModal({
  connectedComponent: Embed,
});
async function reload() {
  searchParam.textSearch = '';
  await gridApi?.query();
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
 * @param {Array} data
 * @returns {Promise<Array>}
 */
async function afterFetch(data: any[]) {
  return Promise.all(
    data.map(async (item) => {
      const imageType = item.link.includes('system') ? 'system' : 'tenant';
      const key = `${imageType}_${item.resourceKey}_${item.etag}`;
      let preview = previewCache.get(key);
      if (!preview) {
        preview = (await fetchPreview({ ...item, imageType })) || undefined;
        if (preview) previewCache.set(key, preview);
      }
      return { ...item, imageType, preview: preview || undefined };
    }),
  );
}

/**
 * 获取图片 base64 预览
 * @param {object} record
 * @returns {Promise<string|null>}
 */
async function fetchPreview(record: Recordable<any>): Promise<null | string> {
  try {
    const { data, headers } = await imagePreviewApi(
      record.imageType,
      record.resourceKey,
      record.etag,
    );
    const blob = new Blob([data], { type: headers['content-type'] });
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('loadend', () =>
        resolve(reader.result as string),
      );
      reader.addEventListener('error', () => reject(new Error('读取文件失败')));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('预览图片失败:', error);
    return null;
  }
}

async function handleSuccess() {
  await reload();
}

function handleForm({ _column, _$table, row }: any) {
  uploadModalApi
    .setState({
      title: row?.id?.id ? `${$t('编辑图像')}` : `${$t('上传图像')}`,
    })
    .setData({ id: row?.id?.id })
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
  embedModalApi.setData({ data: row }).open();
}

async function handleDownload({ row }: any) {
  const result = await downloadImageApi(
    row.imageType,
    row.resourceKey,
    row.etag,
  );

  await downloadByData(result, row.resourceKey);
}

const tableAction = {
  actions: [
    {
      label: `${$t('下载')}`,
      tooltip: `${$t('下载')}`,
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
      label: `${$t('page.remove.title')}`,
      tooltip: `${$t('page.remove.title')}`,
      icon: 'ant-design:delete-outlined',
      danger: true,
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
      width: 180,
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
    <Grid>
      <template #table-top>
        <p class="text-lg font-semibold">{{ $t('图像库') }}</p>
        <p class="text-muted-foreground">这是一个图像库列表</p>
      </template>
      <template #toolbar-actions>
        <div class="flex items-center justify-start space-x-2">
          <Button
            @click="() => handleForm({})"
            type="primary"
            class="flex items-center"
          >
            <IconifyIcon class="size-4" icon="mdi:upload" />
            <span class="font-semibold">
              {{ $t('上传图像') }}
            </span>
          </Button>
          <Input
            class="w-80"
            v-model:value="searchParam.textSearch"
            :placeholder="$t('page.search.placeholder')"
          >
            <template #suffix>
              <IconifyIcon class="size-4" icon="mdi:magnify" />
            </template>
          </Input>
        </div>
      </template>
      <template #title-image="{ row }">
        <div class="juestify-start cursour-pointer flex items-center space-x-4">
          <Image :src="row.preview" :preview="false" :height="60" :width="60" />
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
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <VbenIconButton
            v-tippy="{
              content: `${$t('page.refresh.title')}`,
              theme: 'dark',
              delay: 100,
              animation: 'shift-away',
            }"
          >
            <IconifyIcon class="size-6" icon="mdi:refresh" @click="reload" />
          </VbenIconButton>
        </div>
      </template>
    </Grid>
    <UploadModal @success="handleSuccess" />
    <EmbedModal />
  </Page>
</template>
