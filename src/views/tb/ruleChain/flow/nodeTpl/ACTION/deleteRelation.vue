<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="deleteForSingleEntity" help="根据方向和类型删除传入消息的原始发件人与指定实体或实体列表的关系。">
      <Checkbox v-model:checked="formState.deleteForSingleEntity">删除与特定实体的关系</Checkbox>
    </Form.Item>
    <Form.Item label="方向" name="direction">
      <Select v-model:value="formState.direction">
        <Select.Option value="FROM">从</Select.Option>
        <Select.Option value="TO">到</Select.Option>
      </Select>
    </Form.Item>
    <Row :gutter="20">
      <Col :span="8">
        <Form.Item label="实体类型" name="entityType" :rules="[{ required: true, message: '实体类型必填!' }]">
          <Select v-model:value="formState.entityType" :options="entityTypeOptions"> </Select>
        </Form.Item>
      </Col>
      <Col :span="16">
        <Form.Item
          label="匹配名称"
          name="entityNamePattern"
          :rules="[{ required: true, message: '匹配名称称必填!' }]"
          help=" 使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。"
        >
          <Input v-model:value="formState.entityNamePattern" />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item
      label="匹配关系类型"
      name="relationType"
      :rules="[{ required: true, message: '关系类型必填!' }]"
      help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。"
    >
      <Input v-model:value="formState.relationType" />
    </Form.Item>

    <Form.Item
      label="实体缓存过期时间"
      name="entityCacheExpiration"
      :rules="[{ required: true, message: '实体缓存过期时间必填!' }]"
      help="指定存储找到的实体记录所允许的最大时间间隔。0值表示记录永远不会过期。"
    >
      <InputNumber
        v-model:value="formState.entityCacheExpiration"
        :min="0"
        :addon-after="'秒'"
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
