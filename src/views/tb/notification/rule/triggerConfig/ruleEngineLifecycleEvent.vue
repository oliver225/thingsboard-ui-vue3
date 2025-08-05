<template>
  <div class="trigger-config-rule-engine-lifecycle">
    <BasicForm @register="registerForm">
      <template #onlyRuleChainLifecycleFailures="{ model, field }">
        <div class="flex items-center mb-2">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">只有规则链失败的时候</span>
        </div>
      </template>
      <template #trackRuleNodeEvents="{ model, field }">
        <div class="flex items-center mb-2">
          <Switch size="small" v-model:checked="model[field]" @change="handleTrackRuleNodeChange" />
          <span class="ml-2">跟踪规则节点事件</span>
        </div>
      </template>
      <template #onlyRuleNodeLifecycleFailures="{ model, field }">
        <div class="flex items-center mb-2">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">只有规则节点失败的时候</span>
        </div>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="TriggerConfigRuleEngineLifecycle">
  import { ruleChainList } from '/@/api/tb/ruleChain';
  import { Switch } from 'ant-design-vue';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isArray, isEmpty } from 'lodash-es';
  const { t } = useI18n('tb');

  const eventOptions = [
    { value: 'STOPPED', label: '已停止' },
    { value: 'STARTED', label: '已开始' },
    { value: 'UPDATED', label: '已更新' },
  ];

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT,
      show: false,
    },
    {
      label: t('规则链'),
      field: 'trigger',
      component: 'FormGroup',
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('规则链'),
      subLabel: '不选默认为全部规则链',
      field: 'triggerConfig.ruleChains',
      component: 'Select',
      componentProps: {
        placeholder: '全部规则链',
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: (arg: any) => ruleChainList(arg, 'CORE'),
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('规则链事件'),
      subLabel: '不选默认为全部事件',
      field: 'triggerConfig.ruleChainEvents',
      component: 'Select',
      componentProps: {
        placeholder: '全部事件',
        mode: 'multiple',
        options: eventOptions,
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'triggerConfig.onlyRuleChainLifecycleFailures',
      component: 'Switch',
      defaultValue: false,
      slot: 'onlyRuleChainLifecycleFailures',
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('规则节点'),
      field: 'triggerConfig',
      component: 'FormGroup',
      colProps: { lg: 24, md: 24 },
    },

    {
      field: 'triggerConfig.trackRuleNodeEvents',
      component: 'Switch',
      defaultValue: false,
      slot: 'trackRuleNodeEvents',
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('规则节点事件'),
      subLabel: '不选默认为全部事件',
      field: 'triggerConfig.ruleNodeEvents',
      component: 'Select',
      componentProps: {
        placeholder: '全部事件',
        mode: 'multiple',
        options: eventOptions,
      },
      ifShow: false,
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'triggerConfig.onlyRuleNodeLifecycleFailures',
      component: 'Switch',
      defaultValue: false,
      slot: 'onlyRuleNodeLifecycleFailures',
      ifShow: false,
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
    handleTrackRuleNodeChange(values.triggerConfig.trackRuleNodeEvents || false);
  }

  async function validateTrigger(nameList?: NamePath[]) {
    let data = await validate(nameList);
    if (!isEmpty(data.triggerConfig.ruleChainEvents) && !isArray(data.triggerConfig.ruleChainEvents)) {
      data.triggerConfig.ruleChainEvents = data.triggerConfig.ruleChainEvents.split(',');
    }
    if (!isEmpty(data.triggerConfig.ruleNodeEvents) && !isArray(data.triggerConfig.ruleNodeEvents)) {
      data.triggerConfig.ruleNodeEvents = data.triggerConfig.ruleNodeEvents.split(',');
    }
    return data;
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });

  function handleTrackRuleNodeChange(value) {
    updateSchema([
      {
        field: 'triggerConfig.ruleNodeEvents',
        ifShow: value,
      },
      {
        field: 'triggerConfig.onlyRuleNodeLifecycleFailures',
        ifShow: value,
      },
    ]);
  }
</script>
<style lang="less">
  .trigger-config-rule-engine-lifecycle {
  }
</style>
