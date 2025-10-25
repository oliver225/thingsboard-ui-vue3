<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="40%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #defaultDashboardFullscreen="{ model, field }">
        <Checkbox v-model:checked="model[field]">{{ t('tb.user.form.defaultDashboardFullscreen') }}</Checkbox>
      </template>
      <template #homeDashboardHideToolbar="{ model, field }">
        <Checkbox v-model:checked="model[field]">{{ t('tb.user.form.homeDashboardHideToolbar') }}</Checkbox>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbTenantAdminForm">
  import { ref, unref, computed, h } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { tenantDashboardList } from '/@/api/tb/dashboard';
  import { UserInfo } from '/#/store';
  import { getProxyActivationLink, getUserById, saveUser } from '/@/api/tb/user';
  import { copyToClipboard } from '/@/utils';
  import { Checkbox } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<UserInfo>({} as UserInfo);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.user.admin.action.edit') : t('tb.user.admin.action.add'),
  }));

  const inputFormSchemas: FormSchema[] = [
    { field: 'authority', component: 'Input', show: false },
    { field: 'tenantId', component: 'Input', show: false },
    {
      label: t('tb.user.form.email'),
      field: 'email',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: [
        { required: true, message: t('tb.user.form.emailRequired') },
        { type: 'email', message: t('tb.user.form.emailRule') },
      ],
    },
    {
      label: t('tb.user.form.firstName'),
      field: 'firstName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
    },
    {
      label: t('tb.user.form.lastName'),
      field: 'lastName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
    },
    {
      label: t('tb.user.form.phone'),
      field: 'phone',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      rules: [{ pattern: /^(1[3-9]\d{9}|09\d{8})$/, message: t('tb.user.form.phoneRule') }],
    },

    {
      label: t('tb.user.form.description'),
      field: 'additionalInfo.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
    },
    {
      label: t('tb.user.form.activationMethod'),
      field: 'sendActivationMail',
      component: 'Select',
      defaultValue: 'false',
      componentProps: {
        options: [
          { label: t('tb.user.form.activationShowLink'), value: 'false' },
          { label: t('tb.user.form.activationSendMail'), value: 'true' },
        ],
      },
      ifShow: () => !record.value?.id?.id,
    },
    {
      label: t('tb.user.form.defaultDashboard'),
      field: 'additionalInfo.defaultDashboardId',
      component: 'Select',
      componentProps: {
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.title, value: item.id.id };
        },
        api: (args: any) => tenantDashboardList(args, record.value.tenantId.id),
      },
      colProps: { lg: 18, md: 18 },
      ifShow: () => !!record.value?.id?.id,
    },
    {
      field: 'additionalInfo.defaultDashboardFullscreen',
      slot: 'defaultDashboardFullscreen',
      component: 'Checkbox',
      colProps: { lg: 6, md: 6 },
      ifShow: () => !!record.value?.id?.id,
    },
    {
      label: t('tb.user.form.homeDashboard'),
      field: 'additionalInfo.homeDashboardId',
      component: 'Select',
      componentProps: {
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.title, value: item.id.id };
        },
        api: (args: any) => tenantDashboardList(args, record.value.tenantId.id),
      },
      ifShow: () => !!record.value?.id?.id,
      colProps: { lg: 18, md: 18 },
    },
    {
      field: 'additionalInfo.homeDashboardHideToolbar',
      slot: 'homeDashboardHideToolbar',
      component: 'Checkbox',
      colProps: { lg: 6, md: 6 },
      ifShow: () => !!record.value?.id?.id,
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as UserInfo;
    await resetFields();
    if (data?.id?.id) {
      const res = await getUserById(data.id.id);
      record.value = (res || {}) as UserInfo;
    }

    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });

      // console.log('submit', params, data, record);
      const res = await saveUser({ ...data, id: record.value.id }, data.sendActivationMail);
      showMessage(record.value.id?.id ? t('tb.user.admin.action.editSuccess') : t('tb.user.admin.action.addSuccess'));
      if (!record.value.id?.id && data.sendActivationMail == 'false') {
        const activationLink = await getProxyActivationLink(res.id.id);
        createConfirm({
          iconType: 'success',
          icon: () => h(Icon, { icon: 'ant-design:info-circle-filled', style: { color: 'blue' } }),
          title: t('tb.user.action.activationLink'),
          content: h('a', { href: activationLink, target: '_blank' }, `${activationLink}`),
          width: '50%',
          okText: t('common.okText'),
          cancelText: t('common.copyText'),
          maskClosable: false,
          onCancel: () => copyToClipboard(activationLink, t('tb.user.action.copyActivationLinkSuccess')),
        });
      }
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
</script>
