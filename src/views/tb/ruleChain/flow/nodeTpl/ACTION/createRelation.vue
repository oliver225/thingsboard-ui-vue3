<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :label="t('tb.ruleChain.nodeAction.direction')" name="direction">
      <Select v-model:value="formState.direction">
        <Select.Option value="FROM">{{ t('tb.ruleChain.nodeAction.directionFrom') }}</Select.Option>
        <Select.Option value="TO">{{ t('tb.ruleChain.nodeAction.directionTo') }}</Select.Option>
      </Select>
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.relationType')"
      name="relationType"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.relationTypeRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
    >
      <Input v-model:value="formState.relationType" />
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
      <template v-if="formState.entityType == EntityType.DEVICE || formState.entityType == EntityType.ASSET">
        <Col :span="8">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.namePattern')"
            name="entityNamePattern"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.namePatternRequired') }]"
          >
            <Input v-model:value="formState.entityNamePattern" />
          </Form.Item>
        </Col>
        <Col :span="8">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.typePattern')"
            name="entityTypePattern"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.typePatternRequired') }]"
          >
            <Input v-model:value="formState.entityTypePattern" />
          </Form.Item>
        </Col>
      </template>
      <template v-else>
        <Col :span="16">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.namePattern')"
            name="entityNamePattern"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.namePatternRequired') }]"
          >
            <Input v-model:value="formState.entityNamePattern" />
          </Form.Item>
        </Col>
      </template>
    </Row>
    <div class="text-sm font-light mb-4" style="margin-top: -20px">
      {{ t('tb.ruleChain.nodeAction.customerNamePatternHelp') }}
    </div>
    <Form.Item
      name="createEntityIfNotExists"
      v-if="formState.entityType == EntityType.DEVICE || formState.entityType == EntityType.ASSET"
      :help="t('tb.ruleChain.nodeAction.createNewEntityHelp')"
    >
      <Checkbox v-model:checked="formState.createEntityIfNotExists">{{
        t('tb.ruleChain.nodeAction.createNewEntity')
      }}</Checkbox>
    </Form.Item>
    <Form.Item name="removeCurrentRelations" :help="t('tb.ruleChain.nodeAction.removeCurrentRelationsHelp')">
      <Checkbox v-model:checked="formState.removeCurrentRelations">{{
        t('tb.ruleChain.nodeAction.removeCurrentRelations')
      }}</Checkbox>
    </Form.Item>
    <Form.Item
      name="changeOriginatorToRelatedEntity"
      :help="t('tb.ruleChain.nodeAction.changeOriginatorToRelatedEntityHelp')"
    >
      <Checkbox v-model:checked="formState.changeOriginatorToRelatedEntity">{{
        t('tb.ruleChain.nodeAction.changeOriginatorToRelatedEntity')
      }}</Checkbox>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'create-relation',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Input, Checkbox, Row, Col } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';

  interface Configuration {
    changeOriginatorToRelatedEntity: boolean;
    createEntityIfNotExists: boolean;
    direction: 'FROM' | 'TO';
    entityCacheExpiration: number;
    entityNamePattern: string;
    entityType: string;
    entityTypePattern: string;
    relationType: string;
    removeCurrentRelations: boolean;
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
    changeOriginatorToRelatedEntity: false,
    createEntityIfNotExists: false,
    direction: 'FROM',
    entityNamePattern: undefined,
    entityType: undefined,
    entityTypePattern: undefined,
    relationType: undefined,
    removeCurrentRelations: false,
  });

  watch(
    () => props.configuration,
    () => {
      formState.changeOriginatorToRelatedEntity = props.configuration.changeOriginatorToRelatedEntity;
      formState.createEntityIfNotExists = props.configuration.createEntityIfNotExists;
      formState.direction = props.configuration.direction;
      formState.entityNamePattern = props.configuration.entityNamePattern;
      formState.entityType = props.configuration.entityType;
      formState.entityTypePattern = props.configuration.entityTypePattern;
      formState.relationType = props.configuration.relationType;
      formState.removeCurrentRelations = props.configuration.removeCurrentRelations;
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
