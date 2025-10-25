<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.originatorSource')"
      name="originatorSource"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.originatorSourceRequired') }]"
    >
      <Select v-model:value="formState.originatorSource" @change="handleOriginatorSourceChange">
        <Select.Option value="CUSTOMER">{{ t('tb.ruleChain.nodeAction.customer') }}</Select.Option>
        <Select.Option value="TENANT">{{ t('tb.ruleChain.nodeAction.tenant') }}</Select.Option>
        <Select.Option value="RELATED">{{ t('tb.ruleChain.nodeAction.related') }}</Select.Option>
        <Select.Option value="ALARM_ORIGINATOR">{{ t('tb.ruleChain.nodeAction.alarmOriginator') }}</Select.Option>
        <Select.Option value="ENTITY">{{ t('tb.ruleChain.nodeAction.entityNameMatching') }}</Select.Option>
      </Select>
    </Form.Item>
    <div
      class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4"
      v-if="formState.originatorSource == OriginatorSource.RELATED"
    >
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.relationQuery') }}</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.direction')" name="formState.relationsQuery.direction">
              <Select v-model:value="formState.relationsQuery.direction">
                <Select.Option value="FROM">{{ t('tb.ruleChain.nodeAction.fromOriginator') }}</Select.Option>
                <Select.Option value="TO">{{ t('tb.ruleChain.nodeAction.toOriginator') }}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.level')" name="formState.relationsQuery.maxLevel">
              <Input v-model:value="formState.relationsQuery.maxLevel" />
            </Form.Item>
          </Col>
        </Row>
      </div>
      <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
        <Form.Item :label="t('tb.ruleChain.nodeAction.relationFilters')" name="relationsQuery">
          <Table class="mapping-table">
            <tr class="header">
              <th>{{ t('tb.ruleChain.nodeAction.relationType') }}</th>
              <th>{{ t('tb.ruleChain.nodeAction.entityType') }}</th>
            </tr>
            <tr class="content" v-for="(item, index) in formState.relationsQuery.filters" :key="index">
              <td class="py-2 px-4">
                <Input v-model:value="item.relationType" :placeholder="t('tb.ruleChain.nodeAction.anyType')" />
              </td>
              <td>
                <Select
                  name="originatorTypes"
                  v-model:value="item.entityTypes"
                  :options="allowedEntityTypes"
                  :placeholder="t('tb.ruleChain.nodeAction.entityType')"
                  mode="multiple"
                />
              </td>
              <td>
                <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
                  <Icon
                    :icon="'ant-design:delete-outlined'"
                    :size="20"
                    color="red"
                    class="cursor-pointer"
                    @click="handleDeleteFilter(index)"
                  />
                </Tooltip>
              </td>
            </tr>
          </Table>
          <Button class="my-4" type="primary" @click="handleAddFilter">{{
            t('tb.ruleChain.nodeAction.addFilter')
          }}</Button>
        </Form.Item>
      </div>
    </div>
    <div
      class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4"
      v-if="formState.originatorSource == OriginatorSource.ENTITY"
    >
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.entityNameMatchingPattern') }}</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.type')" name="entityType">
              <Select v-model:value="formState.entityType">
                <Select.Option value="DEVICE">{{ t('tb.entity.device') }}</Select.Option>
                <Select.Option value="ASSET">{{ t('tb.entity.asset') }}</Select.Option>
                <Select.Option value="ENTITY_VIEW">{{ t('tb.entity.entityView') }}</Select.Option>
                <Select.Option value="USER">{{ t('tb.entity.user') }}</Select.Option>
                <Select.Option value="EDGE">{{ t('tb.entity.edge') }}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.namePattern')" name="entityNamePattern">
              <Input v-model:value="formState.entityNamePattern" />
            </Form.Item>
          </Col>
        </Row>
        <Alert type="success" :message="t('tb.ruleChain.nodeAction.namePatternHelp')" />
      </div>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'change-originator',
  });
</script>

<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Button, Select, Row, Col, Input, Alert } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { OriginatorSource, EntityType, ENTITY_TYPE_OPTIONS } from '/@/enums/entityTypeEnum';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    entityNamePattern: any;
    entityType: any;
    originatorSource: 'CUSTOMER' | 'TENANT' | 'RELATED' | 'ALARM_ORIGINATOR' | 'ENTITY';
    relationsQuery: {
      direction: string;
      fetchLastLevelOnly: boolean;
      filters: [];
      maxLevel: number;
    };
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const allowedEntityTypes = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.TENANT ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.USER ||
      item.value == EntityType.EDGE
    );
  });

  function handleAddFilter() {
    formState.relationsQuery.filters.push({ relationType: 'Contains', entityTypes: [] });
  }

  function handleDeleteFilter(index: number) {
    formState.relationsQuery.filters.splice(index, 1);
  }

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    entityNamePattern: null,
    entityType: null,
    originatorSource: 'CUSTOMER',
    relationsQuery: {
      direction: 'FROM',
      fetchLastLevelOnly: false,
      filters: [{ relationType: '', entityTypes: [] }],
      maxLevel: 1,
    },
  });

  watch(
    () => props.configuration,
    () => {
      formState.entityNamePattern = props.configuration.entityNamePattern;
      formState.entityType = props.configuration.entityType;
      formState.originatorSource = props.configuration.originatorSource;
      formState.relationsQuery = props.configuration.relationsQuery;
    },
    { immediate: true },
  );

  async function handleOriginatorSourceChange(originatorSource) {
    switch (originatorSource) {
      case OriginatorSource.RELATED:
        formState.relationsQuery.filters = [{ relationType: 'Contains', entityTypes: [] }];
        break;
      case OriginatorSource.ENTITY:
        formState.entityNamePattern = '';
        formState.entityType = [];
        break;
    }
  }

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
