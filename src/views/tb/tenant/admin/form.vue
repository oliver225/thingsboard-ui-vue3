<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="40%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #defaultDashboardFullscreen="{ model, field }">
        <Checkbox v-model:checked="model[field]">始终全屏</Checkbox>
      </template>
      <template #homeDashboardHideToolbar="{ model, field }">
        <Checkbox v-model:checked="model[field]">隐藏工具栏</Checkbox>
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
    value: record.value.id?.id ? t('编辑租户管理员') : t('新增租户管理员'),
  }));

  const inputFormSchemas: FormSchema[] = [
    { field: 'authority', component: 'Input', show: false },
    { field: 'tenantId', component: 'Input', show: false },
    {
      label: t('邮箱地址'),
      field: 'email',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: [
        { required: true, message: t('邮箱地址必须输入') },
        { type: 'email', message: t('请填写正确的邮箱地址') },
      ],
    },
    {
      label: t('用户姓名'),
      field: 'firstName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
    },
    {
      label: t('用户职务'),
      field: 'lastName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
    },
    {
      label: t('手机号码'),
      field: 'phone',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      rules: [
        { required: true, message: t('手机号码必须输入') },
        { pattern: /^1[3-9]\d{9}$/, message: t('请填写正确的手机号码') },
      ],
    },

    {
      label: t('描述信息'),
      field: 'additionalInfo.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
    },
    {
      label: t('激活方式'),
      field: 'sendActivationMail',
      component: 'Select',
      defaultValue: 'false',
      componentProps: {
        options: [
          { label: '显示激活链接', value: 'false' },
          { label: '发送激活邮件', value: 'true' },
        ],
      },
      ifShow: () => !record.value?.id?.id,
    },
    {
      label: t('默认仪表盘'),
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
      label: t('首页仪表盘'),
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
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}租户管理员成功！`);
      if (!record.value.id?.id && data.sendActivationMail == 'false') {
        const activationLink = await getProxyActivationLink(res.id.id);
        createConfirm({
          iconType: 'success',
          icon: () => h(Icon, { icon: 'ant-design:info-circle-filled', style: { color: 'blue' } }),
          title: '用户激活链接',
          content: h('a', { href: activationLink, target: '_blank' }, `${activationLink}`),
          width: '50%',
          okText: '确认',
          cancelText: '复制',
          maskClosable: false,
          onCancel: () => copyToClipboard(activationLink, '复制用户激活链接成功！'),
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
