<script setup lang="ts">
import type { EntityViewInfo } from '#/api/tb/entity-view';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
} from '#/components/detail-page';

import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { Badge } from '@vben-core/shadcn-ui';

import { message } from 'antdv-next';

import { findEntityDataByQuery } from '#/api/tb/entity-query';
import {
  deleteEntityView,
  getEntityViewInfoById,
  makeEntityViewPublic,
  unassignEntityViewFromCustomer,
} from '#/api/tb/entity-view';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { NULL_UUID } from '#/constants';
import { Authority, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import AssignCustomer from './assign-customer.vue';
import EntityViewForm from './form.vue';

defineOptions({ name: 'EntityViewDetail' });

const route = useRoute();
const router = useRouter();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const { hasAccessByRoles } = useAccess();
const entityViewId = computed(() => String(route.params.entityViewId ?? ''));
const entityView = ref<EntityViewInfo>();
const targetName = ref<string>();
const activeTab = ref('details');
const loading = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: EntityViewForm,
  destroyOnClose: true,
});
const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: AssignCustomer,
  destroyOnClose: true,
});

const assigned = computed(
  () =>
    !!entityView.value?.customerId?.id &&
    entityView.value.customerId.id !== NULL_UUID,
);
const headerFields = computed(() => [
  {
    key: 'type',
    icon: 'lucide:layers',
    label: $t('entity-view.fields.type'),
    value: entityView.value?.type,
  },
  {
    key: 'customer',
    icon: 'lucide:building-2',
    label: $t('entity-view.fields.customer'),
    value: assigned.value ? entityView.value?.customerTitle : undefined,
  },
]);
const visibilityAction = computed(() => {
  if (!assigned.value) return 'makePublic';
  return entityView.value?.customerIsPublic ? 'makePrivate' : 'unassign';
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  {
    key: 'attributes',
    auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
  },
  { key: 'telemetry', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'alarms', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'events', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'relations', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
];
const basicFields = computed(() => [
  { label: $t('entity-view.fields.name'), value: entityView.value?.name },
  { label: $t('entity-view.fields.type'), value: entityView.value?.type },
  {
    label: $t('entity-view.fields.customer'),
    value: assigned.value
      ? entityView.value?.customerTitle
      : $t('entity-view.features.detail.unassigned'),
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(entityView.value?.createdTime),
  },
  {
    label: $t('entity-view.features.detail.visibility'),
    value: entityView.value?.customerIsPublic
      ? $t('entity-view.features.detail.public')
      : $t('entity-view.features.detail.private'),
  },
]);
const targetRoute = computed(() => {
  const target = entityView.value?.entityId;
  if (!target) return undefined;
  const type = target.entityType.toLowerCase();
  return {
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)}Detail`,
    params: { [`${type}Id`]: target.id },
  };
});
const keyFields = computed(() => [
  {
    key: 'clientAttributes',
    values: entityView.value?.keys?.attributes?.cs ?? [],
  },
  {
    key: 'sharedAttributes',
    values: entityView.value?.keys?.attributes?.sh ?? [],
  },
  {
    key: 'serverAttributes',
    values: entityView.value?.keys?.attributes?.ss ?? [],
  },
  { key: 'timeseries', values: entityView.value?.keys?.timeseries ?? [] },
]);
const timeFields = computed(() => [
  { key: 'startTime', value: entityView.value?.startTimeMs },
  { key: 'endTime', value: entityView.value?.endTimeMs },
]);
const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('entity-view.features.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('entity-view.actions.edit'),
      icon: 'lucide:square-pen',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'assign',
      label: $t('entity-view.actions.assign'),
      icon: 'lucide:user-plus',
      auth: [Authority.TENANT_ADMIN],
      visible: !assigned.value,
      group: 'assignment',
    },
    {
      key: 'visibility',
      label: $t(`entity-view.actions.${visibilityAction.value}`),
      icon: assigned.value ? 'lucide:user-minus' : 'lucide:globe',
      auth: [Authority.TENANT_ADMIN],
      group: 'assignment',
    },
    {
      key: 'delete',
      label: $t('entity-view.actions.delete'),
      icon: 'lucide:trash-2',
      auth: [Authority.TENANT_ADMIN],
      danger: true,
      group: 'delete',
    },
  ],
}));

function handleAction(key: string) {
  const handlers: Record<string, () => unknown> = {
    assign: handleAssign,
    copyId: () =>
      copyToClipboard(
        entityViewId.value,
        $t('entity-view.features.detail.idCopied'),
      ),
    delete: handleDelete,
    edit: handleEdit,
    refresh: loadEntityView,
    visibility: handleVisibility,
  };
  return handlers[key]?.();
}

watch(
  entityViewId,
  () => {
    entityView.value = undefined;
    targetName.value = undefined;
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadEntityView();
  },
  { immediate: true },
);

async function loadEntityView() {
  const id = entityViewId.value;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const info = await getEntityViewInfoById(id);
    if (entityViewId.value !== id) return;
    const target = info.entityId;
    const name = target
      ? await findEntityDataByQuery({
          entityFilter: { type: 'singleEntity', singleEntity: target },
          entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
          pageLink: { page: 0, pageSize: 1 },
        })
          .then(({ data }) => data[0]?.latest.ENTITY_FIELD?.name?.value)
          .catch(() => undefined)
      : undefined;
    if (entityViewId.value !== id) return;
    entityView.value = info;
    targetName.value = name;
    setBreadcrumbTitle(info.name);
  } catch {
    if (entityViewId.value === id) entityView.value = undefined;
  } finally {
    if (entityViewId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'EntityViewList' });
}

function handleEdit() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({ entityViewId: entityViewId.value }).open();
}

function handleAssign() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  assignModalApi.setData({ entityViewIds: [entityViewId.value] }).open();
}

async function handleVisibility() {
  const current = entityView.value;
  if (
    !current?.id ||
    !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
    loading.value
  )
    return;
  const action = visibilityAction.value;
  try {
    await confirm({
      title: $t(`entity-view.features.${action}.title`),
      content: $t(`entity-view.features.${action}.content`, {
        name: current.name,
        customer: current.customerTitle,
      }),
    });
  } catch {
    return;
  }
  if (entityViewId.value !== current.id.id) return;
  loading.value = true;
  try {
    await (action === 'makePublic'
      ? makeEntityViewPublic(current.id.id)
      : unassignEntityViewFromCustomer(current.id.id));
    message.success($t(`entity-view.actions.${action}Success`));
    if (entityViewId.value === current.id.id) await loadEntityView();
  } finally {
    if (entityViewId.value === current.id.id) loading.value = false;
  }
}

async function handleDelete() {
  const current = entityView.value;
  if (
    !current?.id ||
    !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
    loading.value
  )
    return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('entity-view.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('entity-view.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteEntityView(id);
          message.success($t('tb.common.messages.delete.success'));
          if (entityViewId.value === id)
            await router.replace({ name: 'EntityViewList' });
          return true;
        } catch {
          return false;
        } finally {
          if (entityViewId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('entity-view.features.detail.title')"
    :key="entityViewId"
    v-model:active-tab="activeTab"
    :title="entityView?.name"
    :tags="headerFields"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :tabs="tabs"
    :entity-id="entityView?.id"
    :state="loading ? 'loading' : entityView ? 'ready' : 'error'"
    :error-message="$t('entity-view.features.detail.notFound')"
    @action="handleAction"
    @retry="loadEntityView"
    @back="handleBack"
  >
    <template #modals>
      <FormModal @success="loadEntityView" />
      <AssignModal @success="loadEntityView" />
    </template>
    <template #tab-details>
      <div
        v-if="entityView"
        class="grid min-h-full min-w-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-2 xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:scan-eye"
          :title="$t('entity-view.features.detail.basic')"
        >
          <dl class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div
              v-for="field in basicFields"
              :key="field.label"
              class="space-y-2"
            >
              <dt class="text-sm text-muted-foreground">{{ field.label }}</dt>
              <dd class="break-all text-sm font-medium">
                {{ field.value || '—' }}
              </dd>
            </div>
            <div class="space-y-2 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('entity-view.fields.entity') }}
              </dt>
              <dd
                class="flex flex-wrap items-center gap-2 break-all text-sm font-medium"
              >
                <Badge v-if="entityView.entityId" variant="secondary">
                  {{ entityTypeLabel(entityView.entityId.entityType) }}
                </Badge>
                <RouterLink
                  v-if="targetRoute"
                  :to="targetRoute"
                  class="text-primary hover:underline"
                >
                  {{
                    targetName ||
                    $t('entity-view.features.detail.targetNameUnavailable')
                  }}
                </RouterLink>
                <span v-else>—</span>
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('entity-view.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !entityView.additionalInfo?.description &&
                  'text-muted-foreground'
                "
              >
                {{
                  entityView.additionalInfo?.description ||
                  $t('entity-view.features.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <Card
          icon="lucide:list-filter"
          :title="$t('entity-view.features.detail.dataSettings')"
        >
          <dl class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div
              v-for="field in keyFields"
              :key="field.key"
              class="min-w-0 space-y-2"
            >
              <dt class="text-sm text-muted-foreground">
                {{ $t(`entity-view.fields.${field.key}`) }}
              </dt>
              <dd class="flex flex-wrap gap-2 text-sm">
                <template v-if="field.values.length">
                  <Badge
                    v-for="key in field.values"
                    :key="key"
                    variant="secondary"
                    class="max-w-full whitespace-normal break-all"
                  >
                    {{ key }}
                  </Badge>
                </template>
                <span v-else class="text-muted-foreground">{{
                  $t(
                    field.key === 'timeseries'
                      ? 'entity-view.features.detail.allTelemetry'
                      : 'entity-view.features.detail.noAttributes',
                  )
                }}</span>
              </dd>
            </div>
            <div v-for="field in timeFields" :key="field.key" class="space-y-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t(`entity-view.fields.${field.key}`) }}
              </dt>
              <dd class="text-sm font-medium">
                {{
                  field.value
                    ? formatDateTime(field.value)
                    : $t('entity-view.features.form.noTimeLimit')
                }}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </template>
  </DetailPage>
</template>
