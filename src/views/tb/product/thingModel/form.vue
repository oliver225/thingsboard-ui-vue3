<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @ok="handleSubmit"
    width="30%"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbProductThingModelForm">
  import {} from 'ant-design-vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ref, unref, computed } from 'vue';
  import { router } from '/@/router';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import {
    DATA_TYPE_OPTIONS,
    FunctionType,
    FUNCTION_TYPE_OPTIONS,
    DataType,
  } from '/@/enums/thingsModelEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const record = ref<any>({});

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑功能') : t('新增功能'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('功能类型'),
      field: 'type',
      component: 'RadioButtonGroup',
      componentProps: {
        options: FUNCTION_TYPE_OPTIONS,
        defaultValue: 'property',
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('功能名称'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 24,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('功能标识符'),
      field: 'identifier',
      component: 'Input',
      componentProps: {
        maxlength: 24,
      },
      rules: [
        { required: true, message: '请输入功能标识符!' },
        {
          pattern: /^[a-zA-Z0-9_-]*$/,
          message: '功能标识符只能包含字母数字和 _、-',
          trigger: ['change', 'blur'],
        },
      ],
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('数据类型'),
      field: 'dataType.type',
      component: 'Select',
      componentProps: {
        options: DATA_TYPE_OPTIONS,
      },
      ifShow: ({ values }) => values.type === FunctionType.property,
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('取值范围（最小值）'),
      field: 'specs.min',
      component: 'InputNumber',
      componentProps: {
        maxlength: 24,
        style: 'width: calc(90%)',
      },
      ifShow: ({ values }) => {
        return (
          values.type === FunctionType.property &&
          (values['dataType.type'] == DataType.int ||
            values['dataType.type'] == DataType.float ||
            values['dataType.type'] == DataType.double)
        );
      },
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('取值范围（最大值）'),
      field: 'specs.max',
      component: 'InputNumber',
      componentProps: {
        maxlength: 24,
      },
      ifShow: ({ values }) => {
        return (
          values.type === FunctionType.property &&
          (values['dataType.type'] == DataType.int ||
            values['dataType.type'] == DataType.float ||
            values['dataType.type'] == DataType.double)
        );
      },
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('步长'),
      field: 'specs.step',
      component: 'InputNumber',
      componentProps: {
        min: 0,
      },
      ifShow: ({ values }) => {
        return (
          values.type === FunctionType.property &&
          (values['dataType.type'] == DataType.int ||
            values['dataType.type'] == DataType.float ||
            values['dataType.type'] == DataType.double)
        );
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('单位'),
      field: 'specs.unit',
      component: 'Input',
      componentProps: {
        maxlength: 24,
        style: 'width: calc(90%)',
      },
      ifShow: ({ values }) => {
        return (
          values.type === FunctionType.property &&
          (values['dataType.type'] == DataType.int ||
            values['dataType.type'] == DataType.float ||
            values['dataType.type'] == DataType.double)
        );
      },
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('单位表述'),
      field: 'specs.unitName',
      component: 'Input',
      componentProps: {
        maxlength: 24,
      },
      ifShow: ({ values }) => {
        return (
          values.type === FunctionType.property &&
          (values['dataType.type'] == DataType.int ||
            values['dataType.type'] == DataType.float ||
            values['dataType.type'] == DataType.double)
        );
      },
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('数据长度'),
      field: 'specs.length',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        defaultValue: '10240',
      },
      ifShow: ({ values }) => {
        return values.type === FunctionType.property && values['dataType.type'] == DataType.text;
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('元素个数'),
      field: 'specs.size',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        defaultValue: '10',
      },
      ifShow: ({ values }) => {
        return values.type === FunctionType.property && values['dataType.type'] == DataType.array;
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('布尔值(true)'),
      field: 'specs.trueValue',
      component: 'Input',
      componentProps: {
        placeholder: '如: 开',
        style: 'width: calc(90%)',
      },
      ifShow: ({ values }) => {
        return values.type === FunctionType.property && values['dataType.type'] == DataType.bool;
      },
      required: true,
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('布尔值(false)'),
      field: 'specs.falseValue',
      component: 'Input',
      componentProps: {
        placeholder: '如: 关',
        style: 'width: calc(90%)',
      },
      ifShow: ({ values }) => {
        return values.type === FunctionType.property && values['dataType.type'] == DataType.bool;
      },
      required: true,
      colProps: { lg: 12, md: 12 },
    },
    {
      label: t('读写类型'),
      field: 'accessMode',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '读写', value: 'rw' },
          { label: '只读', value: 'r' },
        ],
        defaultValue: 'rw',
      },
      ifShow: ({ values }) => values.type === FunctionType.property,
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('调用方式'),
      field: 'callType',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '异步', value: 'async' },
          { label: '同步', value: 'sync' },
        ],
        defaultValue: 'async',
      },
      ifShow: ({ values }) => values.type === FunctionType.service,
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('功能描述'),
      field: 'desc',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    record.value = { type: 'property', ...data };
    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  function clear() {
    record.value = { type: 'property' };
  }

  async function handleSubmit() {
    try {
      const data = await validate();
      console.log(data);
      setModalProps({ confirmLoading: true });
      emit('success', data);
      setTimeout(closeModal);
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
