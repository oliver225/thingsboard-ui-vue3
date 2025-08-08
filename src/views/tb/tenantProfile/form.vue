<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item label="配置名称" name="name" :rules="[{ required: true, message: '请输入配置名称!' }]">
        <Input v-model:value="formState.name" placeholder="请输入配置名称" />
      </Form.Item>
      <Form.Item name="default" v-show="false">
        <Checkbox v-model:checked="formState.default" :defaultChecked="false" />
      </Form.Item>
      <Form.Item name="isolatedTbRuleEngine" help="每个独立租户需要单独的规则引擎微服务">
        <Checkbox v-model:checked="formState.isolatedTbRuleEngine" @change="handleIsolatedTbRuleEngineChange">
          使用独立的规则引擎服务
        </Checkbox>
      </Form.Item>
      <CollapseContainer
        :title="`队列(${formState.profileData.queueConfiguration?.length})`"
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
            <Tooltip :title="'删除'" class="mr-2" v-if="index != 0">
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
            label="队列名称"
            :name="['profileData', 'queueConfiguration', index, 'name']"
            :rules="[
              { required: true, message: '请输入队列名称!' },
              { pattern: /^[a-zA-Z0-9_-]*$/, message: '队列名称只能包含字母数字和 _、-', trigger: ['change', 'blur'] },
            ]"
          >
            <Input
              v-model:value="formState.profileData.queueConfiguration[index].name"
              :disabled="index == 0"
              placeholder="请输入队列名称"
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
          <CollapseContainer title="提交设置" class="border border-solid border-neutral-300 mb-4">
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  label="提交策略"
                  :name="['profileData', 'queueConfiguration', index, 'submitStrategy', 'type']"
                  :rules="[{ required: true, message: '请选择提交策略!' }]"
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
                  label="批量处理大小"
                  :name="['profileData', 'queueConfiguration', index, 'submitStrategy', 'batchSize']"
                  v-if="formState.profileData.queueConfiguration[index].submitStrategy.type == SubmitStrategyType.BATCH"
                  :rules="[{ required: true, message: '请输入批量处理大小!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="1000"
                    :min="1"
                    v-model:value="formState.profileData.queueConfiguration[index].submitStrategy.batchSize"
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
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'type']"
                  :rules="[{ required: true, message: '请选择重试处理策略!' }]"
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
                  label="重试次数(0表示无限制)"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'retries']"
                  :rules="[{ required: true, message: '请输入重试次数!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="3"
                    :min="0"
                    v-model:value="formState.profileData.queueConfiguration[index].processingStrategy.retries"
                    placeholder="请输入重试次数"
                  />
                </Form.Item>
                <Form.Item
                  label="跳过重试的失败消息百分比"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'failurePercentage']"
                  :rules="[{ required: true, message: '请输入跳过重试的失败消息百分比!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="0"
                    :min="0"
                    :max="100"
                    v-model:value="formState.profileData.queueConfiguration[index].processingStrategy.failurePercentage"
                    placeholder="请输入跳过重试的失败消息百分比"
                  />
                </Form.Item>
                <Form.Item
                  label="重试间隔"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'pauseBetweenRetries']"
                  :rules="[{ required: true, message: '请输入重试间隔!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="3"
                    :min="0"
                    v-model:value="
                      formState.profileData.queueConfiguration[index].processingStrategy.pauseBetweenRetries
                    "
                    placeholder="请输入重试间隔"
                    addon-after="秒"
                  />
                </Form.Item>
                <Form.Item
                  label="最大重试间隔"
                  :name="['profileData', 'queueConfiguration', index, 'processingStrategy', 'maxPauseBetweenRetries']"
                  :rules="[{ required: true, message: '请输入最大重试间隔!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="3"
                    :min="0"
                    v-model:value="
                      formState.profileData.queueConfiguration[index].processingStrategy.maxPauseBetweenRetries
                    "
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
                <Form.Item
                  label="轮训间隔"
                  :name="['profileData', 'queueConfiguration', index, 'pollInterval']"
                  :rules="[{ required: true, message: '请输入轮训间隔!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="25"
                    :min="0"
                    v-model:value="formState.profileData.queueConfiguration[index].pollInterval"
                    placeholder="请输入轮训间隔"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="分区"
                  :name="['profileData', 'queueConfiguration', index, 'partitions']"
                  :rules="[{ required: true, message: '请输入分区!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="10"
                    :min="1"
                    v-model:value="formState.profileData.queueConfiguration[index].partitions"
                    placeholder="请输入分区"
                  />
                </Form.Item>
              </Col>
            </Row>
            即时处理
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item label=" " :name="['profileData', 'queueConfiguration', index, 'consumerPerPartition']">
                  <Checkbox
                    v-model:checked="formState.profileData.queueConfiguration[index].consumerPerPartition"
                    :defaultChecked="false"
                  >
                    每个分区消费者单独轮询消息
                  </Checkbox>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="处理超时"
                  :name="['profileData', 'queueConfiguration', index, 'packProcessingTimeout']"
                  :rules="[{ required: true, message: '请输入处理超时时间!' }]"
                >
                  <InputNumber
                    :style="{ width: '90%' }"
                    :defaultValue="2000"
                    :min="0"
                    v-model:value="formState.profileData.queueConfiguration[index].packProcessingTimeout"
                    placeholder="请输入处理超时时间"
                    addon-after="毫秒"
                  />
                </Form.Item>
              </Col>
            </Row>
          </CollapseContainer>
          <Form.Item
            label="描述信息"
            :name="['profileData', 'queueConfiguration', index, 'additionalInfo', 'description']"
            help="此文本将显示在队列说明中，而不是所选策略中"
          >
            <Textarea
              v-model:value="formState.profileData.queueConfiguration[index].additionalInfo.description"
              placeholder="输入队列描述信息"
              :rows="3"
            />
          </Form.Item>
        </CollapseContainer>
        <a-button type="primary" @click="handleAddQueue" size="small">
          <Icon icon="i-fluent:add-12-filled" />添加队列
        </a-button>
      </CollapseContainer>
      <div class="h-4" v-if="formState.isolatedTbRuleEngine == true" />
      <CollapseContainer title="配置设置" class="border border-solid border-neutral-300 mb-4">
        <Form.Item :name="['profileData', 'configuration', 'type']" v-show="false">
          <Input v-model:value="formState.profileData.configuration.type" :defaultValue="'DEFAULT'" />
        </Form.Item>
        <Card size="small">
          <template #title>
            实体
            <span class="text-help">0 表示无限制</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                label="最大设备数"
                :name="['profileData', 'configuration', 'maxDevices']"
                :rules="[{ required: true, message: '请输入最大设备数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxDevices"
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
                <InputNumber v-model:value="formState.profileData.configuration.maxAssets" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="最大客户数"
                :name="['profileData', 'configuration', 'maxCustomers']"
                :rules="[{ required: true, message: '请输入最大客户数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxCustomers"
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
                <InputNumber v-model:value="formState.profileData.configuration.maxUsers" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="最大仪表盘数"
                :name="['profileData', 'configuration', 'maxDashboards']"
                :rules="[{ required: true, message: '请输入最大仪表盘数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxDashboards"
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
                  v-model:value="formState.profileData.configuration.maxRuleChains"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4" />
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
                :rules="[{ required: true, message: '请输入最大规则引擎执行数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxREExecutions"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="最大传输消息数"
                :name="['profileData', 'configuration', 'maxTransportMessages']"
                :rules="[{ required: true, message: '请输入最大传输消息数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxTransportMessages"
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
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxJSExecutions"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="最大传输数据点数"
                :name="['profileData', 'configuration', 'maxTransportDataPoints']"
                :rules="[{ required: true, message: '请输入最大传输数据点数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxTransportDataPoints"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="每条消息的最大规则节点执行数"
                :name="['profileData', 'configuration', 'maxRuleNodeExecutionsPerMessage']"
                :rules="[{ required: true, message: '请输入每条消息的最大规则节点执行数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxRuleNodeExecutionsPerMessage"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4" />
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
                  v-model:value="formState.profileData.configuration.maxDPStorageDays"
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
                  v-model:value="formState.profileData.configuration.alarmsTtlDays"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="默认存储TTL天数"
                :name="['profileData', 'configuration', 'defaultStorageTtlDays']"
                :rules="[{ required: true, message: '请输入默认存储TTL天数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.defaultStorageTtlDays"
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
                  v-model:value="formState.profileData.configuration.rpcTtlDays"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4" />
        <Card size="small">
          <template #title>
            告警与通知
            <span class="text-help">0 表示无限制</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                label="最大电子邮件发送数"
                :name="['profileData', 'configuration', 'maxEmails']"
                :rules="[{ required: true, message: '请输入最大电子邮件发送数!' }]"
              >
                <InputNumber v-model:value="formState.profileData.configuration.maxEmails" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="最大短信发送数"
                :name="['profileData', 'configuration', 'maxSms']"
                :rules="[{ required: true, message: '请输入最大短信发送数!' }]"
              >
                <InputNumber v-model:value="formState.profileData.configuration.maxSms" :style="{ width: '100%' }" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="最大创建告警数"
                :name="['profileData', 'configuration', 'maxCreatedAlarms']"
                :rules="[{ required: true, message: '请输入最大创建告警数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxCreatedAlarms"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4" />
        <Card size="small">
          <template #title>
            OTA文件(字节)
            <span class="text-help">0 表示无限制</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                label="资源文件总大小"
                :name="['profileData', 'configuration', 'maxResourcesInBytes']"
                :rules="[{ required: true, message: '请输入资源文件总大小!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxResourcesInBytes"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="OTA包文件总大小"
                :name="['profileData', 'configuration', 'maxOtaPackagesInBytes']"
                :rules="[{ required: true, message: '请输入OTA包文件总大小!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxOtaPackagesInBytes"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4" />
        <Card size="small">
          <template #title>
            WebSocket
            <span class="text-help">0 表示无限制</span>
          </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item
                label="租户最大会话数"
                :name="['profileData', 'configuration', 'maxWsSessionsPerTenant']"
                :rules="[{ required: true, message: '请输入租户最大会话数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerTenant"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="租户最大订阅数"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerTenant']"
                :rules="[{ required: true, message: '请输入租户最大订阅数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerTenant"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="客户最大会话数"
                :name="['profileData', 'configuration', 'maxWsSessionsPerCustomer']"
                :rules="[{ required: true, message: '请输入客户最大会话数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerCustomer"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="客户最大订阅数"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerCustomer']"
                :rules="[{ required: true, message: '请输入客户最大订阅数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerCustomer"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="公共用户最大会话数"
                :name="['profileData', 'configuration', 'maxWsSessionsPerPublicUser']"
                :rules="[{ required: true, message: '请输入公共用户最大会话数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerPublicUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="公共用户最大订阅数"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerPublicUser']"
                :rules="[{ required: true, message: '请输入公共用户最大订阅数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerPublicUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="普通用户最大会话数"
                :name="['profileData', 'configuration', 'maxWsSessionsPerRegularUser']"
                :rules="[{ required: true, message: '请输入普通用户最大会话数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSessionsPerRegularUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="普通用户最大订阅数"
                :name="['profileData', 'configuration', 'maxWsSubscriptionsPerRegularUser']"
                :rules="[{ required: true, message: '请输入普通用户最大订阅数!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.maxWsSubscriptionsPerRegularUser"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item
                label="会话最大消息队列大小"
                help="队列的大小也受到系统配置的限制"
                :name="['profileData', 'configuration', 'wsMsgQueueLimitPerSession']"
                :rules="[{ required: true, message: '请输入会话最大消息队列大小!' }]"
              >
                <InputNumber
                  v-model:value="formState.profileData.configuration.wsMsgQueueLimitPerSession"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div class="h-4" />
        <Card size="small">
          <template #title> 速率限制 </template>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item label="传输租户消息" :name="['profileData', 'configuration', 'transportTenantMsgRateLimit']">
                <RateLimit
                  v-model:value="formState.profileData.configuration.transportTenantMsgRateLimit"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="传输设备消息" :name="['profileData', 'configuration', 'transportDeviceMsgRateLimit']">
                <RateLimit
                  v-model:value="formState.profileData.configuration.transportDeviceMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportTenantTelemetryMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportDeviceTelemetryMsgRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportTenantTelemetryDataPointsRateLimit"
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
                  v-model:value="formState.profileData.configuration.transportDeviceTelemetryDataPointsRateLimit"
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
                  v-model:value="formState.profileData.configuration.tenantServerRestLimitsConfiguration"
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
                  v-model:value="formState.profileData.configuration.customerServerRestLimitsConfiguration"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="实体版本创建" :name="['profileData', 'configuration', 'tenantEntityImportRateLimit']">
                <RateLimit
                  v-model:value="formState.profileData.configuration.tenantEntityImportRateLimit"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="实体版本加载" :name="['profileData', 'configuration', 'tenantEntityExportRateLimit']">
                <RateLimit
                  v-model:value="formState.profileData.configuration.tenantEntityExportRateLimit"
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
                  v-model:value="formState.profileData.configuration.wsUpdatesPerSessionRateLimit"
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
                  v-model:value="formState.profileData.configuration.cassandraQueryTenantRateLimitsConfiguration"
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
                  v-model:value="formState.profileData.configuration.tenantNotificationRequestsRateLimit"
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
                  v-model:value="formState.profileData.configuration.tenantNotificationRequestsPerRuleRateLimit"
                  :style="{ width: '100%' }"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </CollapseContainer>
      <Form.Item label="描述信息" name="description">
        <Textarea v-model:value="formState.description" placeholder="输入配置描述信息" :rows="3"></Textarea>
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
    value: record.value.id?.id ? t('编辑租户配置') : t('新增租户配置'),
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
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}租户配置成功！`);
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
