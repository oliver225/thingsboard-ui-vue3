<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { DashboardInfo } from '#/api/tb/dashboard';
import type { TbUser } from '#/types/tb';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCurrentUser } from '#/api/tb/auth';
import { getCustomerDashboards, getTenantDashboards } from '#/api/tb/dashboard';
import { saveUser } from '#/api/tb/user';
import {
  PHONE_PATTERN,
  SUPPORT_LANGUAGES,
  UNIT_SYSTEM_OPTIONS,
} from '#/constants';
import { Authority } from '#/enums';
import { useAuthStore } from '#/store';

type EditableUser = TbUser & {
  additionalInfo: NonNullable<TbUser['additionalInfo']>;
};

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

interface SelectOption {
  label: string;
  value: string;
}

const authStore = useAuthStore();
const userStore = useUserStore();

const loading = ref(false);
const saving = ref(false);
const user = ref<EditableUser | null>(null);
const dashboardOptions = ref<SelectOption[]>([]);

const lastLoginTs = computed(() => {
  const ts = user.value?.additionalInfo?.lastLoginTs;
  return ts ? formatDateTime(ts) : '-';
});

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInput',
    componentProps: {
      disabled: true,
      placeholder: $t('tb.account.email'),
    },
    fieldName: 'email',
    label: $t('tb.account.email'),
  },
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: $t('tb.account.firstName'),
    },
    fieldName: 'firstName',
    label: $t('tb.account.firstName'),
  },
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: $t('tb.account.lastName'),
    },
    fieldName: 'lastName',
    label: $t('tb.account.lastName'),
  },
  {
    component: 'PhoneInput',
    componentProps: {
      placeholder: '+8613xxxxxxxxx',
    },
    fieldName: 'phone',
    label: $t('tb.account.phone'),
    rules: z
      .string()
      .optional()
      .refine((value) => !value || PHONE_PATTERN.test(value), {
        message: $t('tb.account.phoneFormatTip'),
      }),
  },
  {
    component: 'VbenSelect',
    componentProps: {
      options: SUPPORT_LANGUAGES,
      placeholder: $t('tb.account.langAuto'),
    },
    fieldName: 'lang',
    label: $t('tb.account.language'),
  },
  {
    component: 'VbenSelect',
    componentProps: {
      options: UNIT_SYSTEM_OPTIONS,
      placeholder: $t('tb.account.unitAuto'),
    },
    fieldName: 'unitSystem',
    label: $t('tb.account.unitSystem'),
  },
  {
    component: 'VbenSelect',
    componentProps: {
      allowClear: true,
      options: dashboardOptions.value,
      placeholder: $t('tb.account.homeDashboard'),
    },
    fieldName: 'homeDashboardId',
    formItemClass: 'md:col-span-1',
    label: $t('tb.account.homeDashboard'),
    hide: userStore.userInfo?.roles?.[0] === Authority.SYS_ADMIN,
  },
  {
    component: 'VbenCheckbox',
    fieldName: 'homeDashboardHideToolbar',
    formItemClass: 'md:col-span-1',
    renderComponentContent: () => ({
      default: () => h('span', $t('tb.account.hideHomeDashboardToolbar')),
    }),
    hide: userStore.userInfo?.roles?.[0] === Authority.SYS_ADMIN,
  },
]);

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      formItemClass: 'col-span-full',
    },
    layout: 'horizontal',
    schema: formSchema,
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1 md:grid-cols-2',
  }),
);

function normalizeUser(data: TbUser): EditableUser {
  return {
    ...data,
    additionalInfo: {
      ...data.additionalInfo,
    },
  };
}

function toFormValues(data: EditableUser): BaseSettingFormValues {
  return {
    email: data.email,
    firstName: data.firstName,
    homeDashboardHideToolbar:
      data.additionalInfo.homeDashboardHideToolbar ?? false,
    homeDashboardId: data.additionalInfo.homeDashboardId || undefined,
    lang: data.additionalInfo.lang || undefined,
    lastName: data.lastName,
    phone: data.phone || undefined,
    unitSystem: data.additionalInfo.unitSystem || undefined,
  };
}

function mergeFormValues(values: BaseSettingFormValues): EditableUser | null {
  if (!user.value) {
    return null;
  }

  return {
    ...user.value,
    additionalInfo: {
      ...user.value.additionalInfo,
      homeDashboardHideToolbar: values.homeDashboardHideToolbar ?? false,
      homeDashboardId: values.homeDashboardId,
      lang: values.lang,
      unitSystem: values.unitSystem,
    },
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone || undefined,
  };
}

async function loadDashboards() {
  try {
    const role = userStore.userInfo?.roles?.[0];
    const pageLink = { page: 0, pageSize: 100, sortProperty: 'title' };
    const customerId = user.value?.customerId?.id;
    let pageData;
    if (role === Authority.CUSTOMER_USER && customerId) {
      pageData = await getCustomerDashboards(customerId, pageLink);
    } else if (role === Authority.TENANT_ADMIN) {
      pageData = await getTenantDashboards(pageLink);
    } else {
      // 其他角色兜底清空
      dashboardOptions.value = [];
      return;
    }

    dashboardOptions.value = pageData.data.map((dashboard: DashboardInfo) => ({
      label: dashboard.title,
      value: dashboard.id.id,
    }));
  } catch {
    dashboardOptions.value = [];
  }
}

async function loadUserInfo() {
  loading.value = true;
  try {
    const data = normalizeUser(await getCurrentUser());
    user.value = data;
    await loadDashboards();
    await formApi.setValues(toFormValues(data));
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!user.value || saving.value) {
    return;
  }

  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }

  const values = await formApi.getValues<BaseSettingFormValues>();
  const nextUser = mergeFormValues(values);
  if (!nextUser) {
    return;
  }

  saving.value = true;
  try {
    const savedUser = normalizeUser(await saveUser(nextUser));
    user.value = savedUser;
    await formApi.setValues(toFormValues(savedUser));
    await authStore.fetchUserInfo();
    message.success($t('tb.common.saveSuccess'));
  } finally {
    saving.value = false;
  }
}

onMounted(loadUserInfo);
</script>

<template>
  <div class="space-y-4" @keydown.enter.prevent="handleSubmit">
    <div class="flex items-center justify-between gap-3 border-amber">
      <h3 class="text-lg font-bold text-foreground">
        {{ $t('tb.account.userInfo') }}
      </h3>
      <div v-if="user" class="text-xs text-muted-foreground">
        {{ $t('tb.account.lastLogin') }}: {{ lastLoginTs }}
      </div>
    </div>
    <Form />
    <VbenButton
      type="submit"
      :disabled="loading || !user"
      :loading="saving"
      @click="handleSubmit"
    >
      {{ $t('profile.updateBasicProfile') }}
    </VbenButton>
  </div>
</template>
