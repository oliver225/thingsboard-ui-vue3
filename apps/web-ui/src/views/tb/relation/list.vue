<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { EntityRelationInfo } from '#/api/tb/relation';
import type { EntityType, RelationDirection } from '#/enums';

import { h, nextTick, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, message, Segmented } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRelation,
  getRelationInfosByFrom,
  getRelationInfosByTo,
} from '#/api/tb/relation';
import {
  EntityType as EntityTypeEnum,
  entityTypeLabel,
  RelationDirection as RelationDirectionEnum,
  relationDirectionOptions,
} from '#/enums';
import { $t } from '#/locales';
import { setRouteTitle } from '#/router/dynamic-title';
import { copyToClipboard } from '#/utils/common';

import RelationForm from './form.vue';

defineOptions({ name: 'RelationTable' });

const props = defineProps<{
  entityId: string;
  entityType: EntityType | string;
}>();

const direction = ref<RelationDirection>(RelationDirectionEnum.FROM);
const queryParams = reactive({ textSearch: '' });
const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RelationForm,
  destroyOnClose: true,
});

function relatedEntity(row: EntityRelationInfo) {
  return direction.value === RelationDirectionEnum.FROM ? row.to : row.from;
}

function relatedEntityName(row: EntityRelationInfo) {
  return direction.value === RelationDirectionEnum.FROM
    ? row.toName
    : row.fromName;
}

function formatRowSearchText(row: EntityRelationInfo) {
  const related = relatedEntity(row);
  return [
    row.type,
    row.typeGroup,
    related.entityType,
    related.id,
    relatedEntityName(row),
    JSON.stringify(row.additionalInfo ?? {}),
  ]
    .join(' ')
    .toLowerCase();
}

async function fetch({ page, sort }: any) {
  const list =
    direction.value === RelationDirectionEnum.FROM
      ? await getRelationInfosByFrom(props.entityType, props.entityId)
      : await getRelationInfosByTo(props.entityType, props.entityId);

  const keyword = queryParams.textSearch.trim().toLowerCase();
  const rows = keyword
    ? list.filter((item) => formatRowSearchText(item).includes(keyword))
    : [...list];

  const field = sort?.field as string | undefined;
  const asc = sort?.order === 'asc';
  rows.sort((a, b) => {
    const aEntity = relatedEntity(a);
    const bEntity = relatedEntity(b);
    let result: number;
    if (field === 'relatedEntityName') {
      result = (relatedEntityName(a) ?? '').localeCompare(
        relatedEntityName(b) ?? '',
      );
    } else if (field === 'relatedEntityType') {
      result = aEntity.entityType.localeCompare(bEntity.entityType);
    } else {
      result = a.type.localeCompare(b.type);
    }
    return asc ? result : -result;
  });

  const start = (page.currentPage - 1) * page.pageSize;
  return {
    data: rows.slice(start, start + page.pageSize),
    totalElements: rows.length,
  };
}

function copyIcon(text: string, tip: string) {
  return h(IconifyIcon, {
    class:
      'text-muted-foreground hover:text-primary cursor-pointer opacity-0 transition-opacity group-hover:opacity-100',
    icon: 'lucide:copy',
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      copyToClipboard(text, tip);
    },
  });
}

function getEntityRoute(entityType: string, entityId: string, name?: string) {
  switch (entityType) {
    case EntityTypeEnum.ASSET: {
      return router.resolve({ path: '/entities/assets' });
    }
    case EntityTypeEnum.CUSTOMER: {
      return router.resolve({ path: '/customers' });
    }
    case EntityTypeEnum.DASHBOARD: {
      return router.resolve({ path: '/dashboards' });
    }
    case EntityTypeEnum.DEVICE: {
      const route = router.resolve({
        name: 'DeviceDetail',
        params: { deviceId: entityId },
      });
      if (name) {
        setRouteTitle(route.fullPath, name);
      }
      return route;
    }
    case EntityTypeEnum.ENTITY_VIEW: {
      return router.resolve({ path: '/entities/entityViews' });
    }
    case EntityTypeEnum.RULE_CHAIN: {
      return router.resolve({ path: '/ruleChains' });
    }
    case EntityTypeEnum.TENANT: {
      return router.resolve({ path: '/tenants' });
    }
    default: {
      return null;
    }
  }
}

function openRelatedEntity(row: EntityRelationInfo) {
  const entity = relatedEntity(row);
  const route = getEntityRoute(
    entity.entityType,
    entity.id,
    relatedEntityName(row),
  );
  if (!route) return;
  router.push(route);
}

const [Grid, gridApi] = useVbenVxeGrid<EntityRelationInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'type',
        sortable: true,
        slots: {
          default: ({ row }) =>
            h('div', { class: 'group flex items-center gap-1' }, [
              h('span', { class: 'break-all' }, row.type),
              copyIcon(row.type, $t('tb.relation.copy.typeCopied')),
            ]),
        },
        title: $t('tb.relation.fields.type'),
      },
      {
        field: 'relatedEntityType',
        minWidth: 150,
        align: 'center',
        sortable: true,
        slots: {
          default: ({ row }) => entityTypeLabel(relatedEntity(row).entityType),
        },
        title: $t('tb.relation.fields.relatedEntityType'),
      },
      {
        field: 'relatedEntityName',
        sortable: true,
        slots: {
          default: ({ row }) => {
            const entity = relatedEntity(row);
            const name = relatedEntityName(row) || entity.id;
            const route = getEntityRoute(entity.entityType, entity.id, name);
            return h('div', { class: 'group flex items-center gap-1' }, [
              h(
                route ? 'button' : 'span',
                {
                  class: route
                    ? 'text-primary hover:text-primary/80 break-all text-left'
                    : 'break-all',
                  onClick: () => route && openRelatedEntity(row),
                  type: route ? 'button' : undefined,
                },
                name || '-',
              ),
              copyIcon(
                relatedEntity(row).id,
                $t('tb.relation.copy.entityIdCopied'),
              ),
            ]);
          },
        },
        title: $t('tb.relation.fields.relatedEntityName'),
      },
      {
        align: 'center',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        field: 'actions',
        fixed: 'right',
        title: $t('tb.common.actions'),
        width: 120,
      },
    ],
    proxyConfig: { ajax: { query: fetch } },
    rowConfig: { keyField: 'to.id' },
    sortConfig: {
      defaultSort: { field: 'type', order: 'asc' },
      remote: true,
    },
  } as VxeTableGridOptions<EntityRelationInfo>,
});

function onDirectionChange() {
  queryParams.textSearch = '';
  gridApi.query({ page: { currentPage: 1 } });
}

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function onAdd() {
  formModalApi
    .setData({ entityId: props.entityId, entityType: props.entityType })
    .open();
}

function getActionItems(row: EntityRelationInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onEdit(row: EntityRelationInfo) {
  formModalApi
    .setData({
      entityId: props.entityId,
      entityType: props.entityType,
      relation: row,
    })
    .open();
}

async function deleteByRow(row: EntityRelationInfo) {
  try {
    await deleteRelation(row);
    message.success($t('tb.common.deleteSuccess'));
    await nextTick();
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: EntityRelationInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return;
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.relation.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.relation.delete.title', { type: row.type }),
  }).catch(() => {});
}
</script>

<template>
  <FormModal @success="gridApi.query()" />

  <Grid>
    <template #toolbar-actions>
      <Segmented
        v-model:value="direction"
        :options="relationDirectionOptions()"
        @change="onDirectionChange"
      />
      <div class="ml-2 w-64">
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
    </template>
    <template #toolbar-tools>
      <Button type="primary" @click="onAdd">
        <template #icon>
          <IconifyIcon icon="lucide:plus" />
        </template>
        {{ $t('tb.relation.actions.add') }}
      </Button>
    </template>
  </Grid>
</template>
