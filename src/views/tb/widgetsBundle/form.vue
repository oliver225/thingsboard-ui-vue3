<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="WidgetBundleForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { WidgetsBundle, getWidgetsBundleById, saveWidgetsBundle } from '/@/api/tb/widgetsBundle';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<WidgetsBundle>({} as WidgetsBundle);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑部件包') : t('新增部件包'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('标题'),
      field: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('描述信息'),
      field: 'description',
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
    record.value = { ...data } as WidgetsBundle;
    await resetFields();
    if (data?.id?.id) {
      const res = await getWidgetsBundleById(data.id.id);
      record.value = (res || {}) as WidgetsBundle;
    }
    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });

      // console.log('submit', params, data, record);
      const res = await saveWidgetsBundle({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}部件包成功！`);
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
