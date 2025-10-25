<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item
        :label="t('tb.tenantProfile.table.name')"
        name="name"
        :rules="[{ required: true, message: t('tb.tenantProfile.form.nameRequired') }]"
      >
        <Input v-model:value="formState.name" :placeholder="t('tb.tenantProfile.form.namePlaceholder')" />
      </Form.Item>
      <Form.Item name="default" v-show="false">
        <Checkbox v-model:checked="formState.default" :defaultChecked="false" />
      </Form.Item>
      <Form.Item name="isolatedTbRuleEngine" :help="t('tb.tenantProfile.form.isolatedTip')">
        <Checkbox v-model:checked="formState.isolatedTbRuleEngine" @change="handleIsolatedTbRuleEngineChange">
          {{ t('tb.tenantProfile.form.isolatedLabel') }}
        </Checkbox>
      </Form.Item>
      <CollapseContainer
        :title="`${t('tb.tenantProfile.form.queue')}(${formState.profileData.queueConfiguration?.length})`"
        v-if="formState.isolatedTbRuleEngine == true"
        class="border border-solid border-neutral-300 mb-4"
      >
        <CollapseContainer
          v-for="(queue, index) in formState.profileData.queueConfiguration"
          :key="index"
          :title="queue.name"
          class="border border-solid border-neutral-300 mb-4"
        >
          <template #action>
            <Tooltip :title="t('common.delText')" class="mr-2" v-if="index != 0">
              <Icon
                class="cursor-pointer"
                :icon="'ant-design:delete-outlined'"
                color="red"
                :size="20"
                @click="handleDeleteQueue(index)"
              />
            </Tooltip>
          </template>
          <Form.Item
            :label="t('tb.tenantProfile.form.queueName')"
            :name="['profileData', 'queueConfiguration', index, 'name']"
            :rules="[
              { required: true, message: t('tb.tenantProfile.form.queueNameRequired') },
              {
                pattern: /^[a-zA-Z0-9_-]*$/,
                message: t('tb.tenantProfile.form.queueNamePattern'),
                trigger: ['change', 'blur'],
              },
            ]"
          >
            <Input
              v-model:value="formState.profileData.queueConfiguration[index].name"
              :disabled="index == 0"
              :placeholder="t('tb.tenantProfile.form.queueNamePlaceholder')"
              @change="
                () =>
                  (formState.profileData.queueConfiguration[index].topic =
                    `tb_rule_engine.${formState.profileData.queueConfiguration[index].name}`)
              "
            />
          </Form.Item>
          <Form.Item label="topic" :name="['profileData', 'queueConfiguration', index, 'topic']" v-show="false">
            <Input v-model:value="formState.profileData.queueConfiguration[index].topic" />
          </Form.Item>
          <CollapseContainer
            :title="t('tb.tenantProfile.form.submitSettings')"
            class="border border-solid border-neutral-300 mb-4"
          >
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.submitStrategy')"
                  :name="['profileData', 'queueConfiguration', index, 'submitStrategy', 'type']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.submitStrategyRequired') }]"
                >
                  <Radio.Group v-model:value="formState.profileData.queueConfiguration[index].submitStrategy.type">
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
                  :name="['profileData', 'queueConfiguration', index, 'submitStrategy', 'batchSize']"
                  v-if="formState.profileData.queueConfiguration[index].submitStrategy.type == SubmitStrategyType.BATCH"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.batchSizeRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="1000"
                    :min="1"
                    v-model:value="formState.profileData.queueConfiguration[index].submitStrategy.batchSize"
                    :placeholder="t('tb.tenantProfile.form.batchSizeLabel')"
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
                <Form.Item
                  :label="t('tb.tenantProfile.form.processingStrategy')"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'type']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.processingStrategyRequired') }]"
                >
                  <Radio.Group v-model:value="formState.profileData.queueConfiguration[index].processingStrategy.type">
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
                  :label="t('tb.tenantProfile.form.retriesLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'retries']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.retriesRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="3"
                    :min="0"
                    v-model:value="formState.profileData.queueConfiguration[index].processingStrategy.retries"
                    :placeholder="t('tb.tenantProfile.form.retriesLabel')"
                  />
                </Form.Item>
                <Form.Item
                  :label="t('tb.tenantProfile.form.failurePercentageLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'failurePercentage']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.failurePercentageRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="0"
                    :min="0"
                    :max="100"
                    v-model:value="formState.profileData.queueConfiguration[index].processingStrategy.failurePercentage"
                    :placeholder="t('tb.tenantProfile.form.failurePercentageLabel')"
                  />
                </Form.Item>
                <Form.Item
                  :label="t('tb.tenantProfile.form.pauseBetweenRetriesLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'pauseBetweenRetries']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.pauseBetweenRetriesRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="3"
                    :min="0"
                    v-model:value="
                      formState.profileData.queueConfiguration[index].processingStrategy.pauseBetweenRetries
                    "
                    :placeholder="t('tb.tenantProfile.form.pauseBetweenRetriesLabel')"
                    :addon-after="t('tb.tenantProfile.form.unitSecond')"
                  />
                </Form.Item>
                <Form.Item
                  :label="t('tb.tenantProfile.form.maxPauseBetweenRetriesLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'maxPauseBetweenRetries']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.maxPauseBetweenRetriesRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="3"
                    :min="0"
                    v-model:value="
                      formState.profileData.queueConfiguration[index].processingStrategy.maxPauseBetweenRetries
                    "
                    :placeholder="t('tb.tenantProfile.form.maxPauseBetweenRetriesLabel')"
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
                <Form.Item
                  :label="t('tb.tenantProfile.form.pollIntervalLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'pollInterval']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.pollIntervalRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="25"
                    :min="0"
                    v-model:value="formState.profileData.queueConfiguration[index].pollInterval"
                    :placeholder="t('tb.tenantProfile.form.pollIntervalLabel')"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.partitionsLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'partitions']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.partitionsRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="10"
                    :min="1"
                    v-model:value="formState.profileData.queueConfiguration[index].partitions"
                    :placeholder="t('tb.tenantProfile.form.partitionsLabel')"
                  />
                </Form.Item>
              </Col>
            </Row>
            {{ t('tb.tenantProfile.form.instantProcessing') }}
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label=" " :name="['profileData', 'queueConfiguration', index, 'consumerPerPartition']">
                  <Checkbox
                    v-model:checked="formState.profileData.queueConfiguration[index].consumerPerPartition"
                    :defaultChecked="false"
                  >
                    {{ t('tb.tenantProfile.form.consumerPerPartitionLabel') }}
                  </Checkbox>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.tenantProfile.form.packProcessingTimeoutLabel')"
                  :name="['profileData', 'queueConfiguration', index, 'packProcessingTimeout']"
                  :rules="[{ required: true, message: t('tb.tenantProfile.form.packProcessingTimeoutRequired') }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="2000"
                    :min="0"
                    v-model:value="formState.profileData.queueConfiguration[index].packProcessingTimeout"
                    :placeholder="t('tb.tenantProfile.form.packProcessingTimeoutLabel')"
                    :addon-after="t('tb.tenantProfile.form.unitMillisecond')"
                  />
                </Form.Item>
              </Col>
            </Row>
          </CollapseContainer>
          <Form.Item
            :label="t('tb.tenantProfile.form.description')"
            :name="['profileData', 'queueConfiguration', index, 'additionalInfo', 'description']"
            :help="t('tb.tenantProfile.form.queueDescriptionHelp')"
          >
            <Textarea
              v-model:value="formState.profileData.queueConfiguration[index].additionalInfo.description"
              :placeholder="t('tb.tenantProfile.form.queueDescriptionPlaceholder')"
              :rows="3"
            />
          </Form.Item>
        </CollapseContainer>
        <a-button type="primary" @click="handleAddQueue" size="small">
          <Icon icon="i-fluent:add-12-filled" />{{ t('tb.tenantProfile.action.addQueue') }}
        </a-button>
      </CollapseContainer>
      <div class="h-4" v-if="formState.isolatedTbRuleEngine == true"></div>
      <CollapseContainer
        :title="t('tb.tenantProfile.form.configurationSettings')"
        class="border border-solid border-neutral-300 mb-4"
      >
        <Form.Item :name="['profileData', 'configuration', 'type']" v-show="false">
          <Input v-model:value="formState.profileData.configuration.type" :defaultValue="'DEFAULT'" />
        </Form.Item>
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
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxDevicesRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxDevices"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxAssets')"
                :name="['profileData', 'configuration', 'maxAssets']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxAssetsRequired') }]"
              >
                <InputNumber v-model:value="formState.profileData.configuration.maxAssets" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxCustomers')"
                :name="['profileData', 'configuration', 'maxCustomers']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxCustomersRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxCustomers"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxUsers')"
                :name="['profileData', 'configuration', 'maxUsers']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxUsersRequired') }]"
              >
                <InputNumber v-model:value="formState.profileData.configuration.maxUsers" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxDashboards')"
                :name="['profileData', 'configuration', 'maxDashboards']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxDashboardsRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxDashboards"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxRuleChains')"
                :name="['profileData', 'configuration', 'maxRuleChains']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxRuleChainsRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxRuleChains"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4"></div>
        <Card size="small">
          <template #title>
            {{ t('tb.tenantProfile.form.ruleEngine') }}
            <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxREExecutions')"
                :name="['profileData', 'configuration', 'maxREExecutions']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxREExecutionsRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxREExecutions"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxTransportMessages')"
                :name="['profileData', 'configuration', 'maxTransportMessages']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxTransportMessagesRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxTransportMessages"
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
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxJSExecutions"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxTransportDataPoints')"
                :name="['profileData', 'configuration', 'maxTransportDataPoints']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxTransportDataPointsRequired') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxTransportDataPoints"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxRuleNodeExecutionsPerMessage')"
                :name="['profileData', 'configuration', 'maxRuleNodeExecutionsPerMessage']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxRuleNodeExecutionsPerMessage') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxRuleNodeExecutionsPerMessage"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4"></div>
        <Card size="small">
          <template #title>
            {{ t('tb.tenantProfile.form.ttl') }}
            <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxDPStorageDays')"
                :name="['profileData', 'configuration', 'maxDPStorageDays']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxDPStorageDays') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxDPStorageDays"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.alarmsTtlDays')"
                :name="['profileData', 'configuration', 'alarmsTtlDays']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.alarmsTtlDays') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.alarmsTtlDays"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.defaultStorageTtlDays')"
                :name="['profileData', 'configuration', 'defaultStorageTtlDays']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.defaultStorageTtlDays') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.defaultStorageTtlDays"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.rpcTtlDays')"
                :name="['profileData', 'configuration', 'rpcTtlDays']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.rpcTtlDays') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.rpcTtlDays"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4"></div>
        <Card size="small">
          <template #title>
            {{ t('tb.tenantProfile.form.alertsAndNotifications') }}
            <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxEmails')"
                :name="['profileData', 'configuration', 'maxEmails']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxEmails') }]"
              >
                <InputNumber v-model:value="formState.profileData.configuration.maxEmails" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxSms')"
                :name="['profileData', 'configuration', 'maxSms']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxSms') }]"
              >
                <InputNumber v-model:value="formState.profileData.configuration.maxSms" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxCreatedAlarms')"
                :name="['profileData', 'configuration', 'maxCreatedAlarms']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxCreatedAlarms') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxCreatedAlarms"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4"></div>
        <Card size="small">
          <template #title>
            {{ t('tb.tenantProfile.form.otaBytes') }}
            <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxResourcesInBytes')"
                :name="['profileData', 'configuration', 'maxResourcesInBytes']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxResourcesInBytes') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxResourcesInBytes"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxOtaPackagesInBytes')"
                :name="['profileData', 'configuration', 'maxOtaPackagesInBytes']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxOtaPackagesInBytes') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxOtaPackagesInBytes"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4"></div>
        <Card size="small">
          <template #title>
            {{ t('tb.tenantProfile.form.websocket') }}
            <span class="text-help">{{ t('tb.tenantProfile.form.unlimitedTip') }}</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSessionsPerTenant')"
                :name="['profileData', 'configuration', 'maxWsSessionsPerTenant']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSessionsPerTenant') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerTenant"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerTenant')"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerTenant']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSubscriptionsPerTenant') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerTenant"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSessionsPerCustomer')"
                :name="['profileData', 'configuration', 'maxWsSessionsPerCustomer']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSessionsPerCustomer') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerCustomer"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerCustomer')"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerCustomer']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSubscriptionsPerCustomer') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerCustomer"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSessionsPerPublicUser')"
                :name="['profileData', 'configuration', 'maxWsSessionsPerPublicUser']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSessionsPerPublicUser') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerPublicUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerPublicUser')"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerPublicUser']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSubscriptionsPerPublicUser') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerPublicUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSessionsPerRegularUser')"
                :name="['profileData', 'configuration', 'maxWsSessionsPerRegularUser']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSessionsPerRegularUser') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerRegularUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.maxWsSubscriptionsPerRegularUser')"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerRegularUser']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.maxWsSubscriptionsPerRegularUser') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerRegularUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.wsMsgQueueLimitPerSession')"
                :help="t('tb.tenantProfile.form.wsMsgQueueHelp')"
                :name="['profileData', 'configuration', 'wsMsgQueueLimitPerSession']"
                :rules="[{ required: true, message: t('tb.tenantProfile.form.wsMsgQueueLimitPerSession') }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.wsMsgQueueLimitPerSession"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4"></div>
        <Card size="small">
          <template #title> {{ t('tb.tenantProfile.form.rateLimit') }} </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                :label="t('tb.tenantProfile.form.transportDeviceMsgRateLimit')"
                :name="['profileData', 'configuration', 'transportDeviceMsgRateLimit']"
              >
                <RateLimit
                  v-model:value="formState.profileData.configuration.transportTenantMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportDeviceMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportTenantTelemetryMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportDeviceTelemetryMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportTenantTelemetryDataPointsRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportDeviceTelemetryDataPointsRateLimit"
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
                  v-model:value="formState.profileData.configuration.tenantServerRestLimitsConfiguration"
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
                  v-model:value="formState.profileData.configuration.customerServerRestLimitsConfiguration"
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
                  v-model:value="formState.profileData.configuration.tenantEntityImportRateLimit"
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
                  v-model:value="formState.profileData.configuration.tenantEntityExportRateLimit"
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
                  v-model:value="formState.profileData.configuration.wsUpdatesPerSessionRateLimit"
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
                  v-model:value="formState.profileData.configuration.cassandraQueryTenantRateLimitsConfiguration"
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
                  v-model:value="formState.profileData.configuration.tenantNotificationRequestsRateLimit"
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
                  v-model:value="formState.profileData.configuration.tenantNotificationRequestsPerRuleRateLimit"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </CollapseContainer>
      <Form.Item :label="t('tb.tenantProfile.form.description')" name="description">
        <Textarea
          v-model:value="formState.description"
          :placeholder="t('tb.tenantProfile.form.descriptionPlaceholder')"
          :rows="3"
        />
      </Form.Item>
    </Form>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbTenantProfileForm">
  import { ref, unref, computed, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { CollapseContainer } from '/@/components/Container';
  import { Icon } from '/@/components/Icon';
  import { Checkbox, Input, InputNumber, Radio, Tooltip, Textarea, Form, Row, Col, Card } from 'ant-design-vue';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { TenantProfile, getTenantProfileById, saveTenantProfile } from '/@/api/tb/tenantProfile';
  import RateLimit from './RateLimit.vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { buildUUID } from '/@/utils/uuid';
  import {
    SUBMIT_STRATEGY_OPTIONS,
    PROCESSING_STRATEGY_OPTIONS,
    ProcessingStrategyType,
    SubmitStrategyType,
  } from '/@/enums/queueEnum';
  import { isArray, isEmpty } from 'lodash-es';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const formRef = ref<FormInstance>();
  const record = ref<TenantProfile>({} as TenantProfile);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.tenantProfile.action.edit') : t('tb.tenantProfile.action.add'),
  }));

  const formState = reactive<TenantProfile>({
    name: '',
    description: '',
    default: false,
    isolatedTbRuleEngine: false,
    profileData: {
      queueConfiguration: new Array(),
      configuration: {
        type: 'DEFAULT',
        maxDevices: 0,
        maxAssets: 0,
        maxCustomers: 0,
        maxUsers: 0,
        maxDashboards: 0,
        maxRuleChains: 0,
        maxResourcesInBytes: 0,
        maxOtaPackagesInBytes: 0,

        transportTenantMsgRateLimit: undefined,
        transportTenantTelemetryMsgRateLimit: undefined,
        transportTenantTelemetryDataPointsRateLimit: undefined,
        transportDeviceMsgRateLimit: undefined,
        transportDeviceTelemetryMsgRateLimit: undefined,
        transportDeviceTelemetryDataPointsRateLimit: undefined,

        tenantEntityExportRateLimit: undefined,
        tenantEntityImportRateLimit: undefined,
        tenantNotificationRequestsRateLimit: undefined,
        tenantNotificationRequestsPerRuleRateLimit: undefined,

        maxTransportMessages: 0,
        maxTransportDataPoints: 0,
        maxREExecutions: 0,
        maxJSExecutions: 0,
        maxDPStorageDays: 0,
        maxRuleNodeExecutionsPerMessage: 0,
        maxEmails: 0,
        maxSms: 0,
        maxCreatedAlarms: 0,

        tenantServerRestLimitsConfiguration: undefined,
        customerServerRestLimitsConfiguration: undefined,

        maxWsSessionsPerTenant: 0,
        maxWsSessionsPerCustomer: 0,
        maxWsSessionsPerRegularUser: 0,
        maxWsSessionsPerPublicUser: 0,
        wsMsgQueueLimitPerSession: 0,
        maxWsSubscriptionsPerTenant: 0,
        maxWsSubscriptionsPerCustomer: 0,
        maxWsSubscriptionsPerRegularUser: 0,
        maxWsSubscriptionsPerPublicUser: 0,
        wsUpdatesPerSessionRateLimit: undefined,

        cassandraQueryTenantRateLimitsConfiguration: undefined,

        defaultStorageTtlDays: 0,
        alarmsTtlDays: 0,
        rpcTtlDays: 0,

        warnThreshold: 0,
      },
    },
  } as TenantProfile);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as TenantProfile;
    clear();
    if (data?.id?.id) {
      const res = await getTenantProfileById(data.id.id);
      record.value = (res || {}) as TenantProfile;
      if (
        isArray(record.value.profileData.queueConfiguration) &&
        record.value.profileData.queueConfiguration.length > 0
      ) {
        for (let i = 0; i < record.value.profileData.queueConfiguration.length; i++) {
          if (isEmpty(record.value.profileData.queueConfiguration[i].additionalInfo)) {
            record.value.profileData.queueConfiguration[i].additionalInfo = { description: undefined };
          }
        }
      }

      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
    }
    setModalProps({ loading: false });
  });

  function clear() {
    formState.name = undefined;
    formState.description = undefined;
    formState.default = false;
    formState.isolatedTbRuleEngine = false;
    formState.profileData = {
      queueConfiguration: undefined,
      configuration: {
        type: 'DEFAULT',
        maxDevices: 0,
        maxAssets: 0,
        maxCustomers: 0,
        maxUsers: 0,
        maxDashboards: 0,
        maxRuleChains: 0,
        maxResourcesInBytes: 0,
        maxOtaPackagesInBytes: 0,

        transportTenantMsgRateLimit: undefined,
        transportTenantTelemetryMsgRateLimit: undefined,
        transportTenantTelemetryDataPointsRateLimit: undefined,
        transportDeviceMsgRateLimit: undefined,
        transportDeviceTelemetryMsgRateLimit: undefined,
        transportDeviceTelemetryDataPointsRateLimit: undefined,

        tenantEntityExportRateLimit: undefined,
        tenantEntityImportRateLimit: undefined,
        tenantNotificationRequestsRateLimit: undefined,
        tenantNotificationRequestsPerRuleRateLimit: undefined,

        maxTransportMessages: 0,
        maxTransportDataPoints: 0,
        maxREExecutions: 0,
        maxJSExecutions: 0,
        maxDPStorageDays: 0,
        maxRuleNodeExecutionsPerMessage: 0,
        maxEmails: 0,
        maxSms: 0,
        maxCreatedAlarms: 0,

        tenantServerRestLimitsConfiguration: undefined,
        customerServerRestLimitsConfiguration: undefined,

        maxWsSessionsPerTenant: 0,
        maxWsSessionsPerCustomer: 0,
        maxWsSessionsPerRegularUser: 0,
        maxWsSessionsPerPublicUser: 0,
        wsMsgQueueLimitPerSession: 0,
        maxWsSubscriptionsPerTenant: 0,
        maxWsSubscriptionsPerCustomer: 0,
        maxWsSubscriptionsPerRegularUser: 0,
        maxWsSubscriptionsPerPublicUser: 0,
        wsUpdatesPerSessionRateLimit: undefined,

        cassandraQueryTenantRateLimitsConfiguration: undefined,

        defaultStorageTtlDays: 0,
        alarmsTtlDays: 0,
        rpcTtlDays: 0,

        warnThreshold: 0,
      },
    };
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      // const data = await validate();
      setModalProps({ confirmLoading: true });

      // console.log('submit', params, data, record);
      const res = await saveTenantProfile({ ...data, id: record.value.id });
      showMessage(
        record.value.id?.id ? t('tb.tenantProfile.action.editSuccess') : t('tb.tenantProfile.action.addSuccess'),
      );
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

  function handleIsolatedTbRuleEngineChange({ target: { checked } }) {
    if (checked == true) {
      formState.profileData.queueConfiguration = [
        {
          id: buildUUID(),
          name: 'Main',
          topic: 'tb_rule_engine.main',
          submitStrategy: {
            type: SubmitStrategyType.BURST,
            batchSize: undefined,
          },
          processingStrategy: {
            type: ProcessingStrategyType.SKIP_ALL_FAILURES,
            retries: 3,
            failurePercentage: 0,
            pauseBetweenRetries: 3,
            maxPauseBetweenRetries: 3,
          },
          pollInterval: 25,
          partitions: 10,
          consumerPerPartition: true,
          packProcessingTimeout: 2000,
          additionalInfo: { description: undefined },
        },
      ];
    } else {
      formState.profileData.queueConfiguration = undefined;
    }
  }

  function handleAddQueue() {
    formState.profileData.queueConfiguration?.push({
      id: buildUUID(),
      name: undefined,
      topic: undefined,
      submitStrategy: {
        type: undefined,
        batchSize: 1000,
      },
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
    });
  }

  function handleDeleteQueue(index: number) {
    if (index == 0) {
      return;
    }
    formState.profileData.queueConfiguration?.splice(index, 1);
  }
</script>
