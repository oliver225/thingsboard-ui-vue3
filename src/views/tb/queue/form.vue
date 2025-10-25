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
        :label="t('tb.queue.form.name')"
        name="name"
        :rules="[
          { required: true, message: t('tb.queue.form.nameRequired') },
          { pattern: /^[a-zA-Z0-9_-]*$/, message: t('tb.queue.form.namePattern'), trigger: ['change', 'blur'] },
        ]"
      >
        <Input
          v-model:value="formState.name"
          :placeholder="t('tb.queue.form.namePlaceholder')"
          @change="() => (formState.topic = `tb_rule_engine.${formState.name}`)"
        />
      </Form.Item>

      <CollapseContainer :title="t('tb.queue.form.submitSettings')" class="border border-solid border-neutral-300 mb-4">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.queue.form.submitStrategy')"
              :name="['submitStrategy', 'type']"
              :rules="[{ required: true, message: t('tb.queue.form.submitStrategyRequired') }]"
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
              :label="t('tb.queue.form.batchSize')"
              :name="['submitStrategy', 'batchSize']"
              v-if="formState.submitStrategy.type == SubmitStrategyType.BATCH"
              :rules="[{ required: true, message: t('tb.queue.form.batchSizeRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="1000"
                :min="1"
                v-model:value="formState.submitStrategy.batchSize"
                :placeholder="t('tb.queue.form.batchSize')"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        :title="t('tb.queue.form.processingSettings')"
        class="border border-solid border-neutral-300 mb-4"
      >
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.queue.form.processingStrategy')"
              :name="['processingStrategy', 'type']"
              :rules="[{ required: true, message: t('tb.queue.form.processingStrategyRequired') }]"
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
              :label="t('tb.queue.form.retries')"
              :name="['processingStrategy', 'retries']"
              :rules="[{ required: true, message: t('tb.queue.form.retriesRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="3"
                :min="0"
                v-model:value="formState.processingStrategy.retries"
                :placeholder="t('tb.queue.form.retries')"
              />
            </Form.Item>
            <Form.Item
              :label="t('tb.queue.form.failurePercentage')"
              :name="['processingStrategy', 'failurePercentage']"
              :rules="[{ required: true, message: t('tb.queue.form.failurePercentageRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="0"
                :min="0"
                :max="100"
                v-model:value="formState.processingStrategy.failurePercentage"
                :placeholder="t('tb.queue.form.failurePercentage')"
              />
            </Form.Item>
            <Form.Item
              :label="t('tb.queue.form.pauseBetweenRetries')"
              :name="['processingStrategy', 'pauseBetweenRetries']"
              :rules="[{ required: true, message: t('tb.queue.form.pauseBetweenRetriesRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="3"
                :min="0"
                v-model:value="formState.processingStrategy.pauseBetweenRetries"
                :placeholder="t('tb.queue.form.pauseBetweenRetries')"
                :addon-after="t('tb.queue.detail.unitSecond')"
              />
            </Form.Item>
            <Form.Item
              :label="t('tb.queue.form.maxPauseBetweenRetries')"
              :name="['processingStrategy', 'maxPauseBetweenRetries']"
              :rules="[{ required: true, message: t('tb.queue.form.maxPauseBetweenRetriesRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="3"
                :min="0"
                v-model:value="formState.processingStrategy.maxPauseBetweenRetries"
                :placeholder="t('tb.queue.form.maxPauseBetweenRetries')"
                :addon-after="t('tb.queue.detail.unitSecond')"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        :title="t('tb.queue.form.pollingSettings')"
        class="border border-solid border-neutral-300 mb-4"
      >
        {{ t('tb.queue.detail.batchProcessing') }}
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.queue.form.pollInterval')"
              name="pollInterval"
              :rules="[{ required: true, message: t('tb.queue.form.pollIntervalRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="25"
                :min="0"
                v-model:value="formState.pollInterval"
                :placeholder="t('tb.queue.form.pollInterval')"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.queue.form.partitions')"
              name="partitions"
              :rules="[{ required: true, message: t('tb.queue.form.partitionsRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="10"
                :min="1"
                v-model:value="formState.partitions"
                :placeholder="t('tb.queue.form.partitions')"
              />
            </Form.Item>
          </Col>
        </Row>
        {{ t('tb.queue.detail.immediateProcessing') }}
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label=" " name="consumerPerPartition">
              <Checkbox v-model:checked="formState.consumerPerPartition" :defaultChecked="false">
                {{ t('tb.queue.form.consumerPerPartition') }}</Checkbox
              >
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.queue.form.packProcessingTimeout')"
              name="packProcessingTimeout"
              :rules="[{ required: true, message: t('tb.queue.form.packProcessingTimeoutRequired') }]"
            >
              <InputNumber
                :style="{ width: '90%' }"
                :defaultValue="2000"
                :min="0"
                v-model:value="formState.packProcessingTimeout"
                :placeholder="t('tb.queue.form.packProcessingTimeout')"
                :addon-after="t('tb.queue.detail.unitMillisecond')"
              />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <Form.Item
        :label="t('tb.queue.form.description')"
        :name="['additionalInfo', 'description']"
        :help="t('tb.queue.form.descriptionHelp')"
      >
        <Textarea
          v-model:value="formState.additionalInfo.description"
          :placeholder="t('tb.queue.form.descriptionPlaceholder')"
          :rows="3"
        />
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
    value: record.value.id?.id ? t('tb.queue.action.edit') : t('tb.queue.action.add'),
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
      showMessage(record.value.id?.id ? t('tb.queue.form.editSuccess') : t('tb.queue.form.addSuccess'));
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
