<script lang="ts" setup>
import type {
  NotificationTarget,
  NotificationTargetConfig,
  NotificationUsersFilter,
} from '#/api/tb/notification-target';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getCustomers } from '#/api/tb/customer';
import {
  getNotificationTargetById,
  saveNotificationTarget,
} from '#/api/tb/notification-target';
import { getTenantInfos } from '#/api/tb/tenant';
import { getTenantProfileInfos } from '#/api/tb/tenant-profile';
import { getUsers } from '#/api/tb/user';
import {
  Authority,
  NotificationTargetConfigType,
  notificationTargetConfigTypeLabel,
  NotificationTargetType,
  notificationTargetTypeLabel,
} from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);

const record = ref<NotificationTarget | null>(null);

/** 收件人组类型(SLACK 需 Slack 集成 + 会话查询,暂不支持) */
const typeOptions = [
  NotificationTargetType.PLATFORM_USERS,
  NotificationTargetType.MICROSOFT_TEAMS,
].map((value) => ({
  label: notificationTargetTypeLabel(value),
  value,
}));

/** 平台用户过滤类型,按权限过滤(对齐 ui-ngx allowNotificationTargetConfigTypes) */
const filterTypeOptions = (
  isSysAdmin
    ? [
        NotificationTargetConfigType.ALL_USERS,
        NotificationTargetConfigType.TENANT_ADMINISTRATORS,
        NotificationTargetConfigType.AFFECTED_TENANT_ADMINISTRATORS,
        NotificationTargetConfigType.SYSTEM_ADMINISTRATORS,
      ]
    : [
        NotificationTargetConfigType.ALL_USERS,
        NotificationTargetConfigType.TENANT_ADMINISTRATORS,
        NotificationTargetConfigType.CUSTOMER_USERS,
        NotificationTargetConfigType.USER_LIST,
        NotificationTargetConfigType.ORIGINATOR_ENTITY_OWNER_USERS,
        NotificationTargetConfigType.AFFECTED_USER,
      ]
).map((value) => ({
  label: notificationTargetConfigTypeLabel(value),
  value,
}));

async function loadTenantOptions() {
  const pageData = await getTenantInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'title',
  });
  return pageData.data.map((item) => ({
    label: item.title,
    value: item.id?.id,
  }));
}

async function loadTenantProfileOptions() {
  const pageData = await getTenantProfileInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'name',
  });
  return pageData.data.map((item) => ({
    label: item.name,
    value: item.id.id,
  }));
}

async function loadCustomerOptions() {
  const pageData = await getCustomers({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'title',
  });
  return pageData.data.map((item) => ({
    label: item.title,
    value: item.id?.id,
  }));
}

async function loadUserOptions() {
  const pageData = await getUsers({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'email',
  });
  return pageData.data.map((item) => ({
    label: item.email,
    value: item.id?.id,
  }));
}

const PLATFORM_USERS = NotificationTargetType.PLATFORM_USERS;
const MICROSOFT_TEAMS = NotificationTargetType.MICROSOFT_TEAMS;
const { CUSTOMER_USERS, TENANT_ADMINISTRATORS, USER_LIST } =
  NotificationTargetConfigType;

const [Form, formApi] = useVbenForm({
  commonConfig: { colon: true, labelWidth: 110 },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('tb.notification.recipient.form.name'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: typeOptions,
        style: { width: '100%' },
      },
      defaultValue: PLATFORM_USERS,
      fieldName: 'type',
      label: $t('tb.notification.recipient.form.type'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: filterTypeOptions,
        style: { width: '100%' },
      },
      defaultValue: NotificationTargetConfigType.ALL_USERS,
      dependencies: {
        if: (values) => values.type === PLATFORM_USERS,
        triggerFields: ['type'],
      },
      fieldName: 'usersFilterType',
      label: $t('tb.notification.recipient.form.filterUsers'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          {
            label: $t('tb.notification.recipient.form.byTenants'),
            value: 'tenants',
          },
          {
            label: $t('tb.notification.recipient.form.byTenantProfiles'),
            value: 'tenantProfiles',
          },
        ],
      },
      defaultValue: 'tenants',
      dependencies: {
        if: (values) =>
          isSysAdmin &&
          values.type === PLATFORM_USERS &&
          values.usersFilterType === TENANT_ADMINISTRATORS,
        triggerFields: ['type', 'usersFilterType'],
      },
      fieldName: 'filterByTenants',
      label: $t('tb.notification.recipient.form.filterBy'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadTenantOptions,
        mode: 'multiple',
        showSearch: true,
        style: { width: '100%' },
      },
      dependencies: {
        if: (values) =>
          isSysAdmin &&
          values.type === PLATFORM_USERS &&
          values.usersFilterType === TENANT_ADMINISTRATORS &&
          values.filterByTenants === 'tenants',
        triggerFields: ['type', 'usersFilterType', 'filterByTenants'],
      },
      fieldName: 'tenantsIds',
      label: $t('tb.notification.recipient.form.tenants'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadTenantProfileOptions,
        mode: 'multiple',
        showSearch: true,
        style: { width: '100%' },
      },
      dependencies: {
        if: (values) =>
          isSysAdmin &&
          values.type === PLATFORM_USERS &&
          values.usersFilterType === TENANT_ADMINISTRATORS &&
          values.filterByTenants === 'tenantProfiles',
        triggerFields: ['type', 'usersFilterType', 'filterByTenants'],
      },
      fieldName: 'tenantProfilesIds',
      label: $t('tb.notification.recipient.form.tenantProfiles'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadCustomerOptions,
        showSearch: true,
        style: { width: '100%' },
      },
      dependencies: {
        if: (values) =>
          values.type === PLATFORM_USERS &&
          values.usersFilterType === CUSTOMER_USERS,
        triggerFields: ['type', 'usersFilterType'],
      },
      fieldName: 'customerId',
      label: $t('tb.notification.recipient.form.customer'),
      rules: 'selectRequired',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadUserOptions,
        mode: 'multiple',
        showSearch: true,
        style: { width: '100%' },
      },
      dependencies: {
        if: (values) =>
          values.type === PLATFORM_USERS &&
          values.usersFilterType === USER_LIST,
        triggerFields: ['type', 'usersFilterType'],
      },
      fieldName: 'usersIds',
      label: $t('tb.notification.recipient.form.users'),
      rules: 'required',
    },
    {
      component: 'Input',
      dependencies: {
        if: (values) => values.type === MICROSOFT_TEAMS,
        triggerFields: ['type'],
      },
      fieldName: 'webhookUrl',
      label: $t('tb.notification.recipient.form.webhookUrl'),
      rules: 'required',
    },
    {
      component: 'Input',
      dependencies: {
        if: (values) => values.type === MICROSOFT_TEAMS,
        triggerFields: ['type'],
      },
      fieldName: 'channelName',
      label: $t('tb.notification.recipient.form.channelName'),
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: { maxlength: 500, rows: 3 },
      fieldName: 'description',
      label: $t('tb.notification.recipient.form.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues();

    const configuration: NotificationTargetConfig = {
      description: values.description,
      type: values.type,
    };

    if (values.type === PLATFORM_USERS) {
      const usersFilter: NotificationUsersFilter = {
        type: values.usersFilterType,
      };
      switch (values.usersFilterType) {
        case CUSTOMER_USERS: {
          usersFilter.customerId = values.customerId;
          break;
        }
        case TENANT_ADMINISTRATORS: {
          if (isSysAdmin) {
            if (values.filterByTenants === 'tenantProfiles') {
              usersFilter.tenantProfilesIds = values.tenantProfilesIds;
            } else {
              usersFilter.tenantsIds = values.tenantsIds;
            }
          }
          break;
        }
        case USER_LIST: {
          usersFilter.usersIds = values.usersIds;
          break;
        }
        // No default
      }
      configuration.usersFilter = usersFilter;
    } else if (values.type === MICROSOFT_TEAMS) {
      configuration.channelName = values.channelName;
      configuration.useOldApi = record.value?.configuration?.useOldApi ?? true;
      configuration.webhookUrl = values.webhookUrl;
    }

    const target: NotificationTarget = {
      ...record.value,
      configuration,
      name: values.name,
    };

    modalApi.lock();
    try {
      await saveNotificationTarget(target);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ targetId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: data.targetId
        ? $t('tb.notification.recipient.actions.edit')
        : $t('tb.notification.recipient.actions.create'),
    });
    if (data.targetId) {
      const target = await getNotificationTargetById(data.targetId);
      record.value = target;
      const cfg = target.configuration;
      await formApi.setValues({
        channelName: cfg?.channelName,
        customerId: cfg?.usersFilter?.customerId,
        description: cfg?.description,
        filterByTenants: cfg?.usersFilter?.tenantProfilesIds
          ? 'tenantProfiles'
          : 'tenants',
        name: target.name,
        tenantProfilesIds: cfg?.usersFilter?.tenantProfilesIds,
        tenantsIds: cfg?.usersFilter?.tenantsIds,
        type: cfg?.type,
        usersFilterType: cfg?.usersFilter?.type,
        usersIds: cfg?.usersFilter?.usersIds,
        webhookUrl: cfg?.webhookUrl,
      });
    } else {
      record.value = {} as NotificationTarget;
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
