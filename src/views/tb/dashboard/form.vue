<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @ok="handleSubmit"
    width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #mobileHide="{ model, field }">
        <div class="ml-4 flex items-center space-x-2">
          <Switch v-model:checked="model[field]" size="small" />
          <span>{{ t('tb.dashboard.form.mobileHide') }}</span>
        </div>
      </template>
      <template #imageInput="{ model, field }">
        <ImageUrlInput v-model:value="model[field]" />
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDashboardForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { Switch } from 'ant-design-vue';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import { Dashboard, getDashboardById, saveDashboard } from '/@/api/tb/dashboard';
  import ImageUrlInput from '/@/views/tb/images/ImageUrlInput.vue';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<Dashboard>({} as Dashboard);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.dashboard.action.edit') : t('tb.dashboard.action.add'),
  }));

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo.tenantId, show: false },
    {
      label: t('tb.dashboard.form.name'),
      field: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
    },
    {
      label: t('tb.dashboard.form.description'),
      field: 'configuration.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
    },
    {
      field: 'mobileHide',
      component: 'Checkbox',
      defaultValue: false,
      slot: 'mobileHide',
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('tb.dashboard.form.mobileOrder'),
      field: 'mobileOrder',
      component: 'InputNumber',
      componentProps: {
        precision: 0,
      },
    },
    {
      label: t('图片'),
      field: 'image',
      component: 'Input',
      slot: 'imageInput',
    },
    //image
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as Dashboard;
    await resetFields();
    if (data?.id?.id) {
      const res = await getDashboardById(data.id.id);
      record.value = (res || {}) as Dashboard;
    }
    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      // console.log('submit', params, data, record);
      const res = await saveDashboard({ ...data, id: record.value.id });
      showMessage(record.value.id?.id ? t('tb.dashboard.action.editSuccess') : t('tb.dashboard.action.addSuccess'));
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
