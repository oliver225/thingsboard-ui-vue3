<template>
  <div class="trigger-config-api-usage-limit">
    <BasicForm @register="registerForm" />
  </div>
</template>
<script lang="ts" setup name="TriggerConfigApiUsageLimit">
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { isArray, isEmpty } from 'lodash-es';
  const { t } = useI18n('tb');

  const apiFeaturesOptions = [
    { value: 'ALARM', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.ALARM') },
    { value: 'DB', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.DB') },
    { value: 'RE', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.RE') },
    { value: 'TRANSPORT', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.TRANSPORT') },
    { value: 'EMAIL', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.EMAIL') },
    { value: 'SMS', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.SMS') },
    { value: 'JS', label: t('tb.notification.ruleTrigger.apiUsageLimit.feature.JS') },
  ];

  const notifyOnOptions = [
    { value: 'ENABLED', label: 'ENABLED' },
    { value: 'WARNING', label: 'WARNING' },
    { value: 'DISABLED', label: 'DISABLED' },
  ];

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.API_USAGE_LIMIT,
      show: false,
    },
    {
      label: t('tb.notification.ruleTrigger.apiUsageLimit.apiInterface'),
      subLabel: t('tb.notification.ruleTrigger.apiUsageLimit.anyApiInterface'),
      field: 'triggerConfig.apiFeatures',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: apiFeaturesOptions,
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.apiUsageLimit.notifyOn'),
      field: 'triggerConfig.notifyOn',
      component: 'Select',
      defaultValue: ['WARNING'],
      componentProps: {
        mode: 'multiple',
        options: notifyOnOptions,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.description'),
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

  async function validateTrigger(nameList?: NamePath[]) {
    let data = await validate(nameList);
    if (!isEmpty(data.triggerConfig.apiFeatures) && !isArray(data.triggerConfig.apiFeatures)) {
      data.triggerConfig.apiFeatures = data.triggerConfig.apiFeatures.split(',');
    }
    if (!isEmpty(data.triggerConfig.notifyOn) && !isArray(data.triggerConfig.notifyOn)) {
      data.triggerConfig.notifyOn = data.triggerConfig.notifyOn.split(',');
    }
    return data;
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  /* removed empty rule .trigger-config-api-usage-limit */
</style>
