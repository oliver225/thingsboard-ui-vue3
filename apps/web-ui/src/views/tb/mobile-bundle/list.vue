<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { MobileAppBundleInfo } from '#/api/tb/mobile-app';

import { computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteMobileAppBundle,
  getMobileAppBundleInfos,
} from '#/api/tb/mobile-app';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import MobileBundleConfiguration from './configuration.vue';
import MobileBundleForm from './form.vue';

defineOptions({ name: 'MobileBundleList' });

const route = useRoute();

const router = useRouter();

// 页面状态与表单弹窗。
const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: MobileBundleForm,
  destroyOnClose: true,
});

const [ConfigurationModal, configurationModalApi] = useVbenModal({
  connectedComponent: MobileBundleConfiguration,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<MobileAppBundleInfo>[]>(() => [
  {
    title: $t('mobile-center.features.bundle.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 220,
    fixed: 'left',
    sorter: true,
    slot: 'mobileBundleTitle',
  },
  {
    title: $t('mobile-center.features.bundle.fields.clients'),
    dataIndex: 'oauth2ClientInfos',
    key: 'oauth2ClientInfos',
    width: 240,
    slot: 'oauth2ClientInfos',
  },
  {
    title: $t('mobile-center.features.bundle.fields.android'),
    dataIndex: 'androidPkgName',
    key: 'androidPkgName',
    width: 200,
    slot: 'androidPkgName',
  },
  {
    title: $t('mobile-center.features.bundle.fields.ios'),
    dataIndex: 'iosPkgName',
    key: 'iosPkgName',
    width: 200,
    slot: 'iosPkgName',
  },
  {
    title: $t('mobile-center.features.bundle.fields.oauth2Enabled'),
    dataIndex: 'oauth2Enabled',
    key: 'oauth2Enabled',
    width: 140,
    slot: 'oauth2Enabled',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<MobileAppBundleInfo> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('mobile-center.features.bundle.actions.edit'),
        tooltip: $t('mobile-center.features.bundle.actions.edit'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleEdit(record),
      },
      {
        key: 'configure',
        icon: 'lucide:code',
        text: $t('mobile-center.features.bundle.actions.configure'),
        tooltip: $t('mobile-center.features.bundle.actions.configure'),
        onClick: () => handleConfigure(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('mobile-center.features.bundle.actions.delete'),
        tooltip:
          record.androidAppId || record.iosAppId
            ? $t('mobile-center.features.bundle.delete.disabled')
            : $t('mobile-center.features.bundle.actions.delete'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        disabled: !!(record.androidAppId || record.iosAppId),
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<MobileAppBundleInfo>({
  api: getMobileAppBundleInfos,
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

function handleEdit(record: MobileAppBundleInfo) {
  const mobileAppBundleId = record.id?.id;
  if (!mobileAppBundleId) return;

  formModalApi.setData({ mobileAppBundleId }).open();
}

function handleNavigateList(value: string | undefined) {
  if (value && value !== route.name) return router.push({ name: value });
}

async function handleDelete(record: MobileAppBundleInfo) {
  const mobileAppBundleId = record.id?.id;
  if (!mobileAppBundleId || record.androidAppId || record.iosAppId) return;

  await confirm({
    title: $t('mobile-center.features.bundle.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('mobile-center.sections.bundles'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteMobileAppBundle(mobileAppBundleId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleConfigure(record: MobileAppBundleInfo) {
  const mobileAppBundleId = record.id?.id;
  if (!mobileAppBundleId) return;

  configurationModalApi.setData({ mobileAppBundleId }).open();
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <ConfigurationModal />
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
          {{ $t('mobile-center.features.bundle.actions.create') }}
        </Button>
      </template>
      <template #mobileBundleTitle="{ record }">
        <Button
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          type="link"
          class="h-auto p-0"
          @click="handleEdit(record)"
        >
          {{ record.title }}
        </Button>
      </template>
      <template #oauth2ClientInfos="{ record }">
        <div
          v-if="record.oauth2ClientInfos?.length"
          class="flex flex-wrap justify-center gap-1"
        >
          <Tag v-for="client in record.oauth2ClientInfos" :key="client.id?.id">
            {{ client.title }}
          </Tag>
        </div>
        <span v-else>—</span>
      </template>
      <template #androidPkgName="{ record }">
        <Tag v-if="record.androidPkgName" color="green">
          {{ record.androidPkgName }}
        </Tag>
        <span v-else>—</span>
      </template>
      <template #iosPkgName="{ record }">
        <Tag v-if="record.iosPkgName" color="blue">{{ record.iosPkgName }}</Tag>
        <span v-else>—</span>
      </template>
      <template #oauth2Enabled="{ record }">
        <TbCheckbox
          :checked="!!record.oauth2Enabled"
          disabled
          :aria-label="$t('mobile-center.features.bundle.fields.oauth2Enabled')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
