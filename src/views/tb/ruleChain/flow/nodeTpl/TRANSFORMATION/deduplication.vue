<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.interval')"
      name="interval"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.intervalRequired') }]"
    >
      <InputNumber v-model:value="formState.interval" :min="1" :step="1" :precision="0" :style="{ width: '100%' }" />
    </Form.Item>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.storage') }}</p>
      <div class="p-2">
        <Form.Item name="strategy">
          <Radio.Group
            v-model:value="formState.strategy"
            button-style="solid"
            :style="{ display: 'flex' }"
            class="w-full"
            @change="handleStrategyChange"
          >
            <Radio.Button class="flex-1" value="FIRST">{{ t('tb.ruleChain.nodeAction.first') }}</Radio.Button>
            <Radio.Button class="flex-1" value="LAST">{{ t('tb.ruleChain.nodeAction.last') }}</Radio.Button>
            <Radio.Button class="flex-1" value="ALL">{{ t('tb.ruleChain.nodeAction.all') }}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Alert type="success">
          <template #message>
            <span v-if="formState.strategy == 'FIRST'">{{ t('tb.ruleChain.nodeAction.firstStrategyHelp') }}</span>
            <span v-else-if="formState.strategy == 'LAST'">{{ t('tb.ruleChain.nodeAction.lastStrategyHelp') }}</span>
            <span v-else="formState.strategy == 'ALL'">{{ t('tb.ruleChain.nodeAction.allStrategyHelp') }}</span>
          </template>
        </Alert>
        <template v-if="formState.strategy == 'ALL'">
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item :label="t('tb.ruleChain.nodeAction.outputMessageType')">
                <Select v-model:value="outputMessageTypeRef">
                  <Select.Option value="POST_ATTRIBUTES_REQUEST">{{
                    t('tb.ruleChain.nodeAction.postAttributes')
                  }}</Select.Option>
                  <Select.Option value="POST_TELEMETRY_REQUEST">{{
                    t('tb.ruleChain.nodeAction.postTelemetry')
                  }}</Select.Option>
                  <Select.Option value="CUSTOMER">{{ t('tb.ruleChain.nodeAction.custom') }}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.ruleChain.nodeAction.outputMessageTypeValue')"
                name="outMsgType"
                :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.outputMessageTypeRequired') }]"
              >
                <Input v-model:value="formState.outMsgType" :disabled="outputMessageTypeRef !== 'CUSTOMER'" />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item
                :label="t('tb.ruleChain.nodeAction.queue')"
                name="queueName"
                :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.queueRequired') }]"
              >
                <Select
                  v-model:value="formState.queueName"
                  :placeholder="t('tb.ruleChain.nodeAction.queuePlaceholder')"
                >
                  <Select.Option v-for="(option, index) in queueOptions" :key="index" :value="option.value">
                    {{ option.label }}
                    <p>
                      <Tag>
                        <small>{{ t('tb.ruleChain.nodeAction.submitStrategy') }}</small>
                        {{
                          SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === option.submitStrategy)?.label ||
                          option.submitStrategy
                        }}
                      </Tag>
                      <Tag>
                        <small>{{ t('tb.ruleChain.nodeAction.processingStrategy') }}</small>
                        {{
                          PROCESSING_STRATEGY_OPTIONS.find((item) => item.value === option.processingStrategy)?.label ||
                          option.processingStrategy
                        }}
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
      <Collapse.Panel :header="t('tb.ruleChain.nodeAction.advancedSettings')">
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.maxPendingMsgs')"
              name="maxPendingMsgs"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.valueRequired') }]"
            >
              <InputNumber
                v-model:value="formState.maxPendingMsgs"
                :min="1"
                :step="1"
                :precision="0"
                :style="{ width: '100%' }"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.maxRetries')"
              name="maxRetries"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.valueRequired') }]"
            >
              <InputNumber
                v-model:value="formState.maxRetries"
                :min="0"
                :step="1"
                :precision="0"
                :style="{ width: '100%' }"
              />
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
  import { Form, Select, Row, Col, Radio, InputNumber, Input, Alert, Collapse, Tag } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
  import { queueList } from '/@/api/tb/queue';

  interface Configuration {
    interval: number;
    maxPendingMsgs: number;
    maxRetries: number;
    outMsgType: any;
    strategy: 'FIRST' | 'LAST' | 'ALL';
    queueName: string;
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const queueOptions = ref<any[]>([]);

  const formRef = ref<FormInstance>();

  const outputMessageTypeRef = ref<string>();
  const formState = reactive<any>({
    interval: 60,
    maxPendingMsgs: 100,
    maxRetries: 3,
    outMsgType: null,
    strategy: 'FIRST',
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
    { immediate: true },
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
  });

  async function fetchQueueList() {
    const queueListResult = await queueList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      'TB_RULE_ENGINE',
    );
    queueOptions.value = queueListResult.data.map((item) => {
      return {
        value: item.name,
        label: item.name,
        submitStrategy: item.submitStrategy?.type,
        processingStrategy: item.processingStrategy?.type,
      };
    });
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
    },
  );

  defineExpose({ getConfiguration });
</script>
