<script lang="ts" setup>
import type { Queue } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Checkbox, Col, Radio, Row } from 'ant-design-vue';

import { getQueueByIdApi } from '#/api';
import { CollapseContainer } from '#/components/Container';
import {
  PROCESSING_STRATEGY_OPTIONS,
  SUBMIT_STRATEGY_OPTIONS,
  SubmitStrategyType,
} from '#/constants';
import { copyToClipboard } from '#/utils';

defineOptions({
  name: 'QueueDetailDrawer',
});
const emits = defineEmits(['edit', 'delete']);

const record = ref<null | Queue>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('队列详情')}`,
  overlayBlur: 0,
  footer: false,
  class: ['w-1/2'],

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getQueueByIdApi(id);
      } else if (data) {
        record.value = data;
      }
    }
    drawerApi.setState({ loading: false });
  },
});

function reset() {
  record.value = null;
}

function handleEdit() {
  drawerApi.close();
  emits('edit', { ...record.value });
}
function handleDelete() {
  drawerApi.close();
  emits('delete', { ...record.value });
}

function handleCopyId() {
  if (record?.value?.id) {
    copyToClipboard(record?.value?.id.id, '复制成功！');
  }
}
</script>
<template>
  <Drawer header-class="drawer-header">
    <template #extra>
      <VbenIconButton class="mr-2">
        <IconifyIcon class="size-4" icon="mdi:help-circle" />
      </VbenIconButton>
    </template>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon class="size-8" icon="mdi:account-supervisor" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.name }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('队列详情') }}
          </p>
        </div>
      </div>
    </template>

    <div class="mb-2 flex space-x-4">
      <Button type="primary" @click="handleEdit">
        <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
        {{ $t('编辑队列') }}
      </Button>
      <Button type="primary" danger @click="handleDelete">
        <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
        {{ $t('删除队列') }}
      </Button>
    </div>
    <div class="mb-2 flex space-x-4">
      <Button @click="handleCopyId">
        <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
        {{ $t('复制队列ID') }}
      </Button>
    </div>
    <CollapseContainer
      title="提交设置"
      class="border-[hsl(var(--border)) mb-4 border border-solid"
    >
      <Row :gutter="16">
        <Col :span="12">
          <div class="font-bold">提交策略</div>
          <Radio.Group :value="record?.submitStrategy?.type">
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
        </Col>
        <Col :span="12">
          <div v-if="record?.submitStrategy?.type === SubmitStrategyType.BATCH">
            <div class="font-bold">批量处理大小</div>
            {{ record.submitStrategy?.batchSize }}
          </div>
        </Col>
      </Row>
    </CollapseContainer>
    <CollapseContainer
      title="重试处理设置"
      class="border-[hsl(var(--border)) mb-4 border border-solid"
    >
      <Row :gutter="16">
        <Col :span="12">
          <div class="font-bold">处理策略</div>
          <Radio.Group :value="record?.processingStrategy?.type">
            <Radio
              :style="{
                display: 'flex',
                height: '30px',
                lineHeight: '30px',
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
        </Col>
        <Col :span="12">
          <div class="mt-2 font-bold">重试次数(0表示无限制)</div>
          {{ record?.processingStrategy?.retries }}
          <div class="mt-2 font-bold">跳过重试的失败消息百分比</div>
          {{ record?.processingStrategy?.failurePercentage }}
          <div class="mt-2 font-bold">重试间隔</div>
          {{ record?.processingStrategy?.pauseBetweenRetries }}秒
          <div class="mt-2 font-bold">最大重试间隔</div>
          {{ record?.processingStrategy?.maxPauseBetweenRetries }}秒
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
          <div class="px-8">
            <div class="mt-2 font-bold">轮训间隔</div>
            {{ record?.pollInterval }}
          </div>
        </Col>
        <Col :span="12">
          <div class="px-8">
            <div class="mt-2 font-bold">分区</div>
            {{ record?.partitions }}
          </div>
        </Col>
      </Row>
      即时处理
      <Row :gutter="16">
        <Col :span="12">
          <div class="px-8">
            <div class="mt-2 font-bold">&nbsp;</div>
            <Checkbox :checked="record?.consumerPerPartition">
              每个分区消费者单独轮询消息
            </Checkbox>
          </div>
        </Col>
        <Col :span="12">
          <div class="px-8">
            <div class="mt-2 font-bold">处理超时</div>
            {{ record?.packProcessingTimeout }}毫秒
          </div>
        </Col>
      </Row>
    </CollapseContainer>
    <div class="mt-2 font-bold">描述消息</div>
    {{ record?.additionalInfo?.description }}
  </Drawer>
</template>
