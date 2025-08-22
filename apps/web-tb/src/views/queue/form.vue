<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { Queue } from '#/api';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Textarea,
} from 'ant-design-vue';

import { getQueueByIdApi, saveQueueApi } from '#/api';
import { CollapseContainer } from '#/components/Container';
import {
  PROCESSING_STRATEGY_OPTIONS,
  SUBMIT_STRATEGY_OPTIONS,
  SubmitStrategyType,
} from '#/constants';
import { useAuthStore } from '#/store';

defineOptions({
  name: 'QueueFormModel',
});

const emits = defineEmits(['success']);

const authStore = useAuthStore();

const formRef = ref<FormInstance>();

const record = ref<null | Queue>(null);

const formState = reactive<Queue>({
  tenantId: authStore.getUserInfo().tenantId,
  name: undefined,
  topic: undefined,
  submitStrategy: { type: undefined, batchSize: 1000 },
  processingStrategy: {
    type: undefined,
    retries: 3,
    failurePercentage: 0,
    pauseBetweenRetries: 3,
    maxPauseBetweenRetries: 3,
  },
  pollInterval: 25,
  partitions: 10,
  consumerPerPartition: false,
  packProcessingTimeout: 2000,
  additionalInfo: { description: undefined },
} as Queue);

const [Modal, modalApi] = useVbenModal({
  title: `${$t('添加队列')}`,
  confirmText: `${$t('page.submit.title')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    reset();
    if (isOpen) {
      const { data, id } = modalApi.getData<Record<string, any>>();
      if (id) {
        const result = await getQueueByIdApi(id);
        record.value = (result || {}) as Queue;
      } else if (data) {
        record.value = data;
      }
      if (record.value) {
        Object.keys(record.value).forEach((key) => {
          const k = key as keyof Queue;
          formState[k] =
            k === 'additionalInfo' && !record.value![k]
              ? ({ description: undefined } as never)
              : (record.value![k] as never);
        });
      }
    }
    modalApi.setState({ loading: false });
  },
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await handleSubmit();
  },
});

function reset() {
  formRef.value?.resetFields();
  record.value = null;
}

async function handleSubmit() {
  const values = await formRef.value?.validate();

  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    modalApi.lock();
    const data = {
      ...record.value,
      ...values,
    };
    const res = await saveQueueApi('TB_RULE_ENGINE', data);
    emits('success', res);
    modalApi.close();
    message.success({
      content: `${$t('page.submit.success')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    modalApi.unlock();
  }
}
</script>
<template>
  <Modal class="w-1/2">
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item :name="['tenantId', 'entityType']" v-show="false">
        <Input v-model:value="formState.tenantId.entityType" />
      </Form.Item>
      <Form.Item :name="['tenantId', 'id']" v-show="false">
        <Input v-model:value="formState.tenantId.id" />
      </Form.Item>
      <Form.Item label="topic" name="topic" v-show="false">
        <Input v-model:value="formState.topic" />
      </Form.Item>
      <Form.Item
        label="队列名称"
        name="name"
        :rules="[
          { required: true, message: '请输入队列名称!' },
          {
            pattern: /^[a-zA-Z0-9_-]*$/,
            message: '队列名称只能包含字母数字和 _、-',
            trigger: ['change', 'blur'],
          },
        ]"
      >
        <Input
          v-model:value="formState.name"
          placeholder="请输入队列名称"
          @change="() => (formState.topic = `tb_rule_engine.${formState.name}`)"
        />
      </Form.Item>

      <CollapseContainer
        title="提交设置"
        class="border-[hsl(var(--border)) mb-4 border border-solid"
      >
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="提交策略"
              :name="['submitStrategy', 'type']"
              :rules="[{ required: true, message: '请选择提交策略!' }]"
            >
              <Radio.Group v-model:value="formState.submitStrategy.type">
                <Radio
                  :style="{
                    display: 'flex',
                    height: '30px',
                    lineHeight: '30px',
                    marginLeft: '30px',
                  }"
                  v-for="(option, index) in SUBMIT_STRATEGY_OPTIONS"
                  :key="index"
                  :value="option.value"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ option.label }}</span>
                    <IconifyIcon
                      v-tippy="{ theme: 'auto', content: `${option.help}` }"
                      icon="ant-design:info-circle-outlined"
                      class="size-4"
                    />
                  </div>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="批量处理大小"
              :name="['submitStrategy', 'batchSize']"
              v-if="formState.submitStrategy.type === SubmitStrategyType.BATCH"
              :rules="[{ required: true, message: '请输入批量处理大小!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="1000"
                :min="1"
                v-model:value="formState.submitStrategy.batchSize"
                placeholder="请输入批量处理大小"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        title="重试处理设置"
        class="border-[hsl(var(--border)) mb-4 border border-solid"
      >
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="处理策略"
              :name="['processingStrategy', 'type']"
              :rules="[{ required: true, message: '请选择重试处理策略!' }]"
            >
              <Radio.Group v-model:value="formState.processingStrategy.type">
                <Radio
                  :style="{
                    display: 'flex',
                    height: '40px',
                    lineHeight: '40px',
                    marginLeft: '30px',
                  }"
                  v-for="(option, index) in PROCESSING_STRATEGY_OPTIONS"
                  :key="index"
                  :value="option.value"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ option.label }}</span>
                    <IconifyIcon
                      v-tippy="{ theme: 'auto', content: `${option.help}` }"
                      icon="ant-design:info-circle-outlined"
                      class="size-4"
                    />
                  </div>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="重试次数(0表示无限制)"
              :name="['processingStrategy', 'retries']"
              :rules="[{ required: true, message: '请输入重试次数!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="3"
                :min="0"
                v-model:value="formState.processingStrategy.retries"
                placeholder="请输入重试次数"
              />
            </Form.Item>
            <Form.Item
              label="跳过重试的失败消息百分比"
              :name="['processingStrategy', 'failurePercentage']"
              :rules="[
                { required: true, message: '请输入跳过重试的失败消息百分比!' },
              ]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="0"
                :min="0"
                :max="100"
                v-model:value="formState.processingStrategy.failurePercentage"
                placeholder="请输入跳过重试的失败消息百分比"
              />
            </Form.Item>
            <Form.Item
              label="重试间隔"
              :name="['processingStrategy', 'pauseBetweenRetries']"
              :rules="[{ required: true, message: '请输入重试间隔!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="3"
                :min="0"
                v-model:value="formState.processingStrategy.pauseBetweenRetries"
                placeholder="请输入重试间隔"
                addon-after="秒"
              />
            </Form.Item>
            <Form.Item
              label="最大重试间隔"
              :name="['processingStrategy', 'maxPauseBetweenRetries']"
              :rules="[{ required: true, message: '请输入最大重试间隔!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="3"
                :min="0"
                v-model:value="
                  formState.processingStrategy.maxPauseBetweenRetries
                "
                placeholder="请输入最大重试间隔"
                addon-after="秒"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        title="轮训设置"
        class="border-[hsl(var(--border)) mb-4 border border-solid"
      >
        批量处理
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="轮训间隔"
              name="pollInterval"
              :rules="[{ required: true, message: '请输入轮训间隔!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="25"
                :min="0"
                v-model:value="formState.pollInterval"
                placeholder="请输入轮训间隔"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="分区"
              name="partitions"
              :rules="[{ required: true, message: '请输入分区!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="10"
                :min="1"
                v-model:value="formState.partitions"
                placeholder="请输入分区"
              />
            </Form.Item>
          </Col>
        </Row>
        即时处理
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label=" " name="consumerPerPartition">
              <Checkbox
                v-model:checked="formState.consumerPerPartition"
                :default-checked="false"
              >
                每个分区消费者单独轮询消息
              </Checkbox>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="处理超时"
              name="packProcessingTimeout"
              :rules="[{ required: true, message: '请输入处理超时时间!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :default-value="2000"
                :min="0"
                v-model:value="formState.packProcessingTimeout"
                placeholder="请输入处理超时时间"
                addon-after="毫秒"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <Form.Item
        label="描述信息"
        :name="['additionalInfo', 'description']"
        help="此文本将显示在队列说明中，而不是所选策略中"
      >
        <Textarea
          v-model:value="formState.additionalInfo.description"
          placeholder="输入队列描述信息"
          :rows="3"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
