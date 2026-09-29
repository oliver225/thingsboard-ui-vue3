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

import { getCustomerById } from '#/api/tb/customer';
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

import ActivationLinkContent from '../tenant-admin/activation-link-content.vue';
import Form from './form.vue';

defineOptions({ name: 'CustomerUserDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.userId ?? ''));
const parentId = computed(() => String(route.params.customerId ?? ''));
const authStore = useAuthStore();
const record = ref<TbUser & { customerTitle?: string }>();
const activeTab = ref('details');
const loading = ref(false);
const accountBusy = ref(false);
const accountActions = computed<DetailAction[]>(() => {
  if (!record.value?.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN]))
    return [];
  const activated = record.value.additionalInfo?.userActivated === true;
  const enabled = record.value.additionalInfo?.userCredentialsEnabled === true;
  if (activated) {
    return [
      {
        key: enabled ? 'disableUser' : 'enableUser',
        label: $t(
          enabled
            ? 'customer-user.actions.disableUser'
            : 'customer-user.actions.enableUser',
        ),
        icon: enabled ? 'lucide:user-round-x' : 'lucide:user-round-check',
        danger: enabled,
      },
    ];
  }
  return [
    {
      key: 'showActivationLink',
      label: $t('customer-user.actions.showActivationLink'),
      icon: 'lucide:link',
    },
    {
      key: 'resendActivation',
      label: $t('customer-user.actions.resendActivation'),
      icon: 'lucide:mail',
    },
  ];
});
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN] },
  { key: 'attributes', auth: [Authority.TENANT_ADMIN] },
  { key: 'telemetry', auth: [Authority.TENANT_ADMIN] },
  { key: 'relations', auth: [Authority.TENANT_ADMIN] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
  { key: 'apiKeys', auth: [Authority.TENANT_ADMIN] },
];
const basicFields = computed(() => [
  { label: $t('customer-user.fields.email'), value: record.value?.email },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
  {
    label: $t('customer-user.fields.firstName'),
    value: record.value?.firstName,
  },
  { label: $t('customer-user.fields.lastName'), value: record.value?.lastName },
  { label: $t('customer-user.fields.phone'), value: record.value?.phone },
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
    label: $t('customer-user.fields.firstName'),
    value: record.value?.firstName,
  },
  {
    key: 'lastName',
    icon: 'lucide:user-round',
    label: $t('customer-user.fields.lastName'),
    value: record.value?.lastName,
  },
  {
    key: 'phone',
    icon: 'lucide:phone',
    label: $t('customer-user.fields.phone'),
    value: record.value?.phone,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  ...accountActions.value,
  {
    key: 'copyId',
    label: $t('customer-user.detail.copyId'),
    icon: 'lucide:copy',
  },
  {
    key: 'loginAs',
    label: $t('customer-user.actions.loginAs'),
    icon: 'lucide:log-in',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('customer-user.actions.edit'),
      icon: 'lucide:square-pen',
    },

    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('customer-user.actions.delete'),
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
      getCustomerById(scopeId).catch(() => undefined),
    ]);
    if (recordId.value !== id || parentId.value !== scopeId) return;
    record.value =
      info.authority === Authority.CUSTOMER_USER &&
      info.customerId?.id === scopeId
        ? { ...info, customerTitle: parent?.title }
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
    name: 'CustomerUserList',
    params: { customerId: parentId.value },
  });
}

function handleAction(key: string) {
  if (
    !record.value ||
    loading.value ||
    accountBusy.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
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
        .setData({ customerId: parentId.value, userId: recordId.value })
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
            ? 'customer-user.features.account.enabled'
            : 'customer-user.features.account.disabled',
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
      title: $t('customer-user.features.loginAs.title', {
        name: current.email,
      }),
      content: $t('customer-user.features.loginAs.content'),
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
      title: $t('customer-user.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('customer-user.menu'),
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
              name: 'CustomerUserList',
              params: { customerId: parentId.value },
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
    :page-title="$t('customer-user.detail.title')"
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
    :error-message="$t('customer-user.detail.notFound')"
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
          :title="$t('customer-user.detail.basic')"
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
            <div v-if="record.customerId" class="space-y-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('customer-user.detail.parent') }}
              </dt>
              <dd class="text-sm font-medium">
                <RouterLink
                  :to="{
                    name: 'CustomerDetail',
                    params: { customerId: record.customerId.id },
                  }"
                  class="break-all text-primary hover:underline"
                >
                  {{
                    record.customerTitle ||
                    $t('customer-user.detail.nameUnavailable')
                  }}
                </RouterLink>
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('customer-user.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !record.additionalInfo?.description && 'text-muted-foreground'
                "
              >
                {{
                  record.additionalInfo?.description ||
                  $t('customer-user.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <Card
          icon="lucide:settings-2"
          :title="$t('customer-user.detail.preferences')"
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
