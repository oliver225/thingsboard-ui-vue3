<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbResourceDeleteResult, TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { reactive } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Checkbox, Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteImage, downloadImage, getImages } from '#/api/tb/image';
import { DEFAULT_SORT_FIELD, SYS_TENANT_ID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { formatBytes } from '#/utils/file';
import { renderResourceReferences } from '#/utils/resource-references';

import ImageThumbnail from './components/image-thumbnail.vue';
import EmbedImageModal from './embed-modal.vue';
import ImageForm from './form.vue';

defineOptions({ name: 'ImageList' });

const { hasAccessByRoles } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ImageForm,
  destroyOnClose: true,
});

const [EmbedModal, embedModalApi] = useVbenModal({
  connectedComponent: EmbedImageModal,
  destroyOnClose: true,
});

const queryParams = reactive({
  includeSystemImages: false,
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getImages({
    imageSubType: 'IMAGE',
    includeSystemImages: queryParams.includeSystemImages,
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

/** 由实体推断作用域(系统级 / 租户级);导出场景 tenantId 可能为空,按系统处理 */
function getImageScope(info: TbResourceInfo): ResourceScope {
  return !info.tenantId?.id || info.tenantId.id === SYS_TENANT_ID
    ? 'system'
    : 'tenant';
}

/** 系统级图片(NULL_UUID 租户)对租户管理员只读 */
function isSystem(row: TbResourceInfo) {
  return getImageScope(row) === 'system';
}

const [Grid, gridApi] = useVbenVxeGrid<TbResourceInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 240,
        slots: { default: 'name' },
        sortable: true,
        title: $t('tb.images.fields.name'),
      },
      {
        align: 'center',
        field: 'resolution',
        slots: { default: 'resolution' },
        title: $t('tb.images.fields.resolution'),
        width: 120,
      },
      {
        align: 'right',
        field: 'size',
        formatter: ({ row }) => formatBytes(row.descriptor?.size),
        title: $t('tb.images.fields.size'),
        width: 110,
      },
      {
        field: 'scope',
        formatter: ({ row }) =>
          isSystem(row)
            ? $t('tb.images.scope.system')
            : $t('tb.images.scope.tenant'),
        title: $t('tb.images.fields.scope'),
        width: 100,
      },
      {
        align: 'center',
        field: 'public',
        slots: { default: 'public' },
        title: $t('tb.images.fields.public'),
        width: 90,
      },
      {
        field: 'createdTime',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.common.createdTime'),
        width: 170,
      },
      {
        field: 'actions',
        fixed: 'right',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 180,
      },
    ],
    rowConfig: { height: 92 },
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<TbResourceInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: TbResourceInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onDownload(row),
      tooltip: $t('tb.images.actions.download'),
    },
    {
      icon: 'lucide:code',
      onClick: () => onEmbed(row),
      tooltip: $t('tb.images.actions.embed'),
    },
    {
      ifShow: hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(row),
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.images.actions.edit'),
    },
    {
      danger: true,
      ifShow: hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(row),
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onUpload() {
  formModalApi.setData({}).open();
}

function onEdit(row: TbResourceInfo) {
  formModalApi
    .setData({ resourceKey: row.resourceKey, scope: getImageScope(row) })
    .open();
}

function onEmbed(row: TbResourceInfo) {
  embedModalApi
    .setData({ resourceKey: row.resourceKey, scope: getImageScope(row) })
    .open();
}

/** 下载原图文件 */
async function onDownload(row: TbResourceInfo) {
  if (!row.resourceKey) {
    return;
  }
  const blob = await downloadImage(getImageScope(row), row.resourceKey);
  downloadFileFromBlob({
    fileName: row.fileName ?? row.title ?? 'image',
    source: blob,
  });
}

/**
 * 执行删除。返回 true 表示允许关闭确认框(成功 / 已转入强制删除),
 * 返回 false 表示保持确认框打开(意外错误)。
 */
async function deleteByRow(
  row: TbResourceInfo,
  force = false,
): Promise<boolean> {
  if (!row.resourceKey) {
    return true;
  }
  try {
    await deleteImage(getImageScope(row), row.resourceKey, force);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
    return true;
  } catch (error: any) {
    const result = (error?.response?.data ?? error) as
      | TbResourceDeleteResult
      | undefined;
    // 非强制删除且存在引用:转入强制删除确认
    if (!force && result && result.success === false) {
      showForceDelete(row, result);
      return true;
    }
    return false;
  }
}

function confirmDelete(row: TbResourceInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row, false);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.images.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.images.delete.title', { title: row.title }),
  }).catch(() => {});
}

function showForceDelete(row: TbResourceInfo, result: TbResourceDeleteResult) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row, true);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    confirmText: $t('tb.images.forceDelete.button'),
    content: renderResourceReferences(result, {
      intro: $t('tb.images.forceDelete.content', { title: row.title }),
      outro: $t('tb.images.forceDelete.footer'),
    }),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.images.forceDelete.title'),
  }).catch(() => {});
}

function onModalSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onModalSuccess" />
    <EmbedModal @success="onModalSuccess" />
    <Grid :table-title="$t('tb.menu.images')">
      <template #toolbar-actions>
        <div class="flex items-center gap-3">
          <div class="w-72">
            <Input
              v-model:value="queryParams.textSearch"
              allow-clear
              :placeholder="$t('tb.common.searchPlaceholder')"
              @change="onSearch"
            >
              <template #suffix>
                <IconifyIcon icon="lucide:search" />
              </template>
            </Input>
          </div>
          <Checkbox
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            v-model:checked="queryParams.includeSystemImages"
            @change="onSearch"
          >
            {{ $t('tb.images.filter.includeSystemImages') }}
          </Checkbox>
        </div>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Button type="primary" @click="onUpload">
            <template #icon>
              <IconifyIcon icon="lucide:upload" />
            </template>
            {{ $t('tb.images.actions.upload') }}
          </Button>
        </div>
      </template>
      <template #name="{ row }">
        <div class="flex items-center gap-3">
          <ImageThumbnail
            class="h-20 w-20 shrink-0 cursor-pointer rounded"
            :refresh-key="
              row.descriptor?.previewDescriptor?.etag ?? row.descriptor?.etag
            "
            :resource-key="row.resourceKey"
            :scope="getImageScope(row)"
            @click="onEmbed(row)"
          />
          <span class="truncate">{{ row.title }}</span>
        </div>
      </template>
      <template #resolution="{ row }">
        <span v-if="row.descriptor?.width">
          {{ row.descriptor?.width }}×{{ row.descriptor?.height }}
        </span>
        <span v-else>-</span>
      </template>
      <template #public="{ row }">
        <Tag variant="outlined" :color="row.public ? 'success' : 'default'">
          {{ row.public ? $t('tb.common.yes') : $t('tb.common.no') }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
