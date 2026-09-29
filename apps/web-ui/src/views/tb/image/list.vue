<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Checkbox, Input, message } from 'antdv-next';

import ImagePreview from '#/adapter/component/image-preview.vue';
import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteImageById,
  deleteImages,
  downloadImage,
  getImages,
} from '#/api/tb/image';
import { SYS_TENANT_ID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { formatBytes } from '#/utils/file';

import EmbedImageModal from './embed-modal.vue';
import ImageForm from './form.vue';

defineOptions({ name: 'ImageList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
  includeSystemImages: false,
  imageSubType: 'IMAGE' as const,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ImageForm,
  destroyOnClose: true,
});

const [EmbedModal, embedModalApi] = useVbenModal({
  connectedComponent: EmbedImageModal,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<TbResourceInfo>[]>(() => [
  {
    title: $t('images.fields.name'),
    dataIndex: 'title',
    key: 'title',
    width: 240,
    sorter: true,
    slot: 'name',
  },
  {
    align: 'center',
    key: 'resolution',
    slot: 'resolution',
    title: $t('images.fields.resolution'),
    width: 120,
  },
  {
    align: 'right',
    key: 'size',
    customRender: ({ record }) => formatBytes(record.descriptor?.size),
    title: $t('images.fields.size'),
    width: 110,
  },
  {
    key: 'scope',
    customRender: ({ record }) =>
      isSystem(record)
        ? $t('images.options.scope.system')
        : $t('images.options.scope.tenant'),
    title: $t('images.fields.scope'),
    width: 100,
  },
  {
    title: $t('images.fields.public'),
    dataIndex: 'public',
    key: 'public',
    width: 90,
    align: 'center',
    slot: 'public',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<TbResourceInfo> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'download',
        icon: 'lucide:download',
        text: $t('images.actions.download'),
        tooltip: $t('images.actions.download'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleDownload(record),
      },
      {
        key: 'embed',
        icon: 'lucide:code',
        text: $t('images.actions.embed'),
        tooltip: $t('images.actions.embed'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleEmbed(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('images.actions.edit'),
        tooltip: $t('images.actions.edit'),
        auth: isSystem(record) ? Authority.SYS_ADMIN : Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('images.actions.delete'),
        tooltip: $t('images.actions.delete'),
        auth: isSystem(record) ? Authority.SYS_ADMIN : Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<TbResourceInfo>({
  api: getImages,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('images.menu'),
    enabled: () =>
      hasAccessByRoles([Authority.SYS_ADMIN, Authority.TENANT_ADMIN]),
    canSelect: (record) =>
      !!(
        !!record.id?.id &&
        ((hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(record)) ||
          (hasAccessByRoles([Authority.TENANT_ADMIN]) && !isSystem(record)))
      ),
    deleteApi: deleteImages,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleEdit(record: TbResourceInfo) {
  if (!record.id?.id) return;
  formModalApi
    .setData({ resourceKey: record.resourceKey, scope: getImageScope(record) })
    .open();
}

/**
 * 执行删除。返回 true 表示允许关闭确认框(成功 / 已转入强制删除),
 * 返回 false 表示保持确认框打开(意外错误)。
 */
async function handleDelete(record: TbResourceInfo) {
  const imageId = record.id?.id;
  if (!imageId) return;

  await confirm({
    title: $t('images.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('images.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteImageById(imageId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleUpload() {
  formModalApi.setData({}).open();
}

function handleEmbed(record: TbResourceInfo) {
  embedModalApi
    .setData({ resourceKey: record.resourceKey, scope: getImageScope(record) })
    .open();
}

/** 下载原图文件 */
async function handleDownload(record: TbResourceInfo) {
  if (!record.resourceKey) {
    return;
  }
  const blob = await downloadImage(getImageScope(record), record.resourceKey);
  downloadFileFromBlob({
    fileName: record.fileName ?? record.title ?? 'image',
    source: blob,
  });
}

function handleSaved() {
  return reload();
}

/** 由实体推断作用域(系统级 / 租户级);导出场景 tenantId 可能为空,按系统处理 */
function getImageScope(info: TbResourceInfo): ResourceScope {
  return !info.tenantId?.id || info.tenantId.id === SYS_TENANT_ID
    ? 'system'
    : 'tenant';
}

/** 系统级图片(NULL_UUID 租户)对租户管理员只读 */
function isSystem(record: TbResourceInfo) {
  return getImageScope(record) === 'system';
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <EmbedModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.images')"
    >
      <template #query>
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-80 sm:max-w-full"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('tb.common.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </template>
        </Input>
        <Checkbox
          class="shrink-0 whitespace-nowrap"
          v-access:role="[Authority.TENANT_ADMIN]"
          v-model:checked="searchInfo.includeSystemImages"
          @change="handleSearch"
        >
          {{ $t('images.features.filter.includeSystemImages') }}
        </Checkbox>
      </template>
      <template #toolbar>
        <Button
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleUpload"
        >
          <template #icon>
            <IconifyIcon
              icon="lucide:image-up"
              class="size-4"
              aria-hidden="true"
            />
          </template>
          {{ $t('images.actions.upload') }}
        </Button>
      </template>
      <template #name="{ record }">
        <div class="flex items-center gap-3">
          <ImagePreview
            class="h-20 w-20 shrink-0 cursor-pointer rounded"
            :refresh-key="
              record.descriptor?.previewDescriptor?.etag ??
              record.descriptor?.etag
            "
            :resource-key="record.resourceKey"
            :scope="getImageScope(record)"
            @click="handleEmbed(record)"
          />
          <span class="truncate">{{ record.title }}</span>
        </div>
      </template>
      <template #resolution="{ record }">
        <span v-if="record.descriptor?.width">
          {{ record.descriptor?.width }}×{{ record.descriptor?.height }}
        </span>
        <span v-else>—</span>
      </template>
      <template #public="{ record }">
        <TbCheckbox
          :checked="!!record.public"
          disabled
          :aria-label="$t('images.fields.public')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
