<template>
  <div class="delivery-method-slack">
    <Alert type="info" show-icon>
      <template #message>
        <p>输入字段支持模板化。 <a href="https://thingsboard.io/" target="_blank">查看文档</a></p>
      </template>
    </Alert>
    <BasicForm @register="registerForm" />
  </div>
</template>
<script lang="ts" setup name="DeliveryMethodSlackForm">
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStore } from '/@/store/modules/user';
  import { Alert } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const inputFormSchemas: FormSchema[] = [
    { field: 'method', component: 'Input', defaultValue: 'SLACK', show: false },
    { field: 'enabled', component: 'Checkbox', defaultValue: true, show: false },
    {
      label: t('  '),
      field: 'body',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 200,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
    colon: false,
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  async function setConfigFieldsValue(values: any) {
    await resetFields();
    await setFieldsValue(values);
  }

  defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });
</script>
<style lang="less">
  .delivery-method-slack {
  }
</style>
