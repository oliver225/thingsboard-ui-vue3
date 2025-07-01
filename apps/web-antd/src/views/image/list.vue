<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ResourceApi } from '#/api';

import { reactive, watch } from 'vue';

import { confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { convertBytesToSize } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteImageApi, imageListApi, imagePreviewApi } from '#/api';

/**
 * 图片列表页面
 * @fileoverview 展示图片资源，支持 base64 预览，优化代码结构和可读性
 */

defineOptions({
  name: 'ImageList',
});

/**
 * 搜索参数
 * @type {object}
 */
const searchParam = reactive({
  textSearch: '',
  includeSystemImages: false,
});

/**
 * 图片预览缓存，避免重复请求
 * @type {Map<string, string>}
 */
const previewCache = new Map<string, string>();

watch(
  () => searchParam.textSearch,
  () => {
    gridApi?.query();
  },
);

/**
 * 刷新表格
 */
async function reload() {
  searchParam.textSearch = '';
  await gridApi?.query();
}

/**
 * 获取图片列表数据
 * @param {object} param0
 * @returns {Promise<object>}
 */
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

/**
 * 删除图片
 * @param {object} param0
 */
function handleDelete({ row }: any) {
  confirm({
    title: `${$t('tenant.button.removeTenant')}[${row.title}]`,
    content: `${$t('tenant.removeContent')}`,
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
    message.success(`删除租户[${row.title}]成功！`);
    await reload();
  });
}

const tableAction = {
  actions: [
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
    { field: 'preview', title: '图片', cellRender: { name: 'CellImage' } },
    { field: 'title', sortable: true, title: $t('名称') },
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
      width: 120,
    },
  ],
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
        <p class="text-lg font-semibold">{{ $t('tenant.title') }}</p>
        <p class="text-muted-foreground">
          这是一个基础的租户列表，包含了租户的基本信息。
        </p>
      </template>
      <template #toolbar-actions>
        <div class="flex w-full items-center justify-between">
          <Button type="primary" class="flex items-center">
            <IconifyIcon class="size-4" icon="mdi:plus" />
            <span class="ml-1 font-semibold">
              {{ $t('tenant.button.addTenant') }}
            </span>
          </Button>
          <Input
            class="w-80"
            v-model:value="searchParam.textSearch"
            :placeholder="$t('page.search.placeholder')"
            allow-clear
          >
            <template #suffix>
              <IconifyIcon class="size-4" icon="mdi:magnify" />
            </template>
          </Input>
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
  </Page>
</template>
