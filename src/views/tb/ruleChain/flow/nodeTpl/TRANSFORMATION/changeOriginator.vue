<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item label="实体类型" name="originatorSource" :rules="[{ required: true, message: '实体类型必选!' }]">
      <Select v-model:value="formState.originatorSource" @change="handleOriginatorSourceChange">
        <Select.Option value="CUSTOMER">客户</Select.Option>
        <Select.Option value="TENANT">租户</Select.Option>
        <Select.Option value="RELATED">关系</Select.Option>
        <Select.Option value="ALARM_ORIGINATOR">发起者警报</Select.Option>
        <Select.Option value="ENTITY">实体名称匹配</Select.Option>
      </Select>
    </Form.Item>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4"
      v-if="formState.originatorSource == OriginatorSource.RELATED">
      <p class="text-base font-bold">关系查询</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
          <Form.Item label="方向" name="formState.relationsQuery.direction">
            <Select v-model:value="formState.relationsQuery.direction">
              <Select.Option value="FROM">从 发起者</Select.Option>
              <Select.Option value="TO">到 发起者</Select.Option>
            </Select>
          </Form.Item>
          </Col>
          <Col :span="12">
          <Form.Item label="层级" name="formState.relationsQuery.maxLevel">
            <Input v-model:value="formState.relationsQuery.maxLevel">
            </Input>
          </Form.Item>
          </Col>
        </Row>
      </div>
      <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
        <Form.Item label="关联筛选器" name="relationsQuery">
          <Table class="mapping-table">
            <tr class="header">
              <th>关联类型</th>
              <th>实体类型</th>
            </tr>
            <tr class="content" v-for="(item, index) in formState.relationsQuery.filters" :key="index">
              <td class="py-2 px-4">
                <Input v-model:value="item.relationType" placeholder="任何类型" />
              </td>
              <td>
                <Select name="originatorTypes" v-model:value="item.entityTypes" :options="allowedEntityTypes"
                  placeholder="设备类型" mode="multiple">
                </Select>
              </td>
              <td>
                <Tooltip title="删除" class="pl-4">
                  <Icon :icon="'ant-design:delete-outlined'" :size="20" color="red" class="cursor-pointer"
                    @click="handleDeleteFilter(index)" />
                </Tooltip>
              </td>
            </tr>
          </Table>
          <Button class="my-4" type="primary" @click="handleAddFilter">添加筛选器</Button>
        </Form.Item>
      </div>
    </div>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4"
      v-if="formState.originatorSource == OriginatorSource.ENTITY">
      <p class="text-base font-bold">实体名称匹配模式</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
          <Form.Item label="类型" name="entityType">
            <Select v-model:value="formState.entityType">
              <Select.Option value="DEVICE">设备</Select.Option>
              <Select.Option value="ASSET">资产</Select.Option>
              <Select.Option value="ENTITY_VIEW">实体视图</Select.Option>
              <Select.Option value="USER">用户</Select.Option>
              <Select.Option value="EDGE">边缘</Select.Option>
            </Select>
          </Form.Item>
          </Col>
          <Col :span="12">
          <Form.Item label="名称匹配" name="entityNamePattern">
            <Input v-model:value="formState.entityNamePattern">
            </Input>
          </Form.Item>
          </Col>
        </Row>
        <Alert type="success" message="名称匹配字段支持模板化使用$[messageKey]从消息中提取值;使用${metadataKey}从元数据中提取值。" />
      </div>

    </div>
  </Form>
</template>
<script lang="ts">
export default defineComponent({
  name: "change-originator",
});
</script>

<script lang="ts" setup>
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Button, Select, Row, Col, Input, Alert } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { OriginatorSource, EntityType, ENTITY_TYPE_OPTIONS } from '/@/enums/entityTypeEnum';
import { Icon } from '/@/components/Icon';

interface Configuration {
  entityNamePattern: any,
  entityType: any,
  originatorSource: 'CUSTOMER' | 'TENANT' | 'RELATED' | 'ALARM_ORIGINATOR' | 'ENTITY',
  relationsQuery: {
    direction: string,
    fetchLastLevelOnly: boolean,
    filters: [],
    maxLevel: number
  }
}

const props = defineProps({
  configuration: {
    type: Object as PropType<Configuration>,
    required: true,
  },
  ruleChainId: { type: String, default: '' }

});

const allowedEntityTypes = ENTITY_TYPE_OPTIONS.filter(item => {
  return item.value == EntityType.TENANT
    || item.value == EntityType.ASSET
    || item.value == EntityType.ENTITY_VIEW
    || item.value == EntityType.USER
    || item.value == EntityType.EDGE
});

function handleAddFilter() {

  formState.relationsQuery.filters.push({ relationType: "Contains", entityTypes: [] });
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
    direction: "FROM",
    fetchLastLevelOnly: false,
    filters: [{ relationType: "", entityTypes: [] }],
    maxLevel: 1
  }
});

watch(
  () => props.configuration,
  () => {
    formState.entityNamePattern = props.configuration.entityNamePattern;
    formState.entityType = props.configuration.entityType;
    formState.originatorSource = props.configuration.originatorSource;
    formState.relationsQuery = props.configuration.relationsQuery;
  },
  { immediate: true }
)

async function handleOriginatorSourceChange(originatorSource) {
  switch (originatorSource) {
    case OriginatorSource.RELATED:
      formState.relationsQuery.filters = [{ relationType: "Contains", entityTypes: [] }];
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

defineExpose({ getConfiguration })

</script>
