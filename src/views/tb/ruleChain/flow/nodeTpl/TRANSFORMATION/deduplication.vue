<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item label="时间间隔" name="interval" :rules="[{ required: true, message: '时间间隔不能为空!' }]">
      <InputNumber v-model:value="formState.interval" :min="1" :step="1" :precision="0" :style="{ width: '100%' }" />
    </Form.Item>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">存储</p>
      <div class="p-2">
        <Form.Item name="strategy">
          <Radio.Group v-model:value="formState.strategy" button-style="solid" :style="{ display: 'flex' }" class="w-full"
            @change="handleStrategyChange">
            <Radio.Button class="flex-1" value="FIRST">First</Radio.Button>
            <Radio.Button class="flex-1" value="LAST">Last</Radio.Button>
            <Radio.Button class="flex-1" value="ALL">All</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Alert type="success">
          <template #message>
            <span v-if="formState.strategy == 'FIRST'">返回在重复数据删除期间到达的第一条消息。</span>
            <span v-else-if="formState.strategy == 'LAST'">返回重复数据删除期间到达的最后一条消息。</span>
            <span v-else="formState.strategy == 'ALL'">将重复数据删除期间到达的所有消息作为单个JSON数组消息返回；其中每个元素代表具有msg和元数据内部属性的对象。</span>
          </template>
        </Alert>
        <template v-if="formState.strategy == 'ALL'">
          <Row :gutter="20">
            <Col :span="12">
            <Form.Item label="输出消息类型">
              <Select v-model:value="outputMessageTypeRef">
                <Select.Option value="POST_ATTRIBUTES_REQUEST">Post attributes</Select.Option>
                <Select.Option value="POST_TELEMETRY_REQUEST">Post telemetry</Select.Option>
                <Select.Option value="CUSTOMER">Custom</Select.Option>
              </Select>
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="输出消息类型值" name="outMsgType" :rules="[{ required: true, message: '请选择输出消息类型!' }]">
              <Input v-model:value="formState.outMsgType" :disabled="outputMessageTypeRef !== 'CUSTOMER'" />
            </Form.Item>
            </Col>
            <Col :span="24">
            <Form.Item label="队列" name="queueName" :rules="[{ required: true, message: '请选择队列!' }]">
              <Select v-model:value="formState.queueName" placeholder="请选择队列">
                <Select.Option v-for="(option, index) in queueOptions" :key="index" :value="option.value">
                  {{ option.label }}
                  <p>
                    <Tag>
                      <small>提交策略:</small>
                      {{ SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === option.submitStrategy)?.label ||
                        option.submitStrategy }}
                    </Tag>
                    <Tag>
                      <small>处理策略:</small>
                      {{ PROCESSING_STRATEGY_OPTIONS.find((item) => item.value === option.processingStrategy)?.label
                        ||
                        option.processingStrategy }}
                    </Tag>
                  </p>
                </Select.Option>
              </Select>
            </Form.Item>
            </Col>
          </Row>

        </template>
      </div>
    </div>
    <Collapse expand-icon-position="end">
      <Collapse.Panel header="高级设置">
        <Row :gutter="20">
          <Col :span="12">
          <Form.Item label="消息最大待处理数量" name="maxPendingMsgs" :rules="[{ required: true, message: '数值不能为空!' }]">
            <InputNumber v-model:value="formState.maxPendingMsgs" :min="1" :step="1" :precision="0"
              :style="{ width: '100%' }" />
          </Form.Item>
          </Col>
          <Col :span="12">
          <Form.Item label="消息最大重试数量" name="maxRetries" :rules="[{ required: true, message: '数值不能为空!' }]">
            <InputNumber v-model:value="formState.maxRetries" :min="0" :step="1" :precision="0"
              :style="{ width: '100%' }" />
          </Form.Item>
          </Col>
        </Row>
      </Collapse.Panel>
    </Collapse>
  </Form>
</template>
<script lang="ts">
export default defineComponent({
  name: 'deduplication',
});
</script>
<script lang="ts" setup>
import { ref, watch, defineComponent, reactive, onMounted } from 'vue';
import { Form, Select, Row, Col, Radio, InputNumber, Input, Alert, Collapse } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
import { queueList } from '/@/api/tb/queue';

interface Configuration {
  interval: number,
  maxPendingMsgs: number,
  maxRetries: number,
  outMsgType: any,
  strategy: 'FIRST' | 'LAST' | 'ALL',
  queueName: string,
}

const props = defineProps({
  configuration: {
    type: Object as PropType<Configuration>,
    required: true,
  },
  ruleChainId: { type: String, default: '' }
});

const queueOptions = ref<any[]>([]);

const formRef = ref<FormInstance>();

const outputMessageTypeRef = ref<string>();
const formState = reactive<any>({
  interval: 60,
  maxPendingMsgs: 100,
  maxRetries: 3,
  outMsgType: null,
  strategy: "FIRST",
  queueName: undefined,
});

watch(
  () => props.configuration,
  () => {
    formState.interval = props.configuration.interval;
    formState.maxPendingMsgs = props.configuration.maxPendingMsgs;
    formState.maxRetries = props.configuration.maxRetries;
    formState.outMsgType = props.configuration.outMsgType;
    formState.strategy = props.configuration.strategy;
    formState.queueName = props.configuration.queueName;
  },
  { immediate: true }
);

async function getConfiguration() {
  try {
    const data = await formRef.value?.validate();
    if (data) {

    }
    return data;
  } catch (error: any) {
    throw error;
  }
}

onMounted(async () => {
  await fetchQueueList();
})

async function fetchQueueList() {
  const queueListResult = await queueList({ pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' }, 'TB_RULE_ENGINE');
  queueOptions.value = queueListResult.data.map(item => {
    return {
      value: item.name,
      label: item.name,
      submitStrategy: item.submitStrategy?.type,
      processingStrategy: item.processingStrategy?.type
    }
  })

}

function handleStrategyChange({ target: { value } }) {
  if (value == 'ALL') {
    outputMessageTypeRef.value = 'POST_ATTRIBUTES_REQUEST';
  } else {
    outputMessageTypeRef.value = undefined;
    formState.queueName = undefined;
  }
}
watch(
  () => outputMessageTypeRef.value,
  () => {
    if (outputMessageTypeRef.value == 'CUSTOMER') {
      formState.outMsgType = undefined;
    } else {
      formState.outMsgType = outputMessageTypeRef.value;
    }
  })

defineExpose({ getConfiguration })
</script>
