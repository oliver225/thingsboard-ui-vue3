<template>
  <div class="trigger-config-alarm-comment">
    <BasicForm @register="registerForm">
      <template #onlyUserComments="{ model, field }">
        <div class="flex items-center mb-2">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">只有用户评论时通知</span>
        </div>
      </template>
      <template #notifyOnCommentUpdate="{ model, field }">
        <div class="flex items-center mb-2">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">评论更新时通知</span>
        </div>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="TriggerConfigAlarmComment">
  import { isArray, isEmpty } from 'lodash-es';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Switch } from 'ant-design-vue';
  import { ALARM_SEVERITY_OPTIONS, ALARM_STATUS_OPTIONS } from '/@/enums/alarmEnum';
  const { t } = useI18n('tb');

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.ALARM_COMMENT,
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
      field: 'triggerConfig.onlyUserComments',
      component: 'Switch',
      defaultValue: false,
      slot: 'onlyUserComments',
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'triggerConfig.notifyOnCommentUpdate',
      component: 'Switch',
      defaultValue: false,
      slot: 'notifyOnCommentUpdate',
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

    return data;
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  .trigger-config-alarm-comment {
  }
</style>
