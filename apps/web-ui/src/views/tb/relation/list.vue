<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { EntityRelationInfo } from '#/api/tb/relation';
import type { EntityId } from '#/types/tb';

import { computed, reactive, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, message, Select } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteRelation,
  deleteRelations,
  getRelationKey,
  getRelations,
} from '#/api/tb/relation';
import {
  entityTypeLabel,
  RelationDirection,
  relationDirectionOptions,
} from '#/enums';
import { $t } from '#/locales';

import RelationForm from './form.vue';

defineOptions({ name: 'EntityRelations' });

const props = defineProps<{ entityId: EntityId }>();

const searchInfo = reactive({
  searchText: '',
  direction: RelationDirection.FROM,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RelationForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<EntityRelationInfo>[]>(() => [
  {
    title: $t('relation.fields.type'),
    dataIndex: 'type',
    key: 'type',
    width: 200,
    sorter: (a, b) => a.type.localeCompare(b.type),
    defaultSortOrder: 'ascend',
  },
  {
    title: $t('relation.fields.relatedEntityType'),
    key: 'entityType',
    width: 160,
    customRender: ({ record }) =>
      entityTypeLabel(
        searchInfo.direction === RelationDirection.FROM
          ? record.to.entityType
          : record.from.entityType,
      ),
  },
  {
    title: $t('relation.fields.relatedEntityName'),
    key: 'entityName',
    width: 240,
    customRender: ({ record }) => getRelatedEntityName(record),
    sorter: (a, b) =>
      getRelatedEntityName(a as EntityRelationInfo).localeCompare(
        getRelatedEntityName(b as EntityRelationInfo),
      ),
  },
]);

const actionColumn: ActionColumn<EntityRelationInfo> = {
  align: 'center',
  width: 110,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        icon: 'lucide:square-pen',
        text: $t('tb.common.edit'),
        tooltip: $t('tb.common.edit'),
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('tb.common.delete'),
        tooltip: $t('tb.common.delete'),
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload, getDataSource, setSelectedRowKeys }] =
  useTable<EntityRelationInfo>({
    api: fetchList,
    searchInfo,
    columns: tableColumns,
    actionColumn,
    rowKey: (record) => getRelationKey(record as EntityRelationInfo),
    pagination: false,
    rowSelection: null,
    batch: {
      entityName: () => $t('relation.menu'),
      deleteApi: (keys): ReturnType<typeof deleteRelations> =>
        deleteRelations(
          getDataSource<EntityRelationInfo>().filter((record) =>
            keys.includes(getRelationKey(record)),
          ),
        ),
    },
    tableSetting: { redo: true, setting: true, size: true },
  });

watch([() => searchInfo.searchText, () => searchInfo.direction], handleSearch);
watch([() => props.entityId.id, () => props.entityId.entityType], handleSearch);

async function fetchList({
  textSearch,
  direction,
}: {
  textSearch?: string;
  direction: RelationDirection;
}) {
  const data = await getRelations(props.entityId, direction);
  const search = textSearch?.toLocaleLowerCase() ?? '';
  return data.filter((record) =>
    [
      record.type,
      direction === RelationDirection.FROM
        ? record.toName || record.to.id
        : record.fromName || record.from.id,
    ].some((value) => value.toLocaleLowerCase().includes(search)),
  );
}

function handleSearch() {
  setSelectedRowKeys([]);
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: EntityRelationInfo) {
  formModalApi.setData({ record }).open();
}

async function handleDelete(record: EntityRelationInfo) {
  await confirm({
    title: $t('tb.common.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('relation.menu'),
      name: `${record.type} → ${getRelatedEntityName(record)}`,
    }),
    icon: 'error',
    confirmText: $t('tb.common.delete'),
    confirmButtonProps: { variant: 'destructive' },
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteRelation(record);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function getRelatedEntityName(record: EntityRelationInfo) {
  return searchInfo.direction === RelationDirection.FROM
    ? record.toName || record.to.id
    : record.fromName || record.from.id;
}
</script>

<template>
  <section
    class="flex min-h-96 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
  >
    <FormModal
      :entity-id="entityId"
      :direction="searchInfo.direction"
      @success="handleSearch"
    />
    <BasicTable class="h-full" @register="registerTable">
      <template #query>
        <Select
          v-model:value="searchInfo.direction"
          class="w-full sm:w-40"
          :options="relationDirectionOptions()"
          :aria-label="$t('relation.fields.direction')"
        />
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-80 sm:max-w-full"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('relation.messages.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <Button type="primary" @click="handleCreate">
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('relation.actions.add') }}
        </Button>
      </template>
    </BasicTable>
  </section>
</template>
