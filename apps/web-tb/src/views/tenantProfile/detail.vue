<script lang="ts" setup>
import type { TenantProfile } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Switch,
  TabPane,
  Tabs,
  Textarea,
} from 'ant-design-vue';

import { getTenantProfileByIdApi } from '#/api';
import { CollapseContainer } from '#/components/Container';
import {
  PROCESSING_STRATEGY_OPTIONS,
  SUBMIT_STRATEGY_OPTIONS,
  SubmitStrategyType,
} from '#/constants';
import { copyToClipboard } from '#/utils';

import RateLimit from './RateLimit.vue';

defineOptions({
  name: 'TenantProfileDetailDrawer',
});
const emits = defineEmits(['edit', 'delete', 'default']);

const record = ref<null | TenantProfile>(null);
const tabActiveKey = ref('DETAIL');
const tabList = [
  {
    key: 'DETAIL',
    label: $t('page.tabs.detail'),
    icon: 'ant-design:appstore-outlined',
  },
  {
    key: 'TELEMETRY',
    label: $t('page.tabs.telemetry'),
    icon: 'ant-design:line-chart-outlined',
  },
  {
    key: 'ALARM',
    label: $t('page.tabs.alarm'),
    icon: 'ant-design:alert-outlined',
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('tenantProfile.detail')}`,
  overlayBlur: 0,
  footer: false,
  class: ['w-1/2'],

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getTenantProfileByIdApi(id);
      } else if (data) {
        record.value = data;
      }
    }
    drawerApi.setState({ loading: false });
  },
});

function reset() {
  record.value = null;
  tabActiveKey.value = 'DETAIL';
}

function handleEdit() {
  drawerApi.close();
  emits('edit', { ...record.value });
}
function handleDelete() {
  emits('delete', { ...record.value });
  drawerApi.close();
}
function handleDefault() {
  emits('default', { ...record.value });
  drawerApi.close();
}

function handleCopyId() {
  if (record?.value?.id) {
    copyToClipboard(record?.value?.id.id);
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
        <IconifyIcon class="size-8" icon="mdi:account-box-multiple" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.name }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('tenantProfile.detail') }}
          </p>
        </div>
      </div>
    </template>
    <template #prepend-content>
      <Tabs v-model:active-key="tabActiveKey" class="detail-tabs">
        <TabPane v-for="tab in tabList" :key="tab.key">
          <template #tab>
            <IconifyIcon :icon="tab.icon" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>

    <div v-if="tabActiveKey === 'DETAIL'">
      <div class="mb-2 flex space-x-4">
        <Button
          v-if="record?.default === false"
          type="primary"
          @click="handleDefault"
        >
          <IconifyIcon class="mb-1 size-4" icon="mdi:flag" />
          {{ $t('设为默认配置') }}
        </Button>
        <Button type="primary" @click="handleEdit">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
          {{ $t('tenantProfile.button.edit') }}
        </Button>
        <Button type="primary" danger @click="handleDelete">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
          {{ $t('tenantProfile.button.remove') }}
        </Button>
      </div>
      <div class="mb-2 flex space-x-4">
        <Button @click="handleCopyId">
          <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
          {{ $t('tenantProfile.button.copyId') }}
        </Button>
      </div>
      <Form layout="vertical" :disabled="true">
        <Form.Item
          label="配置名称"
          name="name"
          :rules="[{ required: true, message: '请输入配置名称!' }]"
        >
          <Input :value="record?.name" placeholder="请输入配置名称" />
        </Form.Item>
        <Form.Item name="default" v-show="false">
          <Checkbox :checked="record?.default" :default-checked="false" />
        </Form.Item>
        <Form.Item
          name="isolatedTbRuleEngine"
          help="每个独立租户需要单独的规则引擎微服务"
        >
          <Checkbox :checked="record?.isolatedTbRuleEngine">
            使用独立的规则引擎服务
          </Checkbox>
        </Form.Item>
        <CollapseContainer
          :title="`队列(${record?.profileData.queueConfiguration?.length})`"
          v-if="record?.isolatedTbRuleEngine === true"
          class="border-[hsl(var(--border)) mb-4 border border-solid"
        >
          <CollapseContainer
            v-for="(queue, index) in record?.profileData.queueConfiguration"
            :key="index"
            :title="queue.name"
            class="border-[hsl(var(--border)) mb-4 border border-solid"
          >
            <Form.Item
              label="队列名称"
              :name="['profileData', 'queueConfiguration', index, 'name']"
            >
              <Input
                :value="record?.profileData.queueConfiguration?.[index].name"
                :disabled="true"
                placeholder="请输入队列名称"
              />
            </Form.Item>
            <Form.Item
              label="topic"
              :name="['profileData', 'queueConfiguration', index, 'topic']"
              v-show="false"
            >
              <Input
                :value="record?.profileData.queueConfiguration?.[index].topic"
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
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'submitStrategy',
                      'type',
                    ]"
                    :rules="[{ required: true, message: '请选择提交策略!' }]"
                  >
                    <Radio.Group
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .submitStrategy.type
                      "
                    >
                      <Radio
                        :style="{
                          display: 'flex',
                          height: '30px',
                          lineHeight: '30px',
                          marginLeft: '30px',
                        }"
                        v-for="(option, optIndex) in SUBMIT_STRATEGY_OPTIONS"
                        :key="optIndex"
                        :value="option.value"
                      >
                        <div class="flex items-center gap-2">
                          <span>{{ option.label }}</span>
                          <IconifyIcon
                            v-tippy="{
                              theme: 'auto',
                              content: `${option.help}`,
                            }"
                            class="size-4"
                            icon="ant-design:info-circle-outlined"
                          />
                        </div>
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item
                    label="批量处理大小"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'submitStrategy',
                      'batchSize',
                    ]"
                    v-if="
                      record?.profileData.queueConfiguration &&
                      record?.profileData.queueConfiguration?.[index] &&
                      record?.profileData.queueConfiguration?.[index]
                        .submitStrategy.type === SubmitStrategyType.BATCH
                    "
                    :rules="[
                      { required: true, message: '请输入批量处理大小!' },
                    ]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="1000"
                      :min="1"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .submitStrategy.batchSize
                      "
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
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'processingStrategy',
                      'type',
                    ]"
                    :rules="[
                      { required: true, message: '请选择重试处理策略!' },
                    ]"
                  >
                    <Radio.Group
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .processingStrategy.type
                      "
                    >
                      <Radio
                        :style="{
                          display: 'flex',
                          height: '40px',
                          lineHeight: '40px',
                          marginLeft: '30px',
                        }"
                        v-for="(
                          option, optIndex
                        ) in PROCESSING_STRATEGY_OPTIONS"
                        :key="optIndex"
                        :value="option.value"
                      >
                        <div class="flex items-center gap-2">
                          <span>{{ option.label }}</span>
                          <IconifyIcon
                            v-tippy="{
                              theme: 'auto',
                              content: `${option.help}`,
                            }"
                            class="size-4"
                            icon="ant-design:info-circle-outlined"
                          />
                        </div>
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item
                    label="重试次数(0表示无限制)"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'processingStrategy',
                      'retries',
                    ]"
                    :rules="[{ required: true, message: '请输入重试次数!' }]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="3"
                      :min="0"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .processingStrategy.retries
                      "
                      placeholder="请输入重试次数"
                    />
                  </Form.Item>
                  <Form.Item
                    label="跳过重试的失败消息百分比"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'processingStrategy',
                      'failurePercentage',
                    ]"
                    :rules="[
                      {
                        required: true,
                        message: '请输入跳过重试的失败消息百分比!',
                      },
                    ]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="0"
                      :min="0"
                      :max="100"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .processingStrategy.failurePercentage
                      "
                      placeholder="请输入跳过重试的失败消息百分比"
                    />
                  </Form.Item>
                  <Form.Item
                    label="重试间隔"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'processingStrategy',
                      'pauseBetweenRetries',
                    ]"
                    :rules="[{ required: true, message: '请输入重试间隔!' }]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="3"
                      :min="0"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .processingStrategy.pauseBetweenRetries
                      "
                      placeholder="请输入重试间隔"
                      addon-after="秒"
                    />
                  </Form.Item>
                  <Form.Item
                    label="最大重试间隔"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'processingStrategy',
                      'maxPauseBetweenRetries',
                    ]"
                    :rules="[
                      { required: true, message: '请输入最大重试间隔!' },
                    ]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="3"
                      :min="0"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .processingStrategy.maxPauseBetweenRetries
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
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'pollInterval',
                    ]"
                    :rules="[{ required: true, message: '请输入轮训间隔!' }]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="25"
                      :min="0"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .pollInterval
                      "
                      placeholder="请输入轮训间隔"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item
                    label="分区"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'partitions',
                    ]"
                    :rules="[{ required: true, message: '请输入分区!' }]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="10"
                      :min="1"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .partitions
                      "
                      placeholder="请输入分区"
                    />
                  </Form.Item>
                </Col>
              </Row>
              即时处理
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item
                    label=" "
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'consumerPerPartition',
                    ]"
                  >
                    <Checkbox
                      :checked="
                        record?.profileData.queueConfiguration?.[index]
                          .consumerPerPartition
                      "
                      :default-checked="false"
                    >
                      每个分区消费者单独轮询消息
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item
                    label="处理超时"
                    :name="[
                      'profileData',
                      'queueConfiguration',
                      index,
                      'packProcessingTimeout',
                    ]"
                    :rules="[
                      { required: true, message: '请输入处理超时时间!' },
                    ]"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :default-value="2000"
                      :min="0"
                      :value="
                        record?.profileData.queueConfiguration?.[index]
                          .packProcessingTimeout
                      "
                      placeholder="请输入处理超时时间"
                      addon-after="毫秒"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CollapseContainer>
            <Form.Item
              label="描述信息"
              :name="[
                'profileData',
                'queueConfiguration',
                index,
                'additionalInfo',
                'description',
              ]"
              help="此文本将显示在队列说明中，而不是所选策略中"
            >
              <Textarea
                :value="
                  record?.profileData.queueConfiguration?.[index].additionalInfo
                    .description
                "
                placeholder="输入队列描述信息"
                :rows="3"
              />
            </Form.Item>
          </CollapseContainer>
        </CollapseContainer>
        <div class="h-4" v-if="record?.isolatedTbRuleEngine === true"></div>
        <CollapseContainer
          title="配置设置"
          class="border-[hsl(var(--border)) mb-4 border border-solid"
        >
          <Form.Item
            :name="['profileData', 'configuration', 'type']"
            v-show="false"
          >
            <Input
              :value="record?.profileData.configuration.type"
              default-value="DEFAULT"
            />
          </Form.Item>
          <Card size="small">
            <template #title>
              实体
              <span class="text-muted-foreground"> (0 表示无限制) </span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="最大设备数"
                  :name="['profileData', 'configuration', 'maxDevices']"
                  :rules="[{ required: true, message: '请输入最大设备数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxDevices"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大资产数"
                  :name="['profileData', 'configuration', 'maxAssets']"
                  :rules="[{ required: true, message: '请输入最大资产数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxAssets"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大客户数"
                  :name="['profileData', 'configuration', 'maxCustomers']"
                  :rules="[{ required: true, message: '请输入最大客户数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxCustomers"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大用户数"
                  :name="['profileData', 'configuration', 'maxUsers']"
                  :rules="[{ required: true, message: '请输入最大用户数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxUsers"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大仪表盘数"
                  :name="['profileData', 'configuration', 'maxDashboards']"
                  :rules="[{ required: true, message: '请输入最大仪表盘数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxDashboards"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大规则链数"
                  :name="['profileData', 'configuration', 'maxRuleChains']"
                  :rules="[{ required: true, message: '请输入最大规则链数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxRuleChains"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大Edge数"
                  :name="['profileData', 'configuration', 'maxEdges']"
                  :rules="[{ required: true, message: '请输入最大Edge数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxEdges"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title>
              规则引擎
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="最大规则引擎执行数"
                  :name="['profileData', 'configuration', 'maxREExecutions']"
                  :rules="[
                    { required: true, message: '请输入最大规则引擎执行数!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxREExecutions"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大传输消息数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxTransportMessages',
                  ]"
                  :rules="[
                    { required: true, message: '请输入最大传输消息数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxTransportMessages
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大 JavaScript 执行数"
                  :name="['profileData', 'configuration', 'maxJSExecutions']"
                  :rules="[
                    {
                      required: true,
                      message: '请输入最大 JavaScript 执行数!',
                    },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxJSExecutions"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大 TBEL 执行数"
                  :name="['profileData', 'configuration', 'maxTbelExecutions']"
                  :rules="[
                    { required: true, message: '请输入最大 TBEL 执行数!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxTbelExecutions"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="每条消息的最大规则节点执行数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxRuleNodeExecutionsPerMessage',
                  ]"
                  :rules="[
                    {
                      required: true,
                      message: '请输入每条消息的最大规则节点执行数!',
                    },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxRuleNodeExecutionsPerMessage
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大传输数据点数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxTransportDataPoints',
                  ]"
                  :rules="[
                    { required: true, message: '请输入最大传输数据点数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxTransportDataPoints
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title>
              计算属性
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="实体最大计算点位数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxCalculatedFieldsPerEntity',
                  ]"
                  :rules="[
                    { required: true, message: '请输入实体最大计算点位数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxCalculatedFieldsPerEntity
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="maxDataPointsPerRollingArg"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxDataPointsPerRollingArg',
                  ]"
                  :rules="[
                    {
                      required: true,
                      message: '请输入maxDataPointsPerRollingArg!',
                    },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxDataPointsPerRollingArg
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="maxArgumentsPerCF"
                  :name="['profileData', 'configuration', 'maxArgumentsPerCF']"
                  :rules="[
                    {
                      required: true,
                      message: '请输入maxArgumentsPerCF!',
                    },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxArgumentsPerCF"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="maxStateSizeInKBytes"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxStateSizeInKBytes',
                  ]"
                  :rules="[
                    {
                      required: true,
                      message: '请输入maxStateSizeInKBytes!',
                    },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxStateSizeInKBytes
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="maxSingleValueArgumentSizeInKBytes"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxSingleValueArgumentSizeInKBytes',
                  ]"
                  :rules="[
                    {
                      required: true,
                      message: '请输入maxSingleValueArgumentSizeInKBytes!',
                    },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxSingleValueArgumentSizeInKBytes
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title>
              TTL
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="最大存储点天"
                  :name="['profileData', 'configuration', 'maxDPStorageDays']"
                  :rules="[{ required: true, message: '请输入最大存储点天!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxDPStorageDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="告警TTL天数"
                  :name="['profileData', 'configuration', 'alarmsTtlDays']"
                  :rules="[{ required: true, message: '请输入告警TTL天数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.alarmsTtlDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="默认存储TTL天数"
                  :name="[
                    'profileData',
                    'configuration',
                    'defaultStorageTtlDays',
                  ]"
                  :rules="[
                    { required: true, message: '请输入默认存储TTL天数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.defaultStorageTtlDays
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="RPC TTL天数"
                  :name="['profileData', 'configuration', 'rpcTtlDays']"
                  :rules="[{ required: true, message: '请输入RPC TTL天数!' }]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.rpcTtlDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="队列统计信息TTL天数"
                  :name="['profileData', 'configuration', 'queueStatsTtlDays']"
                  :rules="[
                    { required: true, message: '请输入队列统计信息TTL天数!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.queueStatsTtlDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="规则引擎异常TTL天数"
                  :name="[
                    'profileData',
                    'configuration',
                    'ruleEngineExceptionsTtlDays',
                  ]"
                  :rules="[
                    { required: true, message: '请输入规则引擎异常TTL天数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .ruleEngineExceptionsTtlDays
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title>
              告警与通知
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="启动短信"
                  :name="['profileData', 'configuration', 'smsEnabled']"
                  :rules="[{ required: true }]"
                >
                  <div class="ml-2 space-x-2">
                    <Switch
                      size="small"
                      :checked="record?.profileData.configuration.smsEnabled"
                    />
                    <span>启动短信</span>
                  </div>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大短信发送数"
                  :name="['profileData', 'configuration', 'maxSms']"
                  :rules="[
                    { required: true, message: '请输入最大短信发送数!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxSms"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大电子邮件发送数"
                  :name="['profileData', 'configuration', 'maxEmails']"
                  :rules="[
                    { required: true, message: '请输入最大电子邮件发送数!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxEmails"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大创建告警数"
                  :name="['profileData', 'configuration', 'maxCreatedAlarms']"
                  :rules="[
                    { required: true, message: '请输入最大创建告警数!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxCreatedAlarms"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title> 调试 </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="最大调试时长"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxDebugModeDurationMinutes',
                  ]"
                  :rules="[{ required: true, message: '请输入最大调试时长!' }]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxDebugModeDurationMinutes
                    "
                    :style="{ width: '100%' }"
                    addon-after="分钟"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title>
              OTA文件(字节)
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="资源文件总大小"
                  :name="['profileData', 'configuration', 'maxResourceSize']"
                  :rules="[
                    { required: true, message: '请输入资源文件总大小!' },
                  ]"
                >
                  <InputNumber
                    :value="record?.profileData.configuration.maxResourceSize"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大资源文件大小(字节)"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxResourcesInBytes',
                  ]"
                  :rules="[
                    { required: true, message: '最大资源文件大小(字节)!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxResourcesInBytes
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="OTA包文件总大小"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxOtaPackagesInBytes',
                  ]"
                  :rules="[
                    { required: true, message: '请输入OTA包文件总大小!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxOtaPackagesInBytes
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title>
              WebSocket
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="租户最大会话数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSessionsPerTenant',
                  ]"
                  :rules="[
                    { required: true, message: '请输入租户最大会话数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxWsSessionsPerTenant
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="租户最大订阅数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSubscriptionsPerTenant',
                  ]"
                  :rules="[
                    { required: true, message: '请输入租户最大订阅数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxWsSubscriptionsPerTenant
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="客户最大会话数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSessionsPerCustomer',
                  ]"
                  :rules="[
                    { required: true, message: '请输入客户最大会话数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration.maxWsSessionsPerCustomer
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="客户最大订阅数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSubscriptionsPerCustomer',
                  ]"
                  :rules="[
                    { required: true, message: '请输入客户最大订阅数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxWsSubscriptionsPerCustomer
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="公共用户最大会话数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSessionsPerPublicUser',
                  ]"
                  :rules="[
                    { required: true, message: '请输入公共用户最大会话数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxWsSessionsPerPublicUser
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="公共用户最大订阅数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSubscriptionsPerPublicUser',
                  ]"
                  :rules="[
                    { required: true, message: '请输入公共用户最大订阅数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxWsSubscriptionsPerPublicUser
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="普通用户最大会话数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSessionsPerRegularUser',
                  ]"
                  :rules="[
                    { required: true, message: '请输入普通用户最大会话数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxWsSessionsPerRegularUser
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="普通用户最大订阅数"
                  :name="[
                    'profileData',
                    'configuration',
                    'maxWsSubscriptionsPerRegularUser',
                  ]"
                  :rules="[
                    { required: true, message: '请输入普通用户最大订阅数!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .maxWsSubscriptionsPerRegularUser
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="会话最大消息队列大小"
                  help="队列的大小也受到系统配置的限制"
                  :name="[
                    'profileData',
                    'configuration',
                    'wsMsgQueueLimitPerSession',
                  ]"
                  :rules="[
                    { required: true, message: '请输入会话最大消息队列大小!' },
                  ]"
                >
                  <InputNumber
                    :value="
                      record?.profileData.configuration
                        .wsMsgQueueLimitPerSession
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div class="h-4"></div>
          <Card size="small">
            <template #title> 速率限制 </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  label="传输租户消息"
                  :name="[
                    'profileData',
                    'configuration',
                    'transportTenantMsgRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .transportTenantMsgRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输设备消息"
                  :name="[
                    'profileData',
                    'configuration',
                    'transportDeviceMsgRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .transportDeviceMsgRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输租户遥测消息"
                  :name="[
                    'profileData',
                    'configuration',
                    'transportTenantTelemetryMsgRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .transportTenantTelemetryMsgRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输设备遥测消息"
                  :name="[
                    'profileData',
                    'configuration',
                    'transportDeviceTelemetryMsgRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .transportDeviceTelemetryMsgRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输租户遥测消息点数"
                  :name="[
                    'profileData',
                    'configuration',
                    'transportTenantTelemetryDataPointsRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .transportTenantTelemetryDataPointsRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输设备遥测消息点数"
                  :name="[
                    'profileData',
                    'configuration',
                    'transportDeviceTelemetryDataPointsRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .transportDeviceTelemetryDataPointsRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="租户REST请求"
                  :name="[
                    'profileData',
                    'configuration',
                    'tenantServerRestLimitsConfiguration',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .tenantServerRestLimitsConfiguration
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="客户REST请求"
                  :name="[
                    'profileData',
                    'configuration',
                    'customerServerRestLimitsConfiguration',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .customerServerRestLimitsConfiguration
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="实体版本创建"
                  :name="[
                    'profileData',
                    'configuration',
                    'tenantEntityImportRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .tenantEntityImportRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="实体版本加载"
                  :name="[
                    'profileData',
                    'configuration',
                    'tenantEntityExportRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .tenantEntityExportRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="WebSocket会话更新"
                  :name="[
                    'profileData',
                    'configuration',
                    'wsUpdatesPerSessionRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .wsUpdatesPerSessionRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="Cassandra租户查询"
                  :name="[
                    'profileData',
                    'configuration',
                    'cassandraQueryTenantRateLimitsConfiguration',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .cassandraQueryTenantRateLimitsConfiguration
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="通知请求"
                  :name="[
                    'profileData',
                    'configuration',
                    'tenantNotificationRequestsRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .tenantNotificationRequestsRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="每个规则通知请求"
                  :name="[
                    'profileData',
                    'configuration',
                    'tenantNotificationRequestsPerRuleRateLimit',
                  ]"
                >
                  <RateLimit
                    :edit="false"
                    :value="
                      record?.profileData.configuration
                        .tenantNotificationRequestsPerRuleRateLimit
                    "
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </CollapseContainer>
        <Form.Item label="描述信息" name="description">
          <Textarea
            :value="record?.description"
            placeholder="输入配置描述信息"
            :rows="3"
          />
        </Form.Item>
      </Form>
    </div>
  </Drawer>
</template>
