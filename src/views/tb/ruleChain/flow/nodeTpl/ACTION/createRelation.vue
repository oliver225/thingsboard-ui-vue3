<template>
  <Form ref="formRef" :model="formState" layout="vertical">
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
      <template v-if="formState.entityType == EntityType.DEVICE || formState.entityType == EntityType.ASSET">
        <Col :span="8">
          <Form.Item
            label="匹配名称"
            name="entityNamePattern"
            :rules="[{ required: true, message: '匹配名称称必填!' }]"
          >
            <Input v-model:value="formState.entityNamePattern" />
          </Form.Item>
        </Col>
        <Col :span="8">
          <Form.Item label="匹配类型" name="entityTypePattern" :rules="[{ required: true, message: '匹配类型必填!' }]">
            <Input v-model:value="formState.entityTypePattern" />
          </Form.Item>
        </Col>
      </template>
      <template v-else>
        <Col :span="16">
          <Form.Item
            label="匹配名称"
            name="entityNamePattern"
            :rules="[{ required: true, message: '匹配名称称必填!' }]"
          >
            <Input v-model:value="formState.entityNamePattern" />
          </Form.Item>
        </Col>
      </template>
    </Row>
    <div class="text-sm font-light mb-4" style="margin-top: -20px">
      使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。
    </div>
    <Form.Item
      label="匹配关系类型"
      name="relationType"
      :rules="[{ required: true, message: '关系类型必填!' }]"
      help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。"
    >
      <Input v-model:value="formState.relationType" />
    </Form.Item>
    <Form.Item
      name="createEntityIfNotExists"
      v-if="formState.entityType == EntityType.DEVICE || formState.entityType == EntityType.ASSET"
      help="如果上面的实体集不存在，请创建一个新的实体集。"
    >
      <Checkbox v-model:checked="formState.createEntityIfNotExists">创建新实体；如果不存在</Checkbox>
    </Form.Item>
    <Form.Item name="removeCurrentRelations" help="根据方向和类型删除传入消息的原始发件人的当前关系。">
      <Checkbox v-model:checked="formState.removeCurrentRelations">删除当前关系</Checkbox>
    </Form.Item>
    <Form.Item name="changeOriginatorToRelatedEntity" help="用于将提交的消息作为来自另一个实体的消息进行处理。">
      <Checkbox v-model:checked="formState.changeOriginatorToRelatedEntity">将发起人变更为相关实体</Checkbox>
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
    name: 'create-relation',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Input, InputNumber, Checkbox, Row, Col } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
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
    entityCacheExpiration: 300,
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
      formState.entityCacheExpiration = props.configuration.entityCacheExpiration;
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
