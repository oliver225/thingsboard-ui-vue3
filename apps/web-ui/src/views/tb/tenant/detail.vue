<script setup lang="ts">
import type { TenantInfo } from '#/api/tb/tenant';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';

import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { areaList } from '@vant/area-data';
import { message } from 'antdv-next';

import { deleteTenant, getTenantInfoById } from '#/api/tb/tenant';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import Form from './form.vue';

defineOptions({ name: 'TenantDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.tenantId ?? ''));
const record = ref<TenantInfo>();
const activeTab = ref('details');
const loading = ref(false);
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.SYS_ADMIN] },
  { key: 'attributes', auth: [Authority.SYS_ADMIN] },
  { key: 'telemetry', auth: [Authority.SYS_ADMIN] },
  { key: 'events', auth: [Authority.SYS_ADMIN] },
  { key: 'relations', auth: [Authority.SYS_ADMIN] },
];

const basicFields = computed(() => [
  { label: $t('tenant.fields.title'), value: record.value?.title },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
]);
const contactFields = computed(() => [
  { label: $t('tenant.fields.email'), value: record.value?.email },
  { label: $t('tenant.fields.phone'), value: record.value?.phone },
  {
    label: $t('tenant.fields.region'),
    value: [
      areaList.province_list[record.value?.country ?? ''] ||
        record.value?.country,
      areaList.city_list[record.value?.state ?? ''] || record.value?.state,
      areaList.county_list[record.value?.city ?? ''] || record.value?.city,
    ]
      .filter(Boolean)
      .join(' / '),
  },
  { label: $t('tenant.fields.zip'), value: record.value?.zip },
  { label: $t('tenant.fields.address'), value: record.value?.address },
  { label: $t('tenant.fields.address2'), value: record.value?.address2 },
]);

const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'profile',
    icon: 'lucide:layers',
    label: $t('tenant.fields.tenantProfile'),
    value: record.value?.tenantProfileName,
  },
  {
    key: 'city',
    icon: 'lucide:map-pin',
    label: $t('tenant.fields.city'),
    value:
      areaList.county_list[record.value?.city ?? ''] ||
      areaList.city_list[record.value?.city ?? ''] ||
      record.value?.city,
  },
  {
    key: 'phone',
    icon: 'lucide:phone',
    label: $t('tenant.fields.phone'),
    value: record.value?.phone,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  { key: 'copyId', label: $t('tenant.detail.copyId'), icon: 'lucide:copy' },
  { key: 'admins', label: $t('tb.menu.tenantAdmin'), icon: 'lucide:users' },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('tenant.actions.edit'),
      icon: 'lucide:square-pen',
    },

    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('tenant.actions.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      group: 'delete',
    },
  ],
}));

watch(
  recordId,
  () => {
    record.value = undefined;
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadRecord();
  },
  { immediate: true },
);

async function loadRecord() {
  const id = recordId.value;
  if (!id) return;
  loading.value = true;
  try {
    const info = await getTenantInfoById(id);
    if (recordId.value !== id) return;
    record.value = info;
    setBreadcrumbTitle(info.title);
  } catch {
    if (recordId.value === id) record.value = undefined;
  } finally {
    if (recordId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'TenantList' });
}

function handleAction(key: string) {
  if (
    !record.value ||
    loading.value ||
    !hasAccessByRoles([Authority.SYS_ADMIN])
  )
    return;
  switch (key) {
    case 'copyId': {
      return copyToClipboard(recordId.value, $t('tb.common.copySuccess'));
    }
    case 'edit': {
      return formModalApi.setData({ tenantId: recordId.value }).open();
    }
    case 'admins': {
      return router.push({
        name: 'TenantAdmin',
        params: { tenantId: recordId.value },
      });
    }
    case 'refresh': {
      return loadRecord();
    }
    case 'delete': {
      return handleDelete();
    }
  }
}

async function handleDelete() {
  const current = record.value;
  if (!current?.id) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('tenant.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('tenant.menu'),
        name: current.title,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteTenant(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id)
            await router.replace({ name: 'TenantList' });
          return true;
        } catch {
          return false;
        } finally {
          if (recordId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('tenant.detail.title')"
    :key="recordId"
    v-model:active-tab="activeTab"
    :title="record?.title"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="record?.id"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :state="loading ? 'loading' : record ? 'ready' : 'error'"
    :error-message="$t('tenant.detail.notFound')"
    @action="handleAction"
    @retry="loadRecord"
    @back="handleBack"
  >
    <template #modals><FormModal @success="loadRecord" /></template>
    <template #tab-details>
      <div
        v-if="record"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:building-2"
          :title="$t('tenant.detail.basic')"
          content-class="space-y-5"
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
            <div v-if="record.tenantProfileId" class="space-y-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('tenant.fields.tenantProfile') }}
              </dt>
              <dd class="text-sm font-medium">
                <RouterLink
                  :to="{
                    name: 'TenantProfileDetail',
                    params: { tenantProfileId: record.tenantProfileId.id },
                  }"
                  class="break-all text-primary hover:underline"
                >
                  {{
                    record.tenantProfileName ||
                    $t('tenant.detail.nameUnavailable')
                  }}
                </RouterLink>
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('tenant.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !record.additionalInfo?.description && 'text-muted-foreground'
                "
              >
                {{
                  record.additionalInfo?.description ||
                  $t('tenant.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <Card
          icon="lucide:contact"
          :title="$t('tenant.detail.contact')"
          content-class="space-y-4"
        >
          <dl class="space-y-5">
            <div
              v-for="field in contactFields"
              :key="field.label"
              class="space-y-2"
            >
              <dt class="text-sm text-muted-foreground">{{ field.label }}</dt>
              <dd class="whitespace-pre-wrap break-all text-sm font-medium">
                {{ field.value || '—' }}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </template>
  </DetailPage>
</template>
