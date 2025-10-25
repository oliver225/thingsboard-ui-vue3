<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{ getTitle.value || '· · · ·' }}
          </span>
          <span class="text-sm">{{ t('tb.queue.detail.title') }}</span>
        </div>
      </div>
    </template>
    <div>
      <div class="space-x-4">
        <a-button type="primary success" @click="handleEditQueue">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.queue.action.edit') }}
        </a-button>
        <a-button type="primary" danger @click="handleDeleteQueue" v-if="record.name != 'Main'">
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.queue.action.delete') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyQueueId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.queue.action.copyId') }}
        </a-button>
      </div>
      <CollapseContainer
        :title="t('tb.queue.detail.sections.submitSettings')"
        class="border border-solid border-neutral-300 mb-4"
      >
        <Row :gutter="16">
          <Col :span="12">
            <div class="font-bold">{{ t('tb.queue.detail.submitStrategy') }}</div>
            <Radio.Group :value="record.submitStrategy?.type">
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
          </Col>
          <Col :span="12">
            <div v-if="record.submitStrategy?.type == SubmitStrategyType.BATCH">
              <div class="font-bold">{{ t('tb.queue.detail.batchSize') }}</div>
              {{ record.submitStrategy?.batchSize }}
            </div>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        :title="t('tb.queue.detail.sections.retrySettings')"
        class="border border-solid border-neutral-300 mb-4"
      >
        <Row :gutter="16">
          <Col :span="12">
            <div class="font-bold">{{ t('tb.queue.detail.processingStrategy') }}</div>
            <Radio.Group :value="record.processingStrategy?.type">
              <Radio
                :style="{ display: 'flex', height: '30px', lineHeight: '30px', marginLeft: '30px' }"
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
          </Col>
          <Col :span="12">
            <div class="font-bold mt-2">{{ t('tb.queue.detail.retries') }}</div>
            {{ record.processingStrategy?.retries }}
            <div class="font-bold mt-2">{{ t('tb.queue.detail.failurePercentage') }}</div>
            {{ record.processingStrategy?.failurePercentage }}
            <div class="font-bold mt-2">{{ t('tb.queue.detail.pauseBetweenRetries') }}</div>
            {{ record.processingStrategy?.pauseBetweenRetries }}{{ t('tb.queue.detail.unitSecond') }}
            <div class="font-bold mt-2">{{ t('tb.queue.detail.maxPauseBetweenRetries') }}</div>
            {{ record.processingStrategy?.maxPauseBetweenRetries }}{{ t('tb.queue.detail.unitSecond') }}
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        :title="t('tb.queue.detail.sections.pollingSettings')"
        class="border border-solid border-neutral-300 mb-4"
      >
        {{ t('tb.queue.detail.batchProcessing') }}
        <Row :gutter="16">
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">{{ t('tb.queue.detail.pollInterval') }}</div>
              {{ record.pollInterval }}
            </div>
          </Col>
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">{{ t('tb.queue.detail.partitions') }}</div>
              {{ record.partitions }}
            </div>
          </Col>
        </Row>
        {{ t('tb.queue.detail.immediateProcessing') }}
        <Row :gutter="16">
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">&nbsp;</div>
              <Checkbox :checked="record.consumerPerPartition">
                {{ t('tb.queue.detail.consumerPerPartition') }}</Checkbox
              >
            </div>
          </Col>
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">{{ t('tb.queue.detail.packProcessingTimeout') }}</div>
              {{ record.packProcessingTimeout }}{{ t('tb.queue.detail.unitMillisecond') }}
            </div>
          </Col>
        </Row>
      </CollapseContainer>
      <div class="font-bold mt-2">{{ t('tb.queue.detail.description') }}</div>
      {{ record.additionalInfo?.description }}
    </div>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbQueueDetail">
  import { ref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { CollapseContainer } from '/@/components/Container';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { getQueueById, Queue } from '/@/api/tb/queue';
  import { Checkbox, Radio, Tooltip, Row, Col } from 'ant-design-vue';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS, SubmitStrategyType } from '/@/enums/queueEnum';

  const emit = defineEmits(['edit', 'delete', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const record = ref<Queue>({} as Queue);

  const getTitle = computed(() => ({
    icon: 'ant-design:branches-outlined',
    value: record.value.name,
  }));

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await getQueueById(data.id.id);
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  async function clear() {
    record.value = {} as Queue;
  }

  function handleCopyQueueId() {
    copyToClipboard(record.value.id.id, t('tb.queue.action.copyIdSuccess'));
  }

  function handleDeleteQueue() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditQueue() {
    emit('edit', record.value);
    closeDrawer();
  }
</script>
