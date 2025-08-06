<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{ getTitle.value || '· · · ·' }}
            <Tag class="text-base font-normal" color="success" v-if="record.default == true">默认</Tag>
          </span>
          <span class="text-sm">租户配置详情</span>
        </div>
      </div>
    </template>
    <template #prependContent>
      <Tabs v-model:active-key="tabActiveKey" class="tb-detail-menu">
        <TabPane v-for="tab in tabList" :key="tab.key">
          <template #tab>
            <Icon :icon="tab.icon" :size="16" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>
    <div v-show="tabActiveKey == DetailTabItemEnum.DETAIL.key">
      <div class="space-x-4">
        <a-button type="primary" v-if="!!!record?.default" @click="handleSetDefault">
          <Icon :icon="'ant-design:flag-outlined'" />设为默认租户配置
        </a-button>
        <a-button type="primary success" @click="handleEditTenantProfile">
          <Icon :icon="'i-clarity:note-edit-line'" />编辑租户配置
        </a-button>
        <a-button type="primary" danger @click="handleDeleteTenantProfile">
          <Icon :icon="'ant-design:delete-outlined'" />租删租户配置
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyTenantProfileId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制租户配置ID
        </a-button>
      </div>
      <Form ref="formRef" layout="vertical" :disabled="true">
        <Form.Item name="isolatedTbRuleEngine" help="每个独立租户需要单独的规则引擎微服务">
          <Checkbox v-model:checked="record.isolatedTbRuleEngine"> 使用独立的规则引擎服务 </Checkbox>
        </Form.Item>
        <CollapseContainer
          :title="`队列(${record.profileData?.queueConfiguration?.length})`"
          v-if="record.isolatedTbRuleEngine == true"
          class="border border-solid border-neutral-300 mb-4"
        >
          <CollapseContainer
            v-for="(queue, index) in record.profileData?.queueConfiguration"
            :key="index"
            :title="queue.name"
            class="border border-solid border-neutral-300 mb-4"
          >
            <Form.Item label="队列名称" :name="['profileData', 'queueConfiguration', index, 'name']">
              <Input :value="queue.name" placeholder="请输入队列名称" />
            </Form.Item>
            <CollapseContainer title="提交设置" class="border border-solid border-neutral-300 mb-4">
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item label="提交策略">
                    <Radio.Group :value="queue.submitStrategy.type">
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
                  <Form.Item label="批量处理大小" v-if="queue.submitStrategy.type == SubmitStrategyType.BATCH">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="1000"
                      :min="1"
                      :value="queue.submitStrategy.batchSize"
                      placeholder="请输入批量处理大小"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CollapseContainer>
            <CollapseContainer title="重试处理设置" class="border border-solid border-neutral-300 mb-4">
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item label="处理策略">
                    <Radio.Group :value="queue.processingStrategy.type">
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
                  <Form.Item label="重试次数(0表示无限制)">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="3"
                      :min="0"
                      :value="queue.processingStrategy.retries"
                      placeholder="请输入重试次数"
                    />
                  </Form.Item>
                  <Form.Item label="跳过重试的失败消息百分比">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="0"
                      :min="0"
                      :max="100"
                      :value="queue.processingStrategy.failurePercentage"
                      placeholder="请输入跳过重试的失败消息百分比"
                    />
                  </Form.Item>
                  <Form.Item label="重试间隔">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="3"
                      :min="0"
                      :value="queue.processingStrategy.pauseBetweenRetries"
                      placeholder="请输入重试间隔"
                      addon-after="秒"
                    />
                  </Form.Item>
                  <Form.Item label="最大重试间隔">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="3"
                      :min="0"
                      :value="queue.processingStrategy.maxPauseBetweenRetries"
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
                  <Form.Item label="轮训间隔">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="25"
                      :min="0"
                      :value="queue.pollInterval"
                      placeholder="请输入轮训间隔"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="分区">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="10"
                      :min="1"
                      :value="queue.partitions"
                      placeholder="请输入分区"
                    />
                  </Form.Item>
                </Col>
              </Row>
              即时处理
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item label=" ">
                    <Checkbox :checked="queue.consumerPerPartition" :defaultChecked="false">
                      每个分区消费者单独轮询消息
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="处理超时">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="2000"
                      :min="0"
                      :value="queue.packProcessingTimeout"
                      placeholder="请输入处理超时时间"
                      addon-after="毫秒"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CollapseContainer>
            <Form.Item label="描述信息" help="此文本将显示在队列说明中，而不是所选策略中">
              <Textarea :value="queue.additionalInfo?.description" placeholder="输入队列描述信息" :rows="3" />
            </Form.Item>
          </CollapseContainer>
        </CollapseContainer>
        <div class="h-4" v-if="record.isolatedTbRuleEngine == true"> </div>
        <CollapseContainer title="配置设置" class="border border-solid border-neutral-300 mb-4">
          <Card size="small">
            <template #title>
              实体
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="最大设备数" :name="['profileData', 'configuration', 'maxDevices']">
                  <InputNumber :value="record.profileData?.configuration?.maxDevices" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大资产数" :name="['profileData', 'configuration', 'maxAssets']">
                  <InputNumber :value="record.profileData?.configuration?.maxAssets" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大客户数" :name="['profileData', 'configuration', 'maxCustomers']">
                  <InputNumber :value="record.profileData?.configuration?.maxCustomers" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大用户数" :name="['profileData', 'configuration', 'maxUsers']">
                  <InputNumber :value="record.profileData?.configuration?.maxUsers" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大仪表盘数" :name="['profileData', 'configuration', 'maxDashboards']">
                  <InputNumber :value="record.profileData?.configuration?.maxDashboards" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大规则链数" :name="['profileData', 'configuration', 'maxRuleChains']">
                  <InputNumber :value="record.profileData?.configuration?.maxRuleChains" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              规则引擎
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="最大规则引擎执行数" :name="['profileData', 'configuration', 'maxREExecutions']">
                  <InputNumber :value="record.profileData?.configuration?.maxREExecutions" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大传输消息数" :name="['profileData', 'configuration', 'maxTransportMessages']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxTransportMessages"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大 JavaScript 执行数"
                  :name="['profileData', 'configuration', 'maxJSExecutions']"
                  :rules="[{ required: true, message: '请输入最大 JavaScript 执行数!' }]"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxJSExecutions" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大传输数据点数" :name="['profileData', 'configuration', 'maxTransportDataPoints']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxTransportDataPoints"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="每条消息的最大规则节点执行数"
                  :name="['profileData', 'configuration', 'maxRuleNodeExecutionsPerMessage']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxRuleNodeExecutionsPerMessage"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              TTL
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="最大存储点天" :name="['profileData', 'configuration', 'maxDPStorageDays']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxDPStorageDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="告警TTL天数" :name="['profileData', 'configuration', 'alarmsTtlDays']">
                  <InputNumber :value="record.profileData?.configuration?.alarmsTtlDays" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="默认存储TTL天数" :name="['profileData', 'configuration', 'defaultStorageTtlDays']">
                  <InputNumber
                    :value="record.profileData?.configuration?.defaultStorageTtlDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="RPC TTL天数" :name="['profileData', 'configuration', 'rpcTtlDays']">
                  <InputNumber :value="record.profileData?.configuration?.rpcTtlDays" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              告警与通知
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="最大电子邮件发送数" :name="['profileData', 'configuration', 'maxEmails']">
                  <InputNumber :value="record.profileData?.configuration?.maxEmails" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大短信发送数" :name="['profileData', 'configuration', 'maxSms']">
                  <InputNumber :value="record.profileData?.configuration?.maxSms" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大创建告警数" :name="['profileData', 'configuration', 'maxCreatedAlarms']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxCreatedAlarms"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              OTA文件(字节)
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="资源文件总大小" :name="['profileData', 'configuration', 'maxResourcesInBytes']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxResourcesInBytes"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="OTA包文件总大小" :name="['profileData', 'configuration', 'maxOtaPackagesInBytes']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxOtaPackagesInBytes"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              WebSocket
              <span class="text-help">0 表示无限制</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="租户最大会话数" :name="['profileData', 'configuration', 'maxWsSessionsPerTenant']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSessionsPerTenant"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="租户最大订阅数"
                  :name="['profileData', 'configuration', 'maxWsSubscriptionsPerTenant']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSubscriptionsPerTenant"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="客户最大会话数" :name="['profileData', 'configuration', 'maxWsSessionsPerCustomer']">
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSessionsPerCustomer"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="客户最大订阅数"
                  :name="['profileData', 'configuration', 'maxWsSubscriptionsPerCustomer']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSubscriptionsPerCustomer"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="公共用户最大会话数"
                  :name="['profileData', 'configuration', 'maxWsSessionsPerPublicUser']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSessionsPerPublicUser"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="公共用户最大订阅数"
                  :name="['profileData', 'configuration', 'maxWsSubscriptionsPerPublicUser']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSubscriptionsPerPublicUser"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="普通用户最大会话数"
                  :name="['profileData', 'configuration', 'maxWsSessionsPerRegularUser']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSessionsPerRegularUser"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="普通用户最大订阅数"
                  :name="['profileData', 'configuration', 'maxWsSubscriptionsPerRegularUser']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSubscriptionsPerRegularUser"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="会话最大消息队列大小"
                  help="队列的大小也受到系统配置的限制"
                  :name="['profileData', 'configuration', 'wsMsgQueueLimitPerSession']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.wsMsgQueueLimitPerSession"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title> 速率限制 </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item label="传输租户消息" :name="['profileData', 'configuration', 'transportTenantMsgRateLimit']">
                  <RateLimit
                    :value="record.profileData?.configuration?.transportTenantMsgRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="传输设备消息" :name="['profileData', 'configuration', 'transportDeviceMsgRateLimit']">
                  <RateLimit
                    :value="record.profileData?.configuration?.transportDeviceMsgRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输租户遥测消息"
                  :name="['profileData', 'configuration', 'transportTenantTelemetryMsgRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.transportTenantTelemetryMsgRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输设备遥测消息"
                  :name="['profileData', 'configuration', 'transportDeviceTelemetryMsgRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.transportDeviceTelemetryMsgRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输租户遥测消息点数"
                  :name="['profileData', 'configuration', 'transportTenantTelemetryDataPointsRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.transportTenantTelemetryDataPointsRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="传输设备遥测消息点数"
                  :name="['profileData', 'configuration', 'transportDeviceTelemetryDataPointsRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.transportDeviceTelemetryDataPointsRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="租户REST请求"
                  :name="['profileData', 'configuration', 'tenantServerRestLimitsConfiguration']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantServerRestLimitsConfiguration"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="客户REST请求"
                  :name="['profileData', 'configuration', 'customerServerRestLimitsConfiguration']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.customerServerRestLimitsConfiguration"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="实体版本创建" :name="['profileData', 'configuration', 'tenantEntityImportRateLimit']">
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantEntityImportRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="实体版本加载" :name="['profileData', 'configuration', 'tenantEntityExportRateLimit']">
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantEntityExportRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="WebSocket会话更新"
                  :name="['profileData', 'configuration', 'wsUpdatesPerSessionRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.wsUpdatesPerSessionRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="Cassandra租户查询"
                  :name="['profileData', 'configuration', 'cassandraQueryTenantRateLimitsConfiguration']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.cassandraQueryTenantRateLimitsConfiguration"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="通知请求"
                  :name="['profileData', 'configuration', 'tenantNotificationRequestsRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantNotificationRequestsRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="每个规则通知请求"
                  :name="['profileData', 'configuration', 'tenantNotificationRequestsPerRuleRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantNotificationRequestsPerRuleRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </CollapseContainer>
        <Form.Item label="描述信息" name="description">
          <Textarea :value="record.description" placeholder="输入配置描述信息" :rows="3" />
        </Form.Item>
      </Form>
    </div>
    <Telemetry
      v-if="tabActiveKey == DetailTabItemEnum.TELEMETRY.key"
      :entityType="EntityType.TENANT_PROFILE"
      :entityId="record?.id?.id"
    />
    <Alarm
      v-if="tabActiveKey == DetailTabItemEnum.ALARM.key"
      :entityType="EntityType.TENANT_PROFILE"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbTenantProfileDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import RateLimit from './RateLimit.vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { CollapseContainer } from '/@/components/Container';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { TenantProfile, getTenantProfileById } from '/@/api/tb/tenantProfile';
  import {
    Tabs,
    TabPane,
    Tag,
    Form,
    Checkbox,
    Input,
    InputNumber,
    Radio,
    Tooltip,
    Textarea,
    Row,
    Col,
    Card,
  } from 'ant-design-vue';
  import { SUBMIT_STRATEGY_OPTIONS, PROCESSING_STRATEGY_OPTIONS, SubmitStrategyType } from '/@/enums/queueEnum';

  import Alarm from '/@/views/tb/alarm/list.vue';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';

  const emit = defineEmits(['edit', 'delete', 'default', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<TenantProfile>({} as TenantProfile);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = [DetailTabItemEnum.DETAIL, DetailTabItemEnum.TELEMETRY, DetailTabItemEnum.ALARM];
  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await getTenantProfileById(data.id.id);
      ({ data: record.value });
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
    record.value = {} as TenantProfile;
    tabActiveKey.value = 'DETAIL';
  }

  function handleCopyTenantProfileId() {
    copyToClipboard(record.value.id.id, '复制租户配置ID成功！');
  }

  function handleDeleteTenantProfile() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditTenantProfile() {
    emit('edit', record.value);
    closeDrawer();
  }

  function handleSetDefault() {
    emit('default', record.value);
    closeDrawer();
  }
</script>
<style lang="less">
  .telemetry-card {
    .jeesite-basic-table {
      padding: 0;

      .jeesite-basic-table-header__header-top {
        margin-top: 0;
      }
    }
  }

  .detail-info-card {
    .jeesite-basic-table {
      padding: 0;

      .jeesite-basic-table-header__header-top {
        display: none;
      }
    }
  }
</style>
