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
    { value: 'ASSIGNED', label: t('tb.notification.ruleTrigger.alarmAssignment.assigned') },
    { value: 'UNASSIGNED', label: t('tb.notification.ruleTrigger.alarmAssignment.unassigned') },
  ];

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.ALARM_ASSIGNMENT,
      show: false,
    },
    {
      label: t('tb.notification.ruleTrigger.alarm.alarmType'),
      subLabel: t('tb.notification.ruleTrigger.selectAny'),
      field: 'triggerConfig.alarmTypes',
      component: 'Select',
      componentProps: {
        options: [],
        mode: 'tags',
        open: false,
        placeholder: t('tb.notification.ruleTrigger.alarm.anyAlarmType'),
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.alarm.alarmSeverity'),
      subLabel: t('tb.notification.ruleTrigger.selectAny'),
      field: 'triggerConfig.alarmSeverities',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: ALARM_SEVERITY_OPTIONS,
        placeholder: t('tb.notification.ruleTrigger.alarm.anyAlarmSeverity'),
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.alarm.alarmStatus'),
      subLabel: t('tb.notification.ruleTrigger.selectAny'),
      field: 'triggerConfig.alarmStatuses',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: ALARM_STATUS_OPTIONS,
        placeholder: t('tb.notification.ruleTrigger.alarm.anyAlarmStatus'),
      },

      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.ruleTrigger.alarm.notifyOn'),
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
  /* removed empty rule .trigger-config-alarm-assignment */
</style>
