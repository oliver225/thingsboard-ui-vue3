<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item label="实体类型" name="originatorSource" :rules="[{ required: true, message: '实体类型必选!' }]">
      <Select v-model:value="formState.originatorSource" @change="handleEntityTypeChange">
        <Select.Option value="CUSTOMER">CUSTOMER</Select.Option>
        <Select.Option value="TENANT">TENANT</Select.Option>
        <Select.Option value="RELATED">RELATED</Select.Option>
        <Select.Option value="ALARM_ORIGINATOR">ALARM_ORIGINATOR</Select.Option>
        <Select.Option value="ENTITY">ENTITY</Select.Option>
      </Select>
    </Form.Item>
    <div class="border  border-neutral-400 p-2 rounded">
      <p class="text-base font-medium">关系查询</p>
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
import { Form, Switch, Select, Row, Col, Radio, Input, InputNumber, Alert } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { Aggregation, OrderBy, TimeUnit, TIME_UNIT_OPTIONS, AGGREGATION_OPTIONS } from '/@/enums/telemetryEnum';
import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';

interface Configuration {
  entityNamePattern: any,
  entityType: any,
  originatorSource: 'CUSTOMER' | 'TENANT' | 'RELATED' | 'ALARM_ORIGINATOR' | 'ENTITY',
  relationsQuery: {
    direction: string,
    fetchLastLevelOnly: boolean,
    filters: [],
    maxLevel: number
  },
}

const props = defineProps({
  configuration: {
    type: Object as PropType<Configuration>,
    required: true,
  },
});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
  entityNamePattern: null,
  entityType: null,
  originatorSource: 'CUSTOMER',
  relationsQuery: {
    direction: "FROM",
    fetchLastLevelOnly: false,
    filters: [{ relationType: "Contains", entityTypes: [] }],
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

async function handleEntityTypeChange(entityType) {
    formState.entityId = undefined;
    switch (entityType) {
        case EntityType.CUSTOMER:
           
            break;
        case EntityType.TENANT:
           
            break;
    }
    //TODO edge;

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
