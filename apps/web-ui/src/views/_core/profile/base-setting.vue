<script setup lang="ts">
import type { DashboardInfo } from '#/api/tb/dashboard';
import type { TbUser } from '#/types/tb';

import { computed, h, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCurrentUser } from '#/api/tb/auth';
import { getCustomerDashboards, getTenantDashboards } from '#/api/tb/dashboard';
import { saveUser } from '#/api/tb/user';
import {
  getLanguageOptions,
  getUnitSystemOptions,
  PHONE_PATTERN,
} from '#/constants';
import { Authority } from '#/enums';
import { useAuthStore } from '#/store';
import { loadAllPages } from '#/utils/page-data';

interface BaseSettingFormValues {
  email: string;
  firstName?: string;
  homeDashboardHideToolbar?: boolean;
  homeDashboardId?: string;
  lang?: string;
  lastName?: string;
  phone?: string;
  unitSystem?: string;
}

const authStore = useAuthStore();
const { hasAccessByRoles } = useAccess();

const loading = ref(false);
const user = ref<null | TbUser>(null);

const lastLoginTs = computed(() => {
  const ts = user.value?.additionalInfo?.lastLoginTs;
  return ts ? formatDateTime(ts) : '-';
});

const [Form, formApi] = useVbenForm<BaseSettingFormValues>({
  layout: 'vertical',
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-0',
  },
  wrapperClass: 'grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-x-0 gap-y-5',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        disabled: true,
        placeholder: $t('account.fields.email'),
      },
      fieldName: 'email',
      formItemClass: 'col-span-2',
      label: $t('account.fields.email'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('account.fields.firstName'),
      },
      fieldName: 'firstName',
      formItemClass: 'col-span-2',
      label: $t('account.fields.firstName'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('account.fields.lastName'),
      },
      fieldName: 'lastName',
      formItemClass: 'col-span-2',
      label: $t('account.fields.lastName'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '+8613xxxxxxxxx',
      },
      fieldName: 'phone',
      formItemClass: 'col-span-2',
      label: $t('account.fields.phone'),
      rules: z
        .string()
        .optional()
        .refine((value) => !value || PHONE_PATTERN.test(value), {
          message: $t('account.validation.phoneFormatTip'),
        }),
    },
    {
      component: 'Select',
      componentProps: {
        options: getLanguageOptions(),
        placeholder: $t('account.options.langAuto'),
      },
      fieldName: 'lang',
      formItemClass: 'col-span-2',
      label: $t('account.fields.language'),
    },
    {
      component: 'Select',
      componentProps: {
        options: getUnitSystemOptions(),
        placeholder: $t('account.options.unitAuto'),
      },
      fieldName: 'unitSystem',
      formItemClass: 'col-span-2',
      label: $t('account.fields.unitSystem'),
    },
    {
      component: 'ApiSelect',
      componentProps: () => ({
        allowClear: true,
        api: async () => {
          const customerId = user.value?.customerId?.id;
          const authority = user.value?.authority;
          if (
            authority !== Authority.TENANT_ADMIN &&
            !(authority === Authority.CUSTOMER_USER && customerId)
          )
            return [];
          return loadAllPages<DashboardInfo>((pageLink) => {
            const params = {
              ...pageLink,
              sortProperty: 'title',
              sortOrder: 'ASC' as const,
            };
            return authority === Authority.CUSTOMER_USER && customerId
              ? getCustomerDashboards(customerId, params)
              : getTenantDashboards(params);
          });
        },
        params: {
          authority: user.value?.authority,
          customerId: user.value?.customerId?.id,
        },
        labelField: 'title',
        valueField: 'id.id',
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t('account.fields.homeDashboard'),
      }),
      fieldName: 'homeDashboardId',
      formItemClass: 'col-span-1',
      label: $t('account.fields.homeDashboard'),
      dependencies: {
        if: () => !hasAccessByRoles([Authority.SYS_ADMIN]),
        triggerFields: ['email'],
      },
    },
    {
      component: 'Checkbox',
      fieldName: 'homeDashboardHideToolbar',
      formItemClass: 'col-span-1 pl-5 self-end',
      controlClass: 'min-h-9',
      hideLabel: true,
      renderComponentContent: () => ({
        default: () => h('span', $t('account.fields.hideHomeDashboardToolbar')),
      }),
      dependencies: {
        if: () => !hasAccessByRoles([Authority.SYS_ADMIN]),
        triggerFields: ['email'],
      },
    },
  ],
});

async function loadUserInfo() {
  if (loading.value) return;
  loading.value = true;
  try {
    const data = await getCurrentUser();
    user.value = data;
    await formApi.setValues({
      email: data.email,
      firstName: data.firstName,
      homeDashboardHideToolbar:
        data.additionalInfo?.homeDashboardHideToolbar ?? false,
      homeDashboardId: data.additionalInfo?.homeDashboardId || undefined,
      lang: data.additionalInfo?.lang || undefined,
      lastName: data.lastName,
      phone: data.phone || undefined,
      unitSystem: data.additionalInfo?.unitSystem || undefined,
    });
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!user.value || loading.value) {
    return;
  }

  loading.value = true;
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const values = await formApi.getValues();
    // 头像独立保存，使用最新实体合并资料，避免旧快照覆盖头像和版本号。
    const currentUser = await getCurrentUser();
    const savedUser = await saveUser({
      ...currentUser,
      additionalInfo: {
        ...currentUser.additionalInfo,
        homeDashboardHideToolbar: values.homeDashboardHideToolbar ?? false,
        homeDashboardId: values.homeDashboardId || null,
        lang: values.lang || undefined,
        unitSystem: values.unitSystem || null,
      },
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || undefined,
    });
    user.value = savedUser;
    await formApi.setValues({
      email: savedUser.email,
      firstName: savedUser.firstName,
      homeDashboardHideToolbar:
        savedUser.additionalInfo?.homeDashboardHideToolbar ?? false,
      homeDashboardId: savedUser.additionalInfo?.homeDashboardId || undefined,
      lang: savedUser.additionalInfo?.lang || undefined,
      lastName: savedUser.lastName,
      phone: savedUser.phone || undefined,
      unitSystem: savedUser.additionalInfo?.unitSystem || undefined,
    });
    await authStore.fetchUserInfo();
    message.success($t('tb.common.saveSuccess'));
  } finally {
    loading.value = false;
  }
}

onMounted(loadUserInfo);
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <header
      class="flex min-h-[66px] shrink-0 items-center justify-between gap-4 border-b border-border p-4 md:px-6 md:py-[18px]"
    >
      <h2
        class="m-0 text-[length:var(--font-size-base)] font-semibold leading-6"
      >
        {{ $t('account.sections.userInfo') }}
      </h2>

      <span v-if="user" class="text-xs text-muted-foreground">
        {{ $t('account.fields.lastLogin') }}: {{ lastLoginTs }}
      </span>
    </header>
    <div class="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-6">
      <div
        class="m-0 w-full min-w-0 max-w-[1040px] text-sm [&_.ant-form-item]:mb-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:font-medium [&_.ant-input-number]:w-full [&_.ant-select]:w-full"
      >
        <fieldset :disabled="loading || !user" :aria-busy="loading">
          <Form />
        </fieldset>
      </div>
    </div>
    <footer
      class="flex min-h-[68px] shrink-0 flex-wrap items-center justify-start gap-3 border-t border-border bg-card p-4 md:px-6 [&>.ant-btn]:min-w-20"
    >
      <VbenButton variant="outline" :disabled="loading" @click="loadUserInfo">
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        :disabled="loading || !user"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('profile.updateBasicProfile') }}
      </VbenButton>
    </footer>
  </section>
</template>
