<template>
  <div class="trigger-config-alarm-assignment">
    <BasicForm @register="registerForm" />
  </div>
</template>
<script lang="ts" setup name="TriggerConfigAlarmAssignment">
  import { isArray, isEmpty } from 'lodash-es';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ALARM_SEVERITY_OPTIONS, ALARM_STATUS_OPTIONS } from '/@/enums/alarmEnum';
  const { t } = useI18n('tb');

  const notifyOnOptions = [
    { value: 'ASSIGNED', label: '分配时' },
    { value: 'UNASSIGNED', label: '取消分配时' },
  ];

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.ALARM_ASSIGNMENT,
      show: false,
    },
    {
      label: t('报警类型'),
      subLabel: t('不选择为任意等级'),
      field: 'triggerConfig.alarmTypes',
      component: 'Select',
      componentProps: {
        options: [],
        mode: 'tags',
        open: false,
        placeholder: '任意报警类型',
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('报警等级'),
      subLabel: t('不选择为任意等级'),
      field: 'triggerConfig.alarmSeverities',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: ALARM_SEVERITY_OPTIONS,
        placeholder: '任意报警等级',
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('报警状态'),
      subLabel: t('不选择为任意状态'),
      field: 'triggerConfig.alarmStatuses',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: ALARM_STATUS_OPTIONS,
        placeholder: '任意报警状态',
      },

      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('何时报警'),
      field: 'triggerConfig.notifyOn',
      component: 'Select',
      defaultValue: ['ASSIGNED'],
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
    if (!isEmpty(data.triggerConfig.alarmTypes) && !isArray(data.triggerConfig.alarmTypes)) {
      data.triggerConfig.alarmTypes = data.triggerConfig.alarmTypes.split(',');
    }
    if (!isEmpty(data.triggerConfig.alarmSeverities) && !isArray(data.triggerConfig.alarmSeverities)) {
      data.triggerConfig.alarmSeverities = data.triggerConfig.alarmSeverities.split(',');
    }
    if (!isEmpty(data.triggerConfig.alarmStatuses) && !isArray(data.triggerConfig.alarmStatuses)) {
      data.triggerConfig.alarmStatuses = data.triggerConfig.alarmStatuses.split(',');
    }
    if (!isEmpty(data.triggerConfig.notifyOn) && !isArray(data.triggerConfig.notifyOn)) {
      data.triggerConfig.notifyOn = data.triggerConfig.notifyOn.split(',');
    }

    return data;
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  .trigger-config-alarm-assignment {
  }
</style>
