<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :label="t('tb.ruleChain.nodeAction.entityType')" name="originatorTypes" :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.entityTypeRequired') }]">
      <Select v-model:value="formState.originatorTypes" :options="entityTypeOptions" mode="multiple"> </Select>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'entity-type-filter',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { EntityType, ENTITY_TYPE_OPTIONS } from '/@/enums/entityTypeEnum';

  interface Configuration {
    originatorTypes: Array<EntityType>;
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const entityTypeOptions = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.TENANT ||
      item.value == EntityType.CUSTOMER ||
      item.value == EntityType.USER ||
      item.value == EntityType.DASHBOARD ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.DEVICE ||
      item.value == EntityType.RULE_CHAIN ||
      item.value == EntityType.RULE_NODE
    );
  });

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    originatorTypes: [EntityType.DEVICE],
  });

  watch(
    () => props.configuration,
    () => {
      formState.originatorTypes = props.configuration.originatorTypes;
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
