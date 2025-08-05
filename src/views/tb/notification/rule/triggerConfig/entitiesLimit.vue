<template>
  <div class="trigger-config-entities-limit">
    <BasicForm @register="registerForm">
      <template #threshold="{ model, field }">
        <div class="flex">
          <Slider
            style="flex: 4 1 0%"
            v-model:value="model[field]"
            :min="0"
            :max="1"
            :step="0.01"
            :tip-formatter="(value: number) => `${Math.ceil(value * 100)}%`"
          />
          <InputNumber
            style="flex: 1 1 0%; margin-left: 12px"
            :default-value="0.8"
            v-model:value="model[field]"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </div>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="TriggerConfigEntitiesLimit">
  import { computed } from 'vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { EntityType, ENTITY_TYPE_OPTIONS } from '/@/enums/entityTypeEnum';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Slider, InputNumber } from 'ant-design-vue';
  import type { NamePath } from 'ant-design-vue/lib/form/interface';
  import { isArray, isEmpty } from 'lodash-es';
  const { t } = useI18n('tb');

  const entityTypeOptions = computed(() => {
    return ENTITY_TYPE_OPTIONS.filter((item) => {
      return (
        item.value == EntityType.DEVICE ||
        item.value == EntityType.ASSET ||
        item.value == EntityType.CUSTOMER ||
        item.value == EntityType.USER ||
        item.value == EntityType.DASHBOARD ||
        item.value == EntityType.RULE_CHAIN
      );
    });
  });

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'triggerConfig.triggerType',
      component: 'Input',
      defaultValue: NotificationType.ENTITIES_LIMIT,
      show: false,
    },
    {
      label: t('实体过滤'),
      subLabel: t('不选择是所有实体'),
      field: 'triggerConfig.entityTypes',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: entityTypeOptions,
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      labelWidth: 60,
      label: t('阈值'),
      defaultValue: 0.8,
      field: 'triggerConfig.threshold',
      component: 'Input',
      slot: 'threshold',
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
    if (!isEmpty(data.triggerConfig.entityTypes) && !isArray(data.triggerConfig.entityTypes)) {
      data.triggerConfig.entityTypes = data.triggerConfig.entityTypes.split(',');
    }
    return data;
  }

  defineExpose({ getFieldsValue, validate: validateTrigger, resetFields, setFieldsValue: setTriggerFieldsValue });
</script>
<style lang="less">
  .trigger-config-entities-limit {
  }
</style>
