<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #configurationType="{ model, field }">
        <Radio.Group v-model:value="model[field]" disabled style="width: 100%">
          <div class="grid grid-cols-2 gap-2 w-full">
            <template v-for="item in NOTIFICATION_RECIPIENT_TYPE_OPTIONS" :key="`${item.value}`">
              <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
                <Radio :value="item.value">
                  {{ item.label }}
                </Radio>
              </div>
            </template>
          </div>
        </Radio.Group>
      </template>
      <template #tenantEnable="{ model, field }">
        <div class="w-full flex">
          <Radio.Group
            v-model:value="model[field]"
            button-style="solid"
            style="margin: 1px auto"
            @change="handleTenantEnableChange"
          >
            <Radio.Button value="tenant">&nbsp;&nbsp;租&nbsp;&nbsp;户&nbsp;&nbsp; </Radio.Button>
            <Radio.Button value="tenantProfile">租户配置</Radio.Button>
          </Radio.Group>
        </div>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbRecipientForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { Radio } from 'ant-design-vue';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { NotificationTarget, getNotificationTargetById, saveNotificationTarget } from '/@/api/tb/notificationTarget';
  import {
    NotificationRecipientType,
    NotificationRecipientUsersFilter,
    NOTIFICATION_RECIPIENT_TYPE_OPTIONS,
    NOTIFICATION_RECIPIENT_USER_FILTER_OPTIONS,
  } from '/@/enums/notificationEnum';
  import { Authority } from '/@/enums/authorityEnum';
  import { tenantList } from '/@/api/tb/tenant';
  import { tenantProfileInfoList } from '/@/api/tb/tenantProfile';
  import { isArray, isEmpty } from 'lodash-es';
  import { customerList } from '/@/api/tb/customer';
  import { userList } from '/@/api/tb/user';
  import { usePermission } from '/@/hooks/web/usePermission';

  const emit = defineEmits(['success', 'register']);

  const { hasPermission } = usePermission();
  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<NotificationTarget>({} as NotificationTarget);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑通知接收组') : t('新增通知接收组'),
  }));
  const tenantId = userStore.getUserInfo?.tenantId || { EntityType: 'TENANT', id: '' };

  const usersFilterOptions = computed(() => {
    if (hasPermission(Authority.SYS_ADMIN)) {
      return NOTIFICATION_RECIPIENT_USER_FILTER_OPTIONS.filter((item) => {
        return (
          item.value == NotificationRecipientUsersFilter.ALL_USERS ||
          item.value == NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS ||
          item.value == NotificationRecipientUsersFilter.AFFECTED_TENANT_ADMINISTRATORS ||
          item.value == NotificationRecipientUsersFilter.SYSTEM_ADMINISTRATORS
        );
      });
    } else {
      return NOTIFICATION_RECIPIENT_USER_FILTER_OPTIONS.filter((item) => {
        return (
          item.value == NotificationRecipientUsersFilter.ALL_USERS ||
          item.value == NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS ||
          item.value == NotificationRecipientUsersFilter.CUSTOMER_USERS ||
          item.value == NotificationRecipientUsersFilter.USER_LIST ||
          item.value == NotificationRecipientUsersFilter.ORIGINATOR_ENTITY_OWNER_USERS ||
          item.value == NotificationRecipientUsersFilter.AFFECTED_USER
        );
      });
    }
  });

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: tenantId, show: false },
    {
      label: t('接收组名称'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('类型'),
      field: 'configuration.type',
      component: 'RadioGroup',
      defaultValue: NotificationRecipientType.PLATFORM_USERS,
      slot: 'configurationType',
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('筛选用户'),
      field: 'configuration.usersFilter.type',
      component: 'Select',
      defaultValue: NotificationRecipientUsersFilter.ALL_USERS,
      componentProps: {
        options: usersFilterOptions,
        onChange: handleUserFilterChange,
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'configuration.usersFilter.tenantEnable',
      component: 'RadioButtonGroup',
      defaultValue: 'tenant',
      slot: 'tenantEnable',
      colProps: { lg: 24, md: 24 },
      ifShow: false,
    },
    {
      field: 'configuration.usersFilter.tenantsIds',
      component: 'Select',
      componentProps: {
        placeholder: '请选择租户',
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.title, value: item.id.id };
        },
        api: tenantList,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'configuration.usersFilter.tenantProfilesIds',
      component: 'Select',
      componentProps: {
        placeholder: '请选择租户配置',
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: tenantProfileInfoList,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('客户'),
      field: 'configuration.usersFilter.customerId',
      component: 'Select',
      componentProps: {
        placeholder: '请选择客户',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.title, value: item.id.id };
        },
        api: customerList,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('选择用户'),
      field: 'configuration.usersFilter.usersIds',
      component: 'Select',
      componentProps: {
        placeholder: '请选择用户',
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'email', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.email, value: item.id.id };
        },
        api: userList,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('描述信息'),
      field: 'configuration.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as NotificationTarget;
    await resetFields();
    if (data?.id?.id) {
      const res = await getNotificationTargetById(data.id.id);
      record.value = (res || {}) as NotificationTarget;
    }
    if (
      NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS == record.value?.configuration?.usersFilter?.type &&
      hasPermission(Authority.SYS_ADMIN)
    ) {
      record.value.configuration.usersFilter.tenantEnable = isEmpty(
        record.value?.configuration?.usersFilter?.tenantsIds,
      )
        ? 'tenantProfile'
        : 'tenant';
    }

    updateSchema([
      {
        field: 'configuration.usersFilter.tenantEnable',
        defaultValue: 'tenant',
        ifShow:
          NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS == record.value?.configuration?.usersFilter?.type &&
          hasPermission(Authority.SYS_ADMIN),
      },
      {
        field: 'configuration.usersFilter.tenantsIds',
        ifShow:
          NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS == record.value?.configuration?.usersFilter?.type &&
          record.value?.configuration?.usersFilter?.tenantEnable == 'tenant',
      },
      {
        field: 'configuration.usersFilter.tenantProfilesIds',
        ifShow:
          NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS == record.value?.configuration?.usersFilter?.type &&
          record.value?.configuration?.usersFilter?.tenantEnable == 'tenantProfile',
      },
      {
        field: 'configuration.usersFilter.customerId',
        ifShow: NotificationRecipientUsersFilter.CUSTOMER_USERS == record.value?.configuration?.usersFilter?.type,
      },
      {
        field: 'configuration.usersFilter.usersIds',
        ifShow: NotificationRecipientUsersFilter.USER_LIST == record.value?.configuration?.usersFilter?.type,
      },
    ]);

    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      if (!isEmpty(data.configuration.usersFilter.tenantsIds) && !isArray(data.configuration.usersFilter.tenantsIds)) {
        data.configuration.usersFilter.tenantsIds = data.configuration.usersFilter.tenantsIds.split(',');
      }
      if (
        !isEmpty(data.configuration.usersFilter.tenantProfilesIds) &&
        !isArray(data.configuration.usersFilter.tenantProfilesIds)
      ) {
        data.configuration.usersFilter.tenantProfilesIds = data.configuration.usersFilter.tenantProfilesIds.split(',');
      }
      if (!isEmpty(data.configuration.usersFilter.usersIds) && !isArray(data.configuration.usersFilter.usersIds)) {
        data.configuration.usersFilter.usersIds = data.configuration.usersFilter.usersIds.split(',');
      }
      // console.log('submit', params, data, record);
      const res = await saveNotificationTarget({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}通知接收组成功！`);
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }

  async function handleUserFilterChange(value: string) {
    const record = getFieldsValue();
    const configuration = record.configuration;
    await setFieldsValue({
      ...record,
      configuration: {
        ...configuration,
        usersFilter: {
          tenantEnable: 'tenant',
          type: value,
        },
      },
    });
    updateSchema([
      {
        field: 'configuration.usersFilter.tenantEnable',
        defaultValue: 'tenant',
        ifShow: NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS == value && hasPermission(Authority.SYS_ADMIN),
      },
      {
        field: 'configuration.usersFilter.tenantsIds',
        ifShow: NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS == value && hasPermission(Authority.SYS_ADMIN),
      },
      {
        field: 'configuration.usersFilter.tenantProfilesIds',
        ifShow: false,
      },
      {
        field: 'configuration.usersFilter.customerId',
        ifShow: NotificationRecipientUsersFilter.CUSTOMER_USERS == value,
      },
      {
        field: 'configuration.usersFilter.usersIds',
        ifShow: NotificationRecipientUsersFilter.USER_LIST == value,
      },
    ]);
  }

  async function handleTenantEnableChange({ target: { value } }) {
    const record = getFieldsValue();
    const configuration = record.configuration;
    await setFieldsValue({
      ...record,
      configuration: {
        ...configuration,
        usersFilter: {
          tenantEnable: value,
          type: NotificationRecipientUsersFilter.TENANT_ADMINISTRATORS,
        },
      },
    });
    updateSchema([
      {
        field: 'configuration.usersFilter.tenantsIds',
        ifShow: value == 'tenant',
      },
      {
        field: 'configuration.usersFilter.tenantProfilesIds',
        ifShow: value == 'tenantProfile',
      },
    ]);
  }
</script>
