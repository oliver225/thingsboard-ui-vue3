<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbUserInfo } from '#/api/core/user';
import type { EntityViewInfo } from '#/api/tb/entity-view';
import type { PageLink } from '#/types/tb';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteEntityView,
  deleteEntityViews,
  getCustomerEntityViewInfos,
  getEntityViewTypes,
  getTenantEntityViewInfos,
  makeEntityViewPublic,
  unassignEntityViewFromCustomer,
} from '#/api/tb/entity-view';
import { NULL_UUID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import AssignCustomer from './assign-customer.vue';
import EntityViewForm from './form.vue';

defineOptions({ name: 'EntityViewList' });

const { hasAccessByRoles } = useAccess();

const userStore = useUserStore();

const typeFilters = ref<{ text: string; value: string }[]>([]);

const customerId =
  (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '';

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: EntityViewForm,
  destroyOnClose: true,
});

const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: AssignCustomer,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<EntityViewInfo>[]>(() => [
  {
    title: $t('entity-view.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 180,
    sorter: true,
    customRender: ({ record, value }) =>
      h(
        RouterLink,
        {
          to: {
            name: 'EntityViewDetail',
            params: { entityViewId: record.id?.id },
          },
        },
        () => value || '—',
      ),
  },
  {
    title: $t('entity-view.fields.type'),
    dataIndex: 'type',
    key: 'type',
    width: 140,
    filters: typeFilters.value,
    filterMultiple: false,
    filterSearch: true,
  },

  {
    title: $t('entity-view.fields.customer'),
    dataIndex: 'customerTitle',
    key: 'customerTitle',
    width: 140,
    ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]),
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

const actionColumn: ActionColumn<EntityViewInfo> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    align: 'center',
    actions: [
      {
        key: 'assign',
        icon: 'lucide:user-plus',
        text: $t('entity-view.actions.assign'),
        tooltip: $t('entity-view.actions.assign'),
        auth: Authority.TENANT_ADMIN,
        ifShow: !record.customerId?.id || record.customerId.id === NULL_UUID,
        onClick: () => handleAssign(record),
      },
      {
        key: 'unassign',
        icon: 'lucide:user-minus',
        text: $t('entity-view.actions.unassign'),
        tooltip: $t('entity-view.actions.unassign'),
        auth: Authority.TENANT_ADMIN,
        ifShow:
          !!record.customerId?.id &&
          record.customerId.id !== NULL_UUID &&
          !record.customerIsPublic,
        onClick: () => handleUnassign(record),
      },
      {
        key: 'makePublic',
        icon: 'lucide:globe',
        text: $t('entity-view.actions.makePublic'),
        tooltip: $t('entity-view.actions.makePublic'),
        auth: Authority.TENANT_ADMIN,
        ifShow: !record.customerId?.id || record.customerId.id === NULL_UUID,
        onClick: () => handleMakePublic(record),
      },
      {
        key: 'makePrivate',
        icon: 'lucide:lock-keyhole',
        text: $t('entity-view.actions.makePrivate'),
        tooltip: $t('entity-view.actions.makePrivate'),
        auth: Authority.TENANT_ADMIN,
        ifShow:
          !!record.customerId?.id &&
          record.customerId.id !== NULL_UUID &&
          !!record.customerIsPublic,
        onClick: () => handleMakePrivate(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('entity-view.actions.edit'),
        tooltip: $t('entity-view.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('entity-view.actions.delete'),
        tooltip: $t('entity-view.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { selection, reload, setSelectedRowKeys }] =
  useTable<EntityViewInfo>({
    api: fetchList,
    searchInfo,
    columns: tableColumns,
    actionColumn: computed(() =>
      hasAccessByRoles([Authority.TENANT_ADMIN]) ? actionColumn : null,
    ),
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('entity-view.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id,
      deleteApi: deleteEntityViews,
      actions: [
        {
          key: 'assign',
          label: () => $t('entity-view.actions.batchAssign'),
          icon: 'lucide:user-plus',
          onClick: ({ keys }) => handleBatchAssign(keys.map(String)),
        },
      ],
    },
    tableSetting: { redo: true, setting: true, size: true },
  });

const selectedRowKeys = computed(() => selection.value.keys.map(String));

watch(() => searchInfo.searchText, handleSearch);

onMounted(loadTypeFilters);

async function fetchList({
  type,
  ...pageLink
}: PageLink & { type?: string[] }) {
  const params = { type: type?.[0] };
  return hasAccessByRoles([Authority.TENANT_ADMIN])
    ? getTenantEntityViewInfos(pageLink, params)
    : getCustomerEntityViewInfos(customerId, pageLink, params);
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({}).open();
}

function handleEdit(record: EntityViewInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({ entityViewId: record.id?.id }).open();
}

async function handleDelete(record: EntityViewInfo) {
  const entityViewId = record.id?.id;
  if (!entityViewId || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;

  await confirm({
    title: $t('entity-view.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('entity-view.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteEntityView(entityViewId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleAssign(record: EntityViewInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  assignModalApi.setData({ entityViewIds: [record.id.id] }).open();
}

function handleBatchAssign(keys: string[]) {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN]) || keys.length === 0) return;
  assignModalApi.setData({ entityViewIds: keys }).open();
}

async function handleMakePublic(record: EntityViewInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  await confirm({
    title: $t('entity-view.features.makePublic.title'),
    content: $t('entity-view.features.makePublic.content', {
      name: record.name,
    }),
  });
  await makeEntityViewPublic(record.id.id);
  message.success($t('entity-view.actions.makePublicSuccess'));
  await reload();
}

async function handleMakePrivate(record: EntityViewInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  await confirm({
    title: $t('entity-view.features.makePrivate.title'),
    content: $t('entity-view.features.makePrivate.content', {
      name: record.name,
    }),
  });
  await unassignEntityViewFromCustomer(record.id.id);
  message.success($t('entity-view.actions.makePrivateSuccess'));
  await reload();
}

async function handleUnassign(record: EntityViewInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  await confirm({
    title: $t('entity-view.features.unassign.title'),
    content: $t('entity-view.features.unassign.content', {
      name: record.name,
      customer: record.customerTitle,
    }),
  });
  await unassignEntityViewFromCustomer(record.id.id);
  message.success($t('entity-view.actions.unassignSuccess'));
  await reload();
}

async function handleSaved() {
  await Promise.all([reload(), loadTypeFilters()]);
}

async function handleAssigned(assignedIds: string[]) {
  const remainingIds = selectedRowKeys.value.filter(
    (id) => !assignedIds.includes(id),
  );
  await reload();
  setSelectedRowKeys(remainingIds);
}

async function loadTypeFilters() {
  const types = await getEntityViewTypes();
  typeFilters.value = types.map(({ type }) => ({ text: type, value: type }));
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <AssignModal @success="handleAssigned" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.entityView')"
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
      </template>
      <template #toolbar>
        <Button
          v-access:role="[Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('entity-view.actions.create') }}
        </Button>
      </template>
    </BasicTable>
  </Page>
</template>
