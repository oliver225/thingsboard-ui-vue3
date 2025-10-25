<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.topicPattern')"
      name="topicPattern"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.topicPatternRequired') }]"
      :help="t('tb.ruleChain.nodeAction.topicPatternHelp')"
    >
      <Input v-model:value="formState.topicPattern" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.keyPattern')"
      name="keyPattern"
      :help="t('tb.ruleChain.nodeAction.keyPatternHelp')"
    >
      <Input v-model:value="formState.keyPattern" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.bootstrapServers')"
      name="bootstrapServers"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.bootstrapServersRequired') }]"
    >
      <Input v-model:value="formState.bootstrapServers" />
    </Form.Item>
    <Form.Item :label="t('tb.ruleChain.nodeAction.retries')" name="retries">
      <InputNumber v-model:value="formState.retries" :min="0" :style="{ width: '100%' }" />
    </Form.Item>
    <Form.Item :label="t('tb.ruleChain.nodeAction.batchSize')" name="batchSize">
      <InputNumber v-model:value="formState.batchSize" :min="0" :style="{ width: '100%' }" />
    </Form.Item>
    <Form.Item :label="t('tb.ruleChain.nodeAction.linger')" name="linger">
      <InputNumber
        v-model:value="formState.linger"
        :min="0"
        :addon-after="t('tb.ruleChain.nodeAction.unitMillisecond')"
        :style="{ width: '100%' }"
      />
    </Form.Item>
    <Form.Item :label="t('tb.ruleChain.nodeAction.bufferMemory')" name="bufferMemory">
      <InputNumber v-model:value="formState.bufferMemory" :min="0" :style="{ width: '100%' }" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.acks')"
      name="acks"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.acksRequired') }]"
    >
      <Select v-model:value="formState.acks" :min="0" :style="{ width: '100%' }">
        <Select.Option value="all">all</Select.Option>
        <Select.Option value="-1">-1</Select.Option>
        <Select.Option value="0">0</Select.Option>
        <Select.Option value="1">1</Select.Option>
      </Select>
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.keySerializer')"
      name="keySerializer"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.keySerializerRequired') }]"
    >
      <Input v-model:value="formState.keySerializer" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.valueSerializer')"
      name="valueSerializer"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.valueSerializerRequired') }]"
    >
      <Input v-model:value="formState.valueSerializer" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.otherProperties')"
      name="otherProperties"
      :rules="[{ validator: validatorOtherProperties }]"
    >
      <Table class="properties-table">
        <tr class="header">
          <th>{{ t('tb.ruleChain.nodeAction.key') }}</th>
          <th>{{ t('tb.ruleChain.nodeAction.value') }}</th>
        </tr>
        <tr class="content" v-for="(property, index) in otherPropertyList" :key="index">
          <td class="py-2 px-4">
            <Input v-model:value="property.key" :placeholder="t('tb.ruleChain.nodeAction.keyPlaceholder')" />
          </td>
          <td>
            <Input v-model:value="property.value" :placeholder="t('tb.ruleChain.nodeAction.valuePlaceholder')" />
          </td>
          <td>
            <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
              <Icon
                :icon="'ant-design:delete-outlined'"
                :size="20"
                color="red"
                class="cursor-pointer"
                @click="handleDeleteProperty(index)"
              />
            </Tooltip>
          </td>
        </tr>
      </Table>
      <Button class="my-4" type="primary" @click="handleAddProperty">{{
        t('tb.ruleChain.nodeAction.addProperty')
      }}</Button>
    </Form.Item>
    <Form.Item
      name="addMetadataKeyValuesAsKafkaHeaders"
      :help="t('tb.ruleChain.nodeAction.addMetadataToKafkaHeadersHelp')"
    >
      <Checkbox v-model:checked="formState.addMetadataKeyValuesAsKafkaHeaders">
        {{ t('tb.ruleChain.nodeAction.addMetadataToKafkaHeaders') }}
      </Checkbox>
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.charsetEncoding')"
      name="kafkaHeadersCharset"
      v-if="formState.addMetadataKeyValuesAsKafkaHeaders == true"
    >
      <Select v-model:value="formState.kafkaHeadersCharset">
        <Select.Option value="US-ASCII">US-ASCII</Select.Option>
        <Select.Option value="ISO-8859-1">ISO-8859-1</Select.Option>
        <Select.Option value="UTF-8">UTF-8</Select.Option>
        <Select.Option value="UTF-16BE">UTF-16BE</Select.Option>
        <Select.Option value="UTF-16LE">UTF-16LE</Select.Option>
        <Select.Option value="UTF-16">UTF-16</Select.Option>
      </Select>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'kafka',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Form, Input, Button, Tooltip, InputNumber, Checkbox, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    acks: string;
    addMetadataKeyValuesAsKafkaHeaders: boolean;
    batchSize: number;
    bootstrapServers: string;
    bufferMemory: number;
    kafkaHeadersCharset: string;
    keyPattern: string;
    keySerializer: string;
    linger: number;
    otherProperties: Recordable;
    retries: number;
    topicPattern: string;
    valueSerializer: string;
  }

  const otherPropertyList = ref<Array<any>>([]);

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    acks: '-1',
    addMetadataKeyValuesAsKafkaHeaders: false,
    batchSize: 16384,
    bootstrapServers: 'localhost:9092',
    bufferMemory: 33554432,
    kafkaHeadersCharset: 'UTF-8',
    keyPattern: undefined,
    keySerializer: 'org.apache.kafka.common.serialization.StringSerializer',
    linger: 0,
    otherProperties: {},
    retries: 0,
    topicPattern: 'my-topic',
    valueSerializer: 'org.apache.kafka.common.serialization.StringSerializer',
  });

  watch(
    () => props.configuration,
    () => {
      formState.acks = props.configuration.acks;
      formState.addMetadataKeyValuesAsKafkaHeaders = props.configuration.addMetadataKeyValuesAsKafkaHeaders;
      formState.batchSize = props.configuration.batchSize;
      formState.bootstrapServers = props.configuration.bootstrapServers;
      formState.bufferMemory = props.configuration.bufferMemory;
      formState.kafkaHeadersCharset = props.configuration.kafkaHeadersCharset;
      formState.keyPattern = props.configuration.keyPattern;
      formState.keySerializer = props.configuration.keySerializer;
      formState.linger = props.configuration.linger;
      formState.otherProperties = props.configuration.otherProperties;
      formState.retries = props.configuration.retries;
      formState.topicPattern = props.configuration.topicPattern;
      formState.valueSerializer = props.configuration.valueSerializer;
      Object.keys(formState.otherProperties).forEach((key) => {
        otherPropertyList.value.push({ key: key, value: formState.otherProperties[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        otherPropertyList.value.forEach((property) => {
          data.otherProperties[property.key] = property.value;
        });
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorOtherProperties() {
    let validateTag = true;
    otherPropertyList.value.forEach((property) => {
      if (isEmpty(property.key) || isEmpty(property.value)) {
        validateTag = false;
      }
    });
    if (!validateTag) {
      return Promise.reject(t('tb.ruleChain.nodeAction.otherPropertiesNotEmpty'));
    } else {
      return Promise.resolve();
    }
  }

  function handleDeleteProperty(index: number) {
    otherPropertyList.value.splice(index, 1);
  }

  function handleAddProperty() {
    otherPropertyList.value.push({ key: '', value: '' });
  }

  defineExpose({ getConfiguration });
</script>
<style lang="less">
  .ant-form-item-has-error {
    .properties-table {
      border: 1px solid #ff4d4f;
    }
  }

  .properties-table {
    width: 100%;
    align: 'center';
    border: 1px solid @border-color-base;
    border-radius: 4px;

    .header {
      border-bottom: 1px solid @border-color-base;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      color: @border-color-base;
    }

    .td {
      padding: 2px 2px;
    }
  }
</style>
