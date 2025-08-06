<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{ getTitle.value || '· · · ·' }}
          </span>
          <span class="text-sm">队列详情</span>
        </div>
      </div>
    </template>
    <div>
      <div class="space-x-4">
        <a-button type="primary success" @click="handleEditQueue">
          <Icon :icon="'i-clarity:note-edit-line'" />编辑队列
        </a-button>
        <a-button type="primary" danger @click="handleDeleteQueue" v-if="record.name != 'Main'">
          <Icon :icon="'ant-design:delete-outlined'" />删除队列
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyQueueId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制队列ID
        </a-button>
      </div>
      <CollapseContainer title="提交设置" class="border border-solid border-neutral-300 mb-4">
        <Row :gutter="16">
          <Col :span="12">
            <div class="font-bold">提交策略</div>
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
              <div class="font-bold">批量处理大小</div>
              {{ record.submitStrategy?.batchSize }}
            </div>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer title="重试处理设置" class="border border-solid border-neutral-300 mb-4">
        <Row :gutter="16">
          <Col :span="12">
            <div class="font-bold">处理策略</div>
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
            <div class="font-bold mt-2">重试次数(0表示无限制)</div>
            {{ record.processingStrategy?.retries }}
            <div class="font-bold mt-2">跳过重试的失败消息百分比</div>
            {{ record.processingStrategy?.failurePercentage }}
            <div class="font-bold mt-2">重试间隔</div>
            {{ record.processingStrategy?.pauseBetweenRetries }}秒
            <div class="font-bold mt-2">最大重试间隔</div>
            {{ record.processingStrategy?.maxPauseBetweenRetries }}秒
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer title="轮训设置" class="border border-solid border-neutral-300 mb-4">
        批量处理
        <Row :gutter="16">
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">轮训间隔</div>
              {{ record.pollInterval }}
            </div>
          </Col>
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">分区</div>
              {{ record.partitions }}
            </div>
          </Col>
        </Row>
        即时处理
        <Row :gutter="16">
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">&nbsp;</div>
              <Checkbox :checked="record.consumerPerPartition"> 每个分区消费者单独轮询消息</Checkbox>
            </div>
          </Col>
          <Col :span="12">
            <div class="px-8">
              <div class="font-bold mt-2">处理超时</div>
              {{ record.packProcessingTimeout }}毫秒
            </div>
          </Col>
        </Row>
      </CollapseContainer>
      <div class="font-bold mt-2">描述消息</div>
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
    copyToClipboard(record.value.id.id, '复制队列ID成功！');
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
