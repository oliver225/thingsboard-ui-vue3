<script setup lang="ts">
import type { Customer } from '#/api/tb/customer';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { areaList } from '@vant/area-data';
import { message } from 'antdv-next';

import { deleteCustomer, getCustomerById } from '#/api/tb/customer';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import Form from './form.vue';

defineOptions({ name: 'CustomerDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.customerId ?? ''));
const record = ref<Customer>();
const activeTab = ref('details');
const loading = ref(false);
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN] },
  { key: 'attributes', auth: [Authority.TENANT_ADMIN] },
  { key: 'telemetry', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarmRules', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarms', auth: [Authority.TENANT_ADMIN] },
  { key: 'events', auth: [Authority.TENANT_ADMIN] },
  { key: 'relations', auth: [Authority.TENANT_ADMIN] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
];

const basicFields = computed(() => [
  { label: $t('customer.fields.title'), value: record.value?.title },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
]);
const contactFields = computed(() => [
  { label: $t('customer.fields.email'), value: record.value?.email },
  { label: $t('customer.fields.phone'), value: record.value?.phone },
  {
    label: $t('customer.fields.region'),
    value: [
      areaList.province_list[record.value?.country ?? ''] ||
        record.value?.country,
      areaList.city_list[record.value?.state ?? ''] || record.value?.state,
      areaList.county_list[record.value?.city ?? ''] || record.value?.city,
    ]
      .filter(Boolean)
      .join(' / '),
  },
  { label: $t('customer.fields.zip'), value: record.value?.zip },
  { label: $t('customer.fields.address'), value: record.value?.address },
  { label: $t('customer.fields.address2'), value: record.value?.address2 },
]);

const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'city',
    icon: 'lucide:map-pin',
    label: $t('customer.fields.city'),
    value:
      areaList.county_list[record.value?.city ?? ''] ||
      areaList.city_list[record.value?.city ?? ''] ||
      record.value?.city,
  },
  {
    key: 'phone',
    icon: 'lucide:phone',
    label: $t('customer.fields.phone'),
    value: record.value?.phone,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  { key: 'copyId', label: $t('customer.detail.copyId'), icon: 'lucide:copy' },
  {
    key: 'users',
    label: $t('customer-user.actions.manage'),
    icon: 'lucide:users',
    visible: !record.value?.additionalInfo?.isPublic,
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      visible: !record.value?.additionalInfo?.isPublic,
      label: $t('customer.actions.edit'),
      icon: 'lucide:square-pen',
    },

    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      visible: !record.value?.additionalInfo?.isPublic,
      label: $t('customer.actions.delete'),
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
    const info = await getCustomerById(id);
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
  return router.push({ name: 'CustomerList' });
}

function handleAction(key: string) {
  if (
    !record.value ||
    loading.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  switch (key) {
    case 'copyId': {
      return copyToClipboard(recordId.value, $t('tb.common.copySuccess'));
    }
    case 'edit': {
      if (record.value.additionalInfo?.isPublic) return;
      return formModalApi.setData({ customerId: recordId.value }).open();
    }
    case 'users': {
      if (record.value.additionalInfo?.isPublic) return;
      return router.push({
        name: 'CustomerUser',
        params: { customerId: recordId.value },
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
  if (!current?.id || current.additionalInfo?.isPublic) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('customer.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('customer.menu'),
        name: current.title,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteCustomer(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id)
            await router.replace({ name: 'CustomerList' });
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
    :page-title="$t('customer.detail.title')"
    :key="recordId"
    v-model:active-tab="activeTab"
    :title="record?.title"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="record?.id"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :state="loading ? 'loading' : record ? 'ready' : 'error'"
    :error-message="$t('customer.detail.notFound')"
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
          icon="lucide:users"
          :title="$t('customer.detail.basic')"
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
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('customer.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !record.additionalInfo?.description && 'text-muted-foreground'
                "
              >
                {{
                  record.additionalInfo?.description ||
                  $t('customer.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <Card
          icon="lucide:contact"
          :title="$t('customer.detail.contact')"
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
