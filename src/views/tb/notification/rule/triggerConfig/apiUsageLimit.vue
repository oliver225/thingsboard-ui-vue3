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
    { value: 'ALARM', label: '报警' },
    { value: 'DB', label: '遥测持久化' },
    { value: 'RE', label: '规则引擎' },
    { value: 'TRANSPORT', label: 'Device API' },
    { value: 'EMAIL', label: '邮件信息' },
    { value: 'SMS', label: '短信信息' },
    { value: 'JS', label: 'JavaScript执行' },
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
      label: t('API接口'),
      subLabel: t('不选择是所有API接口'),
      field: 'triggerConfig.apiFeatures',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: apiFeaturesOptions,
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('何时报警'),
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
  .trigger-config-api-usage-limit {
  }
</style>
