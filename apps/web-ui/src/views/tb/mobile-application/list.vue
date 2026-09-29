<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { MobileApp } from '#/api/tb/mobile-app';

import { computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Select, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteMobileApp,
  getMobileApp,
  getMobileApps,
  saveMobileApp,
} from '#/api/tb/mobile-app';
import { CopyText } from '#/components/widget';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import MobileApplicationForm from './form.vue';

defineOptions({ name: 'MobileApplicationList' });

const route = useRoute();

const router = useRouter();

// 页面状态与表单弹窗。
const searchInfo = reactive({
  searchText: '',
  platformType: undefined as MobileApp['platformType'] | undefined,
});

const statusColors = {
  DRAFT: 'blue',
  PUBLISHED: 'green',
  DEPRECATED: 'orange',
  SUSPENDED: 'red',
};

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: MobileApplicationForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<MobileApp>[]>(() => [
  {
    title: $t('mobile-center.features.application.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 180,
    fixed: 'left',
    sorter: true,
    slot: 'mobileAppTitle',
  },
  {
    title: $t('mobile-center.features.application.fields.pkgName'),
    dataIndex: 'pkgName',
    key: 'pkgName',
    width: 240,
    sorter: true,
    slot: 'pkgName',
  },
  {
    title: $t('mobile-center.features.application.fields.secret'),
    dataIndex: 'appSecret',
    key: 'appSecret',
    width: 150,
    slot: 'appSecret',
  },
  {
    title: $t('mobile-center.features.application.fields.platform'),
    dataIndex: 'platformType',
    key: 'platformType',
    width: 110,
    sorter: true,
    slot: 'platformType',
  },
  {
    title: $t('mobile-center.features.application.fields.status'),
    dataIndex: 'status',
    key: 'status',
    width: 120,
    sorter: true,
    slot: 'status',
  },
  {
    key: 'minVersion',
    title: $t('mobile-center.features.application.fields.minVersion'),
    width: 140,
    customRender: ({ record }) => record.versionInfo?.minVersion || '—',
  },
  {
    key: 'latestVersion',
    title: $t('mobile-center.features.application.fields.latestVersion'),
    width: 140,
    customRender: ({ record }) => record.versionInfo?.latestVersion || '—',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) =>
      value === null || value === undefined || value === ''
        ? '—'
        : formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<MobileApp> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('mobile-center.features.application.actions.edit'),
        tooltip: $t('mobile-center.features.application.actions.edit'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleEdit(record),
      },
      {
        key: 'suspend',
        icon: 'lucide:pause',
        text: $t('mobile-center.features.application.actions.suspend'),
        tooltip: $t('mobile-center.features.application.actions.suspend'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        ifShow: record.status === 'PUBLISHED',
        onClick: () => handleSuspend(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('mobile-center.features.application.actions.delete'),
        tooltip: $t('mobile-center.features.application.actions.delete'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<MobileApp>({
  api: getMobileApps,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  tableSetting: { redo: true, setting: true, size: true },
  defaultRowSelection: null,
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: MobileApp) {
  const mobileAppId = record.id?.id;
  if (!mobileAppId) return;

  formModalApi.setData({ mobileAppId }).open();
}

function handleNavigateList(value: string | undefined) {
  if (value && value !== route.name) return router.push({ name: value });
}

async function handleDelete(record: MobileApp) {
  const mobileAppId = record.id?.id;
  if (!mobileAppId) return;

  await confirm({
    title: $t('mobile-center.features.application.actions.delete'),
    content:
      record.status === 'PUBLISHED'
        ? $t('mobile-center.features.application.delete.publishedTitle', {
            title: record.title || record.pkgName,
          })
        : $t('tb.common.messages.delete.title', {
            entity: $t('mobile-center.sections.applications'),
            name: record.title || record.pkgName,
          }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteMobileApp(mobileAppId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleSuspend(record: MobileApp) {
  const mobileAppId = record.id?.id;
  if (!mobileAppId) return;

  await confirm({
    title: $t('mobile-center.features.application.actions.suspend'),
    content: $t('mobile-center.features.application.suspend.title', {
      title: record.title || record.pkgName,
    }),
    confirmText: $t('tb.common.confirm'),
  });
  const mobileApp = await getMobileApp(mobileAppId);
  await saveMobileApp({ ...mobileApp, status: 'SUSPENDED' });
  message.success($t('tb.common.saveSuccess'));
  await reload();
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable class="h-full" @register="registerTable">
      <template #tableTitle>
        <VbenSegmented
          variant="navigation"
          :tabs="[
            {
              icon: $router.resolve({ name: 'MobileBundles' }).meta.icon,
              label: $t('mobile-center.sections.bundles'),
              value: 'MobileBundles',
            },
            {
              icon: $router.resolve({ name: 'MobileApplications' }).meta.icon,
              label: $t('mobile-center.sections.applications'),
              value: 'MobileApplications',
            },
          ]"
          :model-value="String(route.name)"
          @update:model-value="handleNavigateList"
        />
      </template>
      <template #query>
        <Select
          class="w-full sm:w-48 sm:max-w-full"
          v-model:value="searchInfo.platformType"
          allow-clear
          :placeholder="
            $t('mobile-center.features.application.search.allPlatforms')
          "
          :aria-label="$t('mobile-center.features.application.fields.platform')"
          :options="[
            { label: 'Android', value: 'ANDROID' },
            { label: 'iOS', value: 'IOS' },
          ]"
          @change="handleSearch"
        />
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
      </template>
      <template #toolbar>
        <Button
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('mobile-center.features.application.actions.create') }}
        </Button>
      </template>
      <template #pkgName="{ record }">
        <CopyText :text="record.pkgName" />
      </template>
      <template #mobileAppTitle="{ record }">
        <Button
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          type="link"
          class="h-auto p-0"
          @click="handleEdit(record)"
        >
          {{ record.title || '—' }}
        </Button>
      </template>
      <template #appSecret="{ record }">
        <CopyText
          v-if="record.appSecret"
          :text="record.appSecret"
          display-text="••••••••"
        />
        <span v-else>—</span>
      </template>
      <template #platformType="{ record }">
        <Tag :color="record.platformType === 'ANDROID' ? 'green' : 'blue'">
          {{ record.platformType === 'ANDROID' ? 'Android' : 'iOS' }}
        </Tag>
      </template>
      <template #status="{ record }">
        <Tag :color="statusColors[record.status as MobileApp['status']]">
          {{ $t(`mobile-center.options.status.${record.status}`) }}
        </Tag>
      </template>
    </BasicTable>
  </Page>
</template>
