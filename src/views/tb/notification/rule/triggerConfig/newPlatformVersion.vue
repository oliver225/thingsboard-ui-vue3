<template>
  <div class="trigger-config-entities-limit">
    <BasicForm @register="registerForm" />
  </div>
</template>
<script lang="ts" setup name="TriggerConfigNewPlatformVersion">
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.NEW_PLATFORM_VERSION,
      show: false,
    },
    {
      label: t('描述信息'),
      field: 'additionalConfig.description',
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

  async function setTriggerFieldsValue(values: any) {
    await resetFields();
    await setFieldsValue(values);
  }

  defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  .trigger-config-entities-limit {
  }
</style>
