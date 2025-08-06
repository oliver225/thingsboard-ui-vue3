<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
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
          { pattern: /^[a-zA-Z0-9_-]*$/, message: '队列名称只能包含字母数字和 _、-', trigger: ['change', 'blur'] },
        ]"
      >
        <Input
          v-model:value="formState.name"
          placeholder="请输入队列名称"
          @change="() => (formState.topic = `tb_rule_engine.${formState.name}`)"
        />
      </Form.Item>

      <CollapseContainer title="提交设置" class="border border-solid border-neutral-300 mb-4">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="提交策略"
              :name="['submitStrategy', 'type']"
              :rules="[{ required: true, message: '请选择提交策略!' }]"
            >
              <Radio.Group v-model:value="formState.submitStrategy.type">
                <Radio
                  :style="{ display: 'flex', height: '30px', lineHeight: '30px', marginLeft: '30px' }"
                  v-for="(option, index) in SUBMIT_STRATEGY_OPTIONS"
                  :key="index"
                  :value="option.value"
                >
                  {{ option.label }}
                  <Tooltip placement="top" :title="option.help">
                    <Icon :icon="'ant-design:info-circle-outlined'" />
                  </Tooltip>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="批量处理大小"
              :name="['submitStrategy', 'batchSize']"
              v-if="formState.submitStrategy.type == SubmitStrategyType.BATCH"
              :rules="[{ required: true, message: '请输入批量处理大小!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="1000"
                :min="1"
                v-model:value="formState.submitStrategy.batchSize"
                placeholder="请输入批量处理大小"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer title="重试处理设置" class="border border-solid border-neutral-300 mb-4">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="处理策略"
              :name="['processingStrategy', 'type']"
              :rules="[{ required: true, message: '请选择重试处理策略!' }]"
            >
              <Radio.Group v-model:value="formState.processingStrategy.type">
                <Radio
                  :style="{ display: 'flex', height: '40px', lineHeight: '40px', marginLeft: '30px' }"
                  v-for="(option, index) in PROCESSING_STRATEGY_OPTIONS"
                  :key="index"
                  :value="option.value"
                >
                  {{ option.label }}
                  <Tooltip placement="top" :title="option.help">
                    <Icon :icon="'ant-design:info-circle-outlined'" />
                  </Tooltip>
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
                :defaultValue="3"
                :min="0"
                v-model:value="formState.processingStrategy.retries"
                placeholder="请输入重试次数"
              />
            </Form.Item>
            <Form.Item
              label="跳过重试的失败消息百分比"
              :name="['processingStrategy', 'failurePercentage']"
              :rules="[{ required: true, message: '请输入跳过重试的失败消息百分比!' }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="0"
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
                :defaultValue="3"
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
                :defaultValue="3"
                :min="0"
                v-model:value="formState.processingStrategy.maxPauseBetweenRetries"
                placeholder="请输入最大重试间隔"
                addon-after="秒"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer title="轮训设置" class="border border-solid border-neutral-300 mb-4">
        批量处理
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="轮训间隔" name="pollInterval" :rules="[{ required: true, message: '请输入轮训间隔!' }]">
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="25"
                :min="0"
                v-model:value="formState.pollInterval"
                placeholder="请输入轮训间隔"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="分区" name="partitions" :rules="[{ required: true, message: '请输入分区!' }]">
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="10"
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
              <Checkbox v-model:checked="formState.consumerPerPartition" :defaultChecked="false">
                每个分区消费者单独轮询消息</Checkbox
              >
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
                :defaultValue="2000"
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
        <Textarea v-model:value="formState.additionalInfo.description" placeholder="输入队列描述信息" :rows="3" />
      </Form.Item>
    </Form>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbQueueForm">
  import { ref, unref, computed, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { CollapseContainer } from '/@/components/Container';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { saveQueue, getQueueById, Queue } from '/@/api/tb/queue';
  import { Radio, Row, Col, Tooltip, InputNumber, Textarea, Checkbox, Form, Input } from 'ant-design-vue';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS, SubmitStrategyType } from '/@/enums/queueEnum';
  import { FormInstance } from 'ant-design-vue/lib/form';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const formRef = ref<FormInstance>();
  const record = ref<Queue>({} as Queue);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑队列') : t('新增队列'),
  }));

  const tenantId = userStore.getUserInfo?.tenantId || { EntityType: 'TENANT', id: '' };

  const formState = reactive<Queue>({
    tenantId: tenantId,
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

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as Queue;
    clear();
    if (data?.id?.id) {
      const res = await getQueueById(data.id.id);
      record.value = (res || {}) as Queue;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
    }
    setModalProps({ loading: false });
  });

  function clear() {
    formState.tenantId = tenantId;
    formState.name = undefined;
    formState.topic = undefined;
    formState.submitStrategy = { type: undefined, batchSize: 1000 };
    formState.processingStrategy = {
      type: undefined,
      retries: 3,
      failurePercentage: 0,
      pauseBetweenRetries: 3,
      maxPauseBetweenRetries: 3,
    };
    formState.pollInterval = 25;
    formState.partitions = 10;
    formState.consumerPerPartition = false;
    formState.packProcessingTimeout = 2000;
    formState.additionalInfo = { description: undefined };
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      setModalProps({ confirmLoading: true });

      // console.log('submit', params, data, record);
      const res = await saveQueue('TB_RULE_ENGINE', { ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}队列成功！`);
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
