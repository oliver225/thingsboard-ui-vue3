<template>
  <div class="trigger-config-entity-action">
    <BasicForm @register="registerForm">
      <template #created="{ model, field }">
        <div class="flex items-center">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">创建后</span>
        </div>
      </template>
      <template #updated="{ model, field }">
        <div class="flex items-center">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">更新后</span>
        </div>
      </template>
      <template #deleted="{ model, field }">
        <div class="flex items-center">
          <Switch size="small" v-model:checked="model[field]" /> <span class="ml-2">删除后</span>
        </div>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="TriggerConfigEntityAction">
  import { isArray, isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';
  import { Switch } from 'ant-design-vue';

  const { t } = useI18n('tb');

  const entityTypeOptions = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.TENANT ||
      item.value == EntityType.CUSTOMER ||
      item.value == EntityType.USER ||
      item.value == EntityType.DASHBOARD ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.DEVICE ||
      item.value == EntityType.DEVICE_PROFILE ||
      item.value == EntityType.ASSET_PROFILE ||
      item.value == EntityType.ALARM ||
      item.value == EntityType.RULE_CHAIN ||
      item.value == EntityType.RULE_NODE ||
      item.value == EntityType.EDGE ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.WIDGETS_BUNDLE ||
      item.value == EntityType.TB_RESOURCE ||
      item.value == EntityType.OTA_PACKAGE ||
      item.value == EntityType.NOTIFICATION_RULE ||
      item.value == EntityType.NOTIFICATION_TARGET ||
      item.value == EntityType.NOTIFICATION_TEMPLATE
    );
  });

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.DEVICE_ACTIVITY,
      show: false,
    },
    {
      label: t('实体类型'),
      field: 'triggerConfig.entityTypes',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: entityTypeOptions,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('状态'),
      labelWidth: 120,
      field: 'triggerConfig.created',
      component: 'Switch',
      defaultValue: true,
      slot: 'created',
      required: true,
      colProps: { lg: 8, md: 8 },
    },
    {
      field: 'triggerConfig.updated',
      component: 'Switch',
      defaultValue: false,
      slot: 'updated',
      required: true,
      colProps: { lg: 6, md: 6 },
    },
    {
      field: 'triggerConfig.deleted',
      component: 'Switch',
      defaultValue: false,
      slot: 'deleted',
      required: true,
      colProps: { lg: 8, md: 8 },
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
    if (!isEmpty(data.triggerConfig.entityTypes) && !isArray(data.triggerConfig.entityTypes)) {
      data.triggerConfig.entityTypes = data.triggerConfig.entityTypes.split(',');
    }

    return data;
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  .trigger-config-entity-action {
  }
</style>
