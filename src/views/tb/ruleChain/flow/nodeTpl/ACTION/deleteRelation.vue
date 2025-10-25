<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="deleteForSingleEntity" :help="t('tb.ruleChain.nodeAction.deleteForSingleEntityHelp')">
      <Checkbox v-model:checked="formState.deleteForSingleEntity">{{
        t('tb.ruleChain.nodeAction.deleteForSingleEntity')
      }}</Checkbox>
    </Form.Item>
    <Form.Item :label="t('tb.ruleChain.nodeAction.direction')" name="direction">
      <Select v-model:value="formState.direction">
        <Select.Option value="FROM">{{ t('tb.ruleChain.nodeAction.directionFrom') }}</Select.Option>
        <Select.Option value="TO">{{ t('tb.ruleChain.nodeAction.directionTo') }}</Select.Option>
      </Select>
    </Form.Item>
    <Row :gutter="20">
      <Col :span="8">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.entityType')"
          name="entityType"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.entityTypeRequired') }]"
        >
          <Select v-model:value="formState.entityType" :options="entityTypeOptions" />
        </Form.Item>
      </Col>
      <Col :span="16">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.namePattern')"
          name="entityNamePattern"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.namePatternRequired') }]"
          :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
        >
          <Input v-model:value="formState.entityNamePattern" />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.relationType')"
      name="relationType"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.relationTypeRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
    >
      <Input v-model:value="formState.relationType" />
    </Form.Item>

    <Form.Item
      :label="t('tb.ruleChain.nodeAction.entityCacheExpiration')"
      name="entityCacheExpiration"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.entityCacheExpirationRequired') }]"
      :help="t('tb.ruleChain.nodeAction.entityCacheExpirationHelp')"
    >
      <InputNumber
        v-model:value="formState.entityCacheExpiration"
        :min="0"
        :addon-after="t('tb.ruleChain.nodeAction.unitSecond')"
        :style="{ width: '100%' }"
      />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'delete-relation',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Input, InputNumber, Checkbox, Row, Col } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';

  interface Configuration {
    deleteForSingleEntity: boolean;
    direction: 'FROM' | 'TO';
    entityCacheExpiration: boolean;
    entityNamePattern: string;
    entityType: string;
    entityTypePattern: string;
    relationType: string;
  }

  const entityTypeOptions = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.DEVICE ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.TENANT ||
      item.value == EntityType.CUSTOMER ||
      item.value == EntityType.USER ||
      item.value == EntityType.DASHBOARD ||
      item.value == EntityType.EDGE
    );
  });

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    deleteForSingleEntity: true,
    direction: 'FROM',
    entityCacheExpiration: 300,
    entityNamePattern: undefined,
    entityType: undefined,
    entityTypePattern: undefined,
    relationType: undefined,
  });

  watch(
    () => props.configuration,
    () => {
      formState.deleteForSingleEntity = props.configuration.deleteForSingleEntity;
      formState.direction = props.configuration.direction;
      formState.entityCacheExpiration = props.configuration.entityCacheExpiration;
      formState.entityNamePattern = props.configuration.entityNamePattern;
      formState.entityType = props.configuration.entityType;
      formState.entityTypePattern = props.configuration.entityTypePattern;
      formState.relationType = props.configuration.relationType;
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
