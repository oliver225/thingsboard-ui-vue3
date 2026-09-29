<script setup lang="ts">
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';
import type { TbUser } from '#/types/tb';

import { computed, h, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { alert, confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import { getTenantById } from '#/api/tb/tenant';
import {
  deleteUser,
  getUserActivationLinkInfo,
  getUserById,
  sendUserActivationEmail,
  setUserCredentialsEnabled,
} from '#/api/tb/user';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { getLanguageOptions, getUnitSystemOptions } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import { copyToClipboard } from '#/utils/common';

import ActivationLinkContent from './activation-link-content.vue';
import Form from './form.vue';

defineOptions({ name: 'TenantAdminDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.userId ?? ''));
const parentId = computed(() => String(route.params.tenantId ?? ''));
const authStore = useAuthStore();
const record = ref<TbUser & { tenantTitle?: string }>();
const activeTab = ref('details');
const loading = ref(false);
const accountBusy = ref(false);
const accountActions = computed<DetailAction[]>(() => {
  if (!record.value?.id?.id || !hasAccessByRoles([Authority.SYS_ADMIN]))
    return [];
  const activated = record.value.additionalInfo?.userActivated === true;
  const enabled = record.value.additionalInfo?.userCredentialsEnabled === true;
  if (activated) {
    return [
      {
        key: enabled ? 'disableUser' : 'enableUser',
        label: $t(
          enabled
            ? 'tenant-admin.actions.disableUser'
            : 'tenant-admin.actions.enableUser',
        ),
        icon: enabled ? 'lucide:user-round-x' : 'lucide:user-round-check',
        danger: enabled,
      },
    ];
  }
  return [
    {
      key: 'showActivationLink',
      label: $t('tenant-admin.actions.showActivationLink'),
      icon: 'lucide:link',
    },
    {
      key: 'resendActivation',
      label: $t('tenant-admin.actions.resendActivation'),
      icon: 'lucide:mail',
    },
  ];
});
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.SYS_ADMIN] },
  { key: 'attributes', auth: [Authority.SYS_ADMIN] },
  { key: 'telemetry', auth: [Authority.SYS_ADMIN] },
  { key: 'relations', auth: [Authority.SYS_ADMIN] },
  { key: 'auditLogs', auth: [Authority.SYS_ADMIN] },
  { key: 'apiKeys', auth: [Authority.SYS_ADMIN] },
];
const basicFields = computed(() => [
  { label: $t('tenant-admin.fields.email'), value: record.value?.email },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
  {
    label: $t('tenant-admin.fields.firstName'),
    value: record.value?.firstName,
  },
  { label: $t('tenant-admin.fields.lastName'), value: record.value?.lastName },
  { label: $t('tenant-admin.fields.phone'), value: record.value?.phone },
]);
const preferenceFields = computed(() => [
  {
    label: $t('account.fields.language'),
    value:
      getLanguageOptions().find(
        (option) => option.value === record.value?.additionalInfo?.lang,
      )?.label || $t('account.options.langAuto'),
  },
  {
    label: $t('account.fields.unitSystem'),
    value:
      getUnitSystemOptions().find(
        (option) => option.value === record.value?.additionalInfo?.unitSystem,
      )?.label || $t('account.options.unitAuto'),
  },
]);

const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'firstName',
    icon: 'lucide:user',
    label: $t('tenant-admin.fields.firstName'),
    value: record.value?.firstName,
  },
  {
    key: 'lastName',
    icon: 'lucide:user-round',
    label: $t('tenant-admin.fields.lastName'),
    value: record.value?.lastName,
  },
  {
    key: 'phone',
    icon: 'lucide:phone',
    label: $t('tenant-admin.fields.phone'),
    value: record.value?.phone,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  ...accountActions.value,
  {
    key: 'copyId',
    label: $t('tenant-admin.detail.copyId'),
    icon: 'lucide:copy',
  },
  {
    key: 'loginAs',
    label: $t('tenant-admin.actions.loginAs'),
    icon: 'lucide:log-in',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('tenant-admin.actions.edit'),
      icon: 'lucide:square-pen',
    },

    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('tenant-admin.actions.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      group: 'delete',
    },
  ],
}));

watch(
  [recordId, parentId],
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
  const scopeId = parentId.value;
  if (!id || !scopeId) return;
  loading.value = true;
  try {
    const [info, parent] = await Promise.all([
      getUserById(id),
      getTenantById(scopeId).catch(() => undefined),
    ]);
    if (recordId.value !== id || parentId.value !== scopeId) return;
    record.value =
      info.authority === Authority.TENANT_ADMIN && info.tenantId?.id === scopeId
        ? { ...info, tenantTitle: parent?.title }
        : undefined;
    if (record.value) setBreadcrumbTitle(info.email);
  } catch {
    if (recordId.value === id && parentId.value === scopeId)
      record.value = undefined;
  } finally {
    if (recordId.value === id && parentId.value === scopeId)
      loading.value = false;
  }
}

function handleBack() {
  return router.push({
    name: 'TenantAdminList',
    params: { tenantId: parentId.value },
  });
}

function handleAction(key: string) {
  if (
    !record.value ||
    loading.value ||
    accountBusy.value ||
    !hasAccessByRoles([Authority.SYS_ADMIN])
  )
    return;
  if (accountActions.value.some((action) => action.key === key)) {
    return handleAccountAction(key);
  }
  switch (key) {
    case 'copyId': {
      return copyToClipboard(recordId.value, $t('tb.common.copySuccess'));
    }
    case 'edit': {
      return formModalApi
        .setData({ tenantId: parentId.value, userId: recordId.value })
        .open();
    }
    case 'loginAs': {
      return handleLoginAs();
    }
    case 'refresh': {
      return loadRecord();
    }
    case 'delete': {
      return handleDelete();
    }
  }
}

async function handleAccountAction(key: string) {
  const current = record.value;
  if (
    accountBusy.value ||
    !current?.id?.id ||
    !accountActions.value.some((action) => action.key === key)
  )
    return;
  accountBusy.value = true;
  try {
    if (key === 'showActivationLink') {
      const activationLinkInfo = await getUserActivationLinkInfo(current.id.id);
      void alert({
        content: () => h(ActivationLinkContent, { activationLinkInfo }),
        containerClass: 'sm:w-[min(52rem,calc(100vw_-_2rem))]!',
        showCancel: true,
        title: $t('authentication.features.activation.linkTitle'),
      }).catch(() => {});
    } else if (key === 'resendActivation') {
      await sendUserActivationEmail(current.email);
      message.success($t('authentication.features.activation.emailSent'));
    } else {
      const enabled = key === 'enableUser';
      await setUserCredentialsEnabled(current.id.id, enabled);
      current.additionalInfo = {
        ...current.additionalInfo,
        userCredentialsEnabled: enabled,
      };
      message.success(
        $t(
          enabled
            ? 'tenant-admin.features.account.enabled'
            : 'tenant-admin.features.account.disabled',
        ),
      );
      await loadRecord();
    }
  } finally {
    accountBusy.value = false;
  }
}

async function handleLoginAs() {
  const current = record.value;
  if (!current?.id) return;
  try {
    await confirm({
      title: $t('tenant-admin.features.loginAs.title', { name: current.email }),
      content: $t('tenant-admin.features.loginAs.content'),
      icon: 'warning',
    });
    await authStore.userLogin(current.id.id);
  } catch {}
}

async function handleDelete() {
  const current = record.value;
  if (!current?.id) return;
  const id = current.id.id;
  const scopeId = parentId.value;
  try {
    await confirm({
      title: $t('tenant-admin.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('tenant-admin.menu'),
        name: current.email,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteUser(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id && parentId.value === scopeId)
            await router.replace({
              name: 'TenantAdminList',
              params: { tenantId: parentId.value },
            });
          return true;
        } catch {
          return false;
        } finally {
          if (recordId.value === id && parentId.value === scopeId)
            loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('tenant-admin.detail.title')"
    :key="recordId"
    v-model:active-tab="activeTab"
    :title="record?.email"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="record?.id"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :actions-disabled="accountBusy"
    :state="loading ? 'loading' : record ? 'ready' : 'error'"
    :error-message="$t('tenant-admin.detail.notFound')"
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
          icon="lucide:user"
          :title="$t('tenant-admin.detail.basic')"
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
            <div v-if="record.tenantId" class="space-y-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('tenant-admin.detail.parent') }}
              </dt>
              <dd class="text-sm font-medium">
                <RouterLink
                  :to="{
                    name: 'TenantDetail',
                    params: { tenantId: record.tenantId.id },
                  }"
                  class="break-all text-primary hover:underline"
                >
                  {{
                    record.tenantTitle ||
                    $t('tenant-admin.detail.nameUnavailable')
                  }}
                </RouterLink>
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('tenant-admin.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !record.additionalInfo?.description && 'text-muted-foreground'
                "
              >
                {{
                  record.additionalInfo?.description ||
                  $t('tenant-admin.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <Card
          icon="lucide:settings-2"
          :title="$t('tenant-admin.detail.preferences')"
          content-class="space-y-4"
        >
          <dl class="space-y-5">
            <div
              v-for="field in preferenceFields"
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
