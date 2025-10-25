<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{ getTitle.value || '· · · ·' }}
            <Tag class="text-base font-normal" color="success" v-if="record.default == true">{{
              t('tb.tenantProfile.table.default')
            }}</Tag>
          </span>
          <span class="text-sm">{{ t('tb.tenantProfile.detail.detail') }}</span>
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
          <Icon :icon="'ant-design:flag-outlined'" />{{ t('tb.tenantProfile.action.setDefault') }}
        </a-button>
        <a-button type="primary success" @click="handleEditTenantProfile">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.tenantProfile.action.edit') }}
        </a-button>
        <a-button type="primary" danger @click="handleDeleteTenantProfile">
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.tenantProfile.action.delete') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyTenantProfileId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.tenantProfile.detail.copyId') }}
        </a-button>
      </div>
      <Form ref="formRef" layout="vertical" :disabled="true">
        <Form.Item name="isolatedTbRuleEngine" :help="t('tb.tenantProfile.form.isolatedTip')">
          <Checkbox v-model:checked="record.isolatedTbRuleEngine">
            {{ t('tb.tenantProfile.form.isolatedLabel') }}
          </Checkbox>
        </Form.Item>
        <CollapseContainer
          :title="`${t('tb.tenantProfile.form.queue')}(${record.profileData?.queueConfiguration?.length})`"
          v-if="record.isolatedTbRuleEngine == true"
          class="border border-solid border-neutral-300 mb-4"
        >
          <CollapseContainer
            v-for="(queue, index) in record.profileData?.queueConfiguration"
            :key="index"
            :title="queue.name"
            class="border border-solid border-neutral-300 mb-4"
          >
            <Form.Item
              :label="t('tb.tenantProfile.form.queueName')"
              :name="['profileData', 'queueConfiguration', index, 'name']"
            >
              <Input :value="queue.name" :placeholder="t('tb.tenantProfile.form.queueNamePlaceholder')" />
            </Form.Item>
            <CollapseContainer
              :title="t('tb.tenantProfile.form.submitSettings')"
              class="border border-solid border-neutral-300 mb-4"
            >
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item :label="t('tb.tenantProfile.form.submitStrategy')">
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
                  <Form.Item
                    :label="t('tb.tenantProfile.form.batchSizeLabel')"
                    v-if="queue.submitStrategy.type == SubmitStrategyType.BATCH"
                  >
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="1000"
                      :min="1"
                      :value="queue.submitStrategy.batchSize"
                      :placeholder="t('tb.tenantProfile.form.batchSizeRequired')"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CollapseContainer>
            <CollapseContainer
              :title="t('tb.tenantProfile.form.retrySettings')"
              class="border border-solid border-neutral-300 mb-4"
            >
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item :label="t('tb.tenantProfile.form.processingStrategy')">
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
                  <Form.Item :label="t('tb.tenantProfile.form.retriesLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="3"
                      :min="0"
                      :value="queue.processingStrategy.retries"
                      :placeholder="t('tb.tenantProfile.form.retriesRequired')"
                    />
                  </Form.Item>
                  <Form.Item :label="t('tb.tenantProfile.form.failurePercentageLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="0"
                      :min="0"
                      :max="100"
                      :value="queue.processingStrategy.failurePercentage"
                      :placeholder="t('tb.tenantProfile.form.failurePercentageRequired')"
                    />
                  </Form.Item>
                  <Form.Item :label="t('tb.tenantProfile.form.pauseBetweenRetriesLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="3"
                      :min="0"
                      :value="queue.processingStrategy.pauseBetweenRetries"
                      :placeholder="t('tb.tenantProfile.form.pauseBetweenRetriesRequired')"
                      :addon-after="t('tb.tenantProfile.form.unitSecond')"
                    />
                  </Form.Item>
                  <Form.Item :label="t('tb.tenantProfile.form.maxPauseBetweenRetriesLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="3"
                      :min="0"
                      :value="queue.processingStrategy.maxPauseBetweenRetries"
                      :placeholder="t('tb.tenantProfile.form.maxPauseBetweenRetriesRequired')"
                      :addon-after="t('tb.tenantProfile.form.unitSecond')"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CollapseContainer>
            <CollapseContainer
              :title="t('tb.tenantProfile.form.pollSettings')"
              class="border border-solid border-neutral-300 mb-4"
            >
              {{ t('tb.tenantProfile.form.batchProcessing') }}
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item :label="t('tb.tenantProfile.form.pollIntervalLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="25"
                      :min="0"
                      :value="queue.pollInterval"
                      :placeholder="t('tb.tenantProfile.form.pollIntervalRequired')"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item :label="t('tb.tenantProfile.form.partitionsLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="10"
                      :min="1"
                      :value="queue.partitions"
                      :placeholder="t('tb.tenantProfile.form.partitionsRequired')"
                    />
                  </Form.Item>
                </Col>
              </Row>
              {{ t('tb.tenantProfile.form.instantProcessing') }}
              <Row :gutter="16">
                <Col :span="12">
                  <Form.Item label=" ">
                    <Checkbox :checked="queue.consumerPerPartition" :defaultChecked="false">
                      {{ t('tb.tenantProfile.form.consumerPerPartitionLabel') }}
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item :label="t('tb.tenantProfile.form.packProcessingTimeoutLabel')">
                    <InputNumber
                      :style="{ width: '90%' }"
                      :defaultValue="2000"
                      :min="0"
                      :value="queue.packProcessingTimeout"
                      :placeholder="t('tb.tenantProfile.form.packProcessingTimeoutRequired')"
                      :addon-after="t('tb.tenantProfile.form.unitMillisecond')"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CollapseContainer>
            <Form.Item
              :label="t('tb.tenantProfile.form.description')"
              :help="t('tb.tenantProfile.form.queueDescriptionHelp')"
            >
              <Textarea
                :value="queue.additionalInfo?.description"
                :placeholder="t('tb.tenantProfile.form.queueDescriptionPlaceholder')"
                :rows="3"
              />
            </Form.Item>
          </CollapseContainer>
        </CollapseContainer>
        <div class="h-4" v-if="record.isolatedTbRuleEngine == true"> </div>
        <CollapseContainer
          :title="t('tb.tenantProfile.form.configurationSettings')"
          class="border border-solid border-neutral-300 mb-4"
        >
          <Card size="small">
            <template #title>
              {{ t('tb.tenantProfile.form.entity') }}
              <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxDevices')"
                  :name="['profileData', 'configuration', 'maxDevices']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxDevices" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxAssets')"
                  :name="['profileData', 'configuration', 'maxAssets']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxAssets" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxCustomers')"
                  :name="['profileData', 'configuration', 'maxCustomers']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxCustomers" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxUsers')"
                  :name="['profileData', 'configuration', 'maxUsers']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxUsers" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxDashboards')"
                  :name="['profileData', 'configuration', 'maxDashboards']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxDashboards" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxRuleChains')"
                  :name="['profileData', 'configuration', 'maxRuleChains']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxRuleChains" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              {{ t('tb.tenantProfile.form.ruleEngine') }}
              <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxREExecutions')"
                  :name="['profileData', 'configuration', 'maxREExecutions']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxREExecutions" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxTransportMessages')"
                  :name="['profileData', 'configuration', 'maxTransportMessages']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxTransportMessages"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxJSExecutions')"
                  :name="['profileData', 'configuration', 'maxJSExecutions']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.maxJSExecutionsRequired') }]"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxJSExecutions" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxTransportDataPoints')"
                  :name="['profileData', 'configuration', 'maxTransportDataPoints']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxTransportDataPoints"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxRuleNodeExecutionsPerMessage')"
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
              {{ t('tb.tenantProfile.form.ttl') }}
              <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxDPStorageDays')"
                  :name="['profileData', 'configuration', 'maxDPStorageDays']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxDPStorageDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.alarmsTtlDays')"
                  :name="['profileData', 'configuration', 'alarmsTtlDays']"
                >
                  <InputNumber :value="record.profileData?.configuration?.alarmsTtlDays" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.defaultStorageTtlDays')"
                  :name="['profileData', 'configuration', 'defaultStorageTtlDays']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.defaultStorageTtlDays"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.rpcTtlDays')"
                  :name="['profileData', 'configuration', 'rpcTtlDays']"
                >
                  <InputNumber :value="record.profileData?.configuration?.rpcTtlDays" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" class="mt-4">
            <template #title>
              {{ t('tb.tenantProfile.form.alertsAndNotifications') }}
              <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxEmails')"
                  :name="['profileData', 'configuration', 'maxEmails']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxEmails" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxSms')"
                  :name="['profileData', 'configuration', 'maxSms']"
                >
                  <InputNumber :value="record.profileData?.configuration?.maxSms" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxCreatedAlarms')"
                  :name="['profileData', 'configuration', 'maxCreatedAlarms']"
                >
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
              {{ t('tb.tenantProfile.form.otaBytes') }}
              <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxResourcesInBytes')"
                  :name="['profileData', 'configuration', 'maxResourcesInBytes']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxResourcesInBytes"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxOtaPackagesInBytes')"
                  :name="['profileData', 'configuration', 'maxOtaPackagesInBytes']"
                >
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
              {{ t('tb.tenantProfile.form.websocket') }}
              <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
            </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxWsSessionsPerTenant')"
                  :name="['profileData', 'configuration', 'maxWsSessionsPerTenant']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSessionsPerTenant"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerTenant')"
                  :name="['profileData', 'configuration', 'maxWsSubscriptionsPerTenant']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSubscriptionsPerTenant"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxWsSessionsPerCustomer')"
                  :name="['profileData', 'configuration', 'maxWsSessionsPerCustomer']"
                >
                  <InputNumber
                    :value="record.profileData?.configuration?.maxWsSessionsPerCustomer"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerCustomer')"
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
                  :label="t('tb.tenantProfile.form.maxWsSessionsPerPublicUser')"
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
                  :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerPublicUser')"
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
                  :label="t('tb.tenantProfile.form.maxWsSessionsPerRegularUser')"
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
                  :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerRegularUser')"
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
                  :label="t('tb.tenantProfile.form.wsMsgQueueLimitPerSession')"
                  :help="t('tb.tenantProfile.form.wsMsgQueueHelp')"
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
            <template #title> {{ t('tb.tenantProfile.form.rateLimit') }} </template>
            <Row :gutter="20">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.transportTenantMsgRateLimit')"
                  :name="['profileData', 'configuration', 'transportTenantMsgRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.transportTenantMsgRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.transportDeviceMsgRateLimit')"
                  :name="['profileData', 'configuration', 'transportDeviceMsgRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.transportDeviceMsgRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.transportTenantTelemetryMsgRateLimit')"
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
                  :label="t('tb.tenantProfile.form.transportDeviceTelemetryMsgRateLimit')"
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
                  :label="t('tb.tenantProfile.form.transportTenantTelemetryDataPointsRateLimit')"
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
                  :label="t('tb.tenantProfile.form.transportDeviceTelemetryDataPointsRateLimit')"
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
                  :label="t('tb.tenantProfile.form.tenantServerRestLimitsConfiguration')"
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
                  :label="t('tb.tenantProfile.form.customerServerRestLimitsConfiguration')"
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
                <Form.Item
                  :label="t('tb.tenantProfile.form.tenantEntityImportRateLimit')"
                  :name="['profileData', 'configuration', 'tenantEntityImportRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantEntityImportRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.tenantEntityExportRateLimit')"
                  :name="['profileData', 'configuration', 'tenantEntityExportRateLimit']"
                >
                  <RateLimit
                    :value="record.profileData?.configuration?.tenantEntityExportRateLimit"
                    :edit="false"
                    :style="{ width: '100%' }"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.wsUpdatesPerSessionRateLimit')"
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
                  :label="t('tb.tenantProfile.form.cassandraQueryTenantRateLimitsConfiguration')"
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
                  :label="t('tb.tenantProfile.form.tenantNotificationRequestsRateLimit')"
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
                  :label="t('tb.tenantProfile.form.tenantNotificationRequestsPerRuleRateLimit')"
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
        <Form.Item :label="t('tb.tenantProfile.form.description')" name="description">
          <Textarea
            :value="record.description"
            :placeholder="t('tb.tenantProfile.form.descriptionPlaceholder')"
            :rows="3"
          />
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
    copyToClipboard(record.value.id.id, t('tb.tenantProfile.detail.copyIdSuccess'));
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
    .tbv3-basic-table {
      padding: 0;

      .tbv3-basic-table-header__header-top {
        margin-top: 0;
      }
    }
  }

  .detail-info-card {
    .tbv3-basic-table {
      padding: 0;

      .tbv3-basic-table-header__header-top {
        display: none;
      }
    }
  }
</style>
