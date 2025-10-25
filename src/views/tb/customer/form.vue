<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbCustomerForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useCascaderAreaData } from '@vant/area-data';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Customer, getCustomerById, saveCustomer } from '/@/api/tb/customer';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<Customer>({} as Customer);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.customer.action.edit') : t('tb.customer.action.add'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('tb.customer.table.name'),
      field: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'tenantProfileId.entityType',
      component: 'Input',
      show: false,
      componentProps: {
        value: EntityType.TENANT_PROFILE,
      },
    },
    {
      label: t('tb.customer.form.phone'),
      field: 'phone',
      component: 'Input',
      required: true,
      rules: [{ pattern: /^(1[3-9]\d{9}|09\d{8})$/, message: t('tb.customer.form.phoneRule') }],
    },
    {
      label: t('tb.customer.table.zip'),
      field: 'zip',
      component: 'Input',
    },
    {
      label: t('tb.customer.table.email'),
      field: 'email',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      colProps: { lg: 24, md: 24 },
      rules: [{ type: 'email', message: t('tb.customer.form.emailRule') }],
    },
    {
      label: t('tb.customer.form.area'),
      field: 'areaList',
      component: 'Cascader',
      componentProps: {
        options: useCascaderAreaData(),
        fieldNames: { label: 'text', value: 'value', children: 'children' },
      },
      rules: [{ required: true, message: t('tb.customer.form.areaRule') }],
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.customer.table.address'),
      field: 'address',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.customer.table.address2'),
      field: 'address2',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('tb.customer.table.description'),
      field: 'additionalInfo.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as Customer;
    await resetFields();
    if (data?.id?.id) {
      const res = await getCustomerById(data.id.id);
      record.value = (res || {}) as Customer;
      record.value.areaList = [record.value.state, record.value.city, record.value.country];
    }
    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      data.state = data.areaList[0];
      data.city = data.areaList[1];
      data.country = data.areaList[2];
      // console.log('submit', params, data, record);
      const res = await saveCustomer({ ...data, id: record.value.id });
      showMessage(record.value.id?.id ? t('tb.customer.action.editSuccess') : t('tb.customer.action.addSuccess'));
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
