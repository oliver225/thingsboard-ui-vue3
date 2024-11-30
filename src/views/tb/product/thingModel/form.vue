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
    <BasicForm @register="registerForm">
      <template #enumSpecs="{ model, field }">
        <CodeEditor v-model:value="model[field]" class="border border-solid border-gray-400" />
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbProductThingModelForm">
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { CodeEditor } from '/@/components/CodeEditor';
  import { ref, unref, computed } from 'vue';
  import { router } from '/@/router';
  import { useUserStore } from '/@/store/modules/user';
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
  import { saveFunction } from '/@/api/tb/thingsModel';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const userStore = useUserStore();
  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const record = ref<any>({});

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.identifier ? t('编辑功能') : t('新增功能'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'tenantId',
      component: 'Input',
      defaultValue: userStore.getUserInfo.tenantId,
      show: false,
    },
    {
      field: 'deviceProfileId.entityType',
      component: 'Input',
      defaultValue: EntityType.DEVICE_PROFILE,
      show: false,
    },
    {
      field: 'deviceProfileId.id',
      component: 'Input',
      show: false,
    },
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
      field: 'dataType.specs.min',
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
      dynamicRules: ({ values }) => {
        return [
          {
            validator: (_, value) => validateSpecsMin(values, value),
            trigger: ['change', 'blur'],
          },
        ];
      },
    },
    {
      label: t('取值范围（最大值）'),
      field: 'dataType.specs.max',
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
      dynamicRules: ({ values }) => {
        return [
          {
            validator: (_, value) => validateSpecsMax(values, value),
            trigger: ['change', 'blur'],
          },
        ];
      },
    },
    {
      label: t('步长'),
      field: 'dataType.specs.step',
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
      field: 'dataType.specs.unit',
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
      field: 'dataType.specs.unitName',
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
      field: 'dataType.specs.length',
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
      label: t('布尔值(true)'),
      field: 'dataType.specs.trueValue',
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
      field: 'dataType.specs.falseValue',
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
      label: t('枚举项'),
      subLabel: `{"Key1":label1, "key2":label2}`,
      field: 'dataType.specs',
      component: 'Input',
      slot: 'enumSpecs',
      ifShow: ({ values }) => {
        return values.type === FunctionType.property && values['dataType.type'] == DataType.enum;
      },
      colProps: { lg: 24, md: 24 },
      dynamicRules: ({ values }) => {
        return [
          { required: true, message: '请输入枚举值', trigger: 'blur' },
          {
            validator: (_, value) => validateEnumSpces(values, value),
            trigger: ['change', 'blur'],
          },
        ];
      },
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
    record.value = {
      type: 'property',
      ...data,
    };
    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  function clear() {
    record.value = { type: 'property' };
  }

  function validateSpecsMax(values: any, maxValue: number) {
    const minValue = values[`dataType.specs.min`] as number;
    if (maxValue && minValue) {
      if (minValue >= maxValue) {
        return Promise.reject(`最大值不能小于最小值`);
      }
    }

    return Promise.resolve();
  }

  function validateSpecsMin(values: any, minValue: number) {
    const maxValue = values[`dataType.specs.max`] as number;
    if (minValue && maxValue) {
      if (minValue >= maxValue) {
        return Promise.reject(`最小值不能大于最大值`);
      }
    }

    return Promise.resolve();
  }

  async function validateEnumSpces(values: any, specs: string) {
    try {
      const conf = JSON.parse(specs);
      await setFieldsValue({ ...getFieldsValue(), 'dataType.specs': conf });
      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject(`请输入JSON格式数据`);
    }
  }

  async function handleSubmit() {
    try {
      const data = await validate();
      console.log(data);
      setModalProps({ confirmLoading: true });
      const res = await saveFunction(data);
      emit('success', res);
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
