<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.deviceRelationsQuery') }}</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.direction')"
              :name="['deviceRelationsQuery', 'direction']"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.directionRequired') }]"
            >
              <Select v-model:value="formState.deviceRelationsQuery.direction">
                <Select.Option value="FROM">{{ t('tb.ruleChain.nodeAction.fromOriginator') }}</Select.Option>
                <Select.Option value="TO">{{ t('tb.ruleChain.nodeAction.toOriginator') }}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.level')" :name="['deviceRelationsQuery', 'maxLevel']">
              <InputNumber
                v-model:value="formState.deviceRelationsQuery.maxLevel"
                :precision="0"
                :step="1"
                :min="1"
                :style="{ width: '100%' }"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          :name="['deviceRelationsQuery', 'fetchLastLevelOnly']"
          v-show="formState.deviceRelationsQuery.maxLevel && formState.deviceRelationsQuery.maxLevel > 1"
        >
          <Checkbox v-model:checked="formState.deviceRelationsQuery.fetchLastLevelOnly">
            {{ t('tb.ruleChain.nodeAction.fetchLastLevelOnly') }}
          </Checkbox>
        </Form.Item>
        <Form.Item :label="t('tb.ruleChain.nodeAction.relationType')" :name="['deviceRelationsQuery', 'relationType']">
          <Select
            v-model:value="formState.deviceRelationsQuery.relationType"
            :options="relationTypeOptions.map((item) => ({ value: item }))"
          >
            <template #dropdownRender="{ menuNode: menu }">
              <v-nodes :vnodes="menu" />
              <Divider style="margin: 4px 0" />
              <Space style="padding: 4px 8px">
                <Input
                  ref="inputRef"
                  v-model:value="addName"
                  :placeholder="t('tb.ruleChain.nodeAction.enterRelationType')"
                />
                <Button type="text" @click="addRelationType">
                  <template #icon>
                    <plus-outlined />
                  </template>
                  {{ t('tb.ruleChain.nodeAction.addRelationType') }}
                </Button>
              </Space>
            </template>
          </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.deviceProfile')"
          :name="['deviceRelationsQuery', 'deviceTypes']"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.deviceProfileRequired') }]"
        >
          <Select v-model:value="formState.deviceRelationsQuery.deviceTypes" mode="multiple">
            <Select.Option v-for="(type, index) in deviceTypesOptions" :key="index" :value="type.type">
              {{ type.type }}
            </Select.Option>
          </Select>
        </Form.Item>
      </div>
    </div>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.relatedDeviceAttributes') }}</p>
      <div class="p-2">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.clientAttributes')"
          name="clientAttributeNames"
          :rules="[{ validator: validatorAttributeNames }]"
        >
          <Select v-model:value="formState.clientAttributeNames" mode="tags"> </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.sharedAttributes')"
          name="sharedAttributeNames"
          :rules="[{ validator: validatorAttributeNames }]"
        >
          <Select v-model:value="formState.sharedAttributeNames" mode="tags"> </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.serverAttributes')"
          name="serverAttributeNames"
          :rules="[{ validator: validatorAttributeNames }]"
        >
          <Select v-model:value="formState.serverAttributeNames" mode="tags"> </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.telemetry')"
          name="latestTsKeyNames"
          :rules="[{ validator: validatorAttributeNames }]"
        >
          <Select v-model:value="formState.latestTsKeyNames" mode="tags"> </Select>
        </Form.Item>
        <Form.Item name="getLatestValueWithTs" v-show="formState.latestTsKeyNames.length > 0">
          <Checkbox v-model:checked="formState.getLatestValueWithTs">
            {{ t('tb.ruleChain.nodeAction.getLatestValueWithTs') }}
          </Checkbox>
        </Form.Item>
      </div>
    </div>
    <Form.Item name="fetchTo">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <span>{{ t('tb.ruleChain.nodeAction.addOriginatorAttributesTo') }}</span>
        <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
          <Radio.Button value="DATA">{{ t('tb.ruleChain.nodeAction.message') }}</Radio.Button>
          <Radio.Button value="METADATA">{{ t('tb.ruleChain.nodeAction.metadata') }}</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <Form.Item name="tellFailureIfAbsent" :help="t('tb.ruleChain.nodeAction.tellFailureIfAbsentHelp')">
      <div class="border border-solid border-neutral-300 rounded-md px-4 py-2">
        <Checkbox v-model:checked="formState.tellFailureIfAbsent">
          {{ t('tb.ruleChain.nodeAction.tellFailureIfAbsent') }}
        </Checkbox>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'related-device-attributes',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive, onMounted } from 'vue';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import { Form, Select, Radio, Checkbox, Row, Col, Divider, Space, Input, Button, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getDeviceTypes } from '/@/api/tb/device';

  interface Configuration {
    clientAttributeNames: [];
    latestTsKeyNames: [];
    serverAttributeNames: [];
    sharedAttributeNames: [];
    getLatestValueWithTs: boolean;
    tellFailureIfAbsent: boolean;
    fetchTo: 'METADATA' | 'DATA';
    deviceRelationsQuery: {
      deviceTypes: [];
      direction: 'FROM' | 'TO';
      maxLevel: number;
      fetchLastLevelOnly: boolean;
      relationType: 'Contains';
    };
  }

  const VNodes = defineComponent({
    props: {
      vnodes: {
        type: Object,
        required: true,
      },
    },
    render() {
      return this.vnodes;
    },
  });

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const deviceTypesOptions = ref<Array<any>>([{ type: 'default' }]);
  const relationTypeOptions = ref(['Contains', 'Manages']);

  const addName = ref();
  const inputRef = ref();
  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    clientAttributeNames: [],
    latestTsKeyNames: [],
    serverAttributeNames: [],
    sharedAttributeNames: [],
    getLatestValueWithTs: false,
    tellFailureIfAbsent: true,
    fetchTo: 'DATA',
    deviceRelationsQuery: {
      deviceTypes: [],
      direction: 'FROM',
      maxLevel: 1,
      fetchLastLevelOnly: false,
      relationType: 'Contains',
    },
  });

  watch(
    () => props.configuration,
    () => {
      formState.clientAttributeNames = props.configuration.clientAttributeNames;
      formState.latestTsKeyNames = props.configuration.latestTsKeyNames;
      formState.serverAttributeNames = props.configuration.serverAttributeNames;
      formState.sharedAttributeNames = props.configuration.sharedAttributeNames;
      formState.getLatestValueWithTs = props.configuration.getLatestValueWithTs;
      formState.tellFailureIfAbsent = props.configuration.tellFailureIfAbsent;
      formState.fetchTo = props.configuration.fetchTo;
      formState.deviceRelationsQuery = props.configuration.deviceRelationsQuery;
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  function validatorAttributeNames() {
    if (
      !isEmpty(formState.clientAttributeNames) ||
      !isEmpty(formState.serverAttributeNames) ||
      !isEmpty(formState.sharedAttributeNames) ||
      !isEmpty(formState.latestTsKeyNames)
    ) {
      return Promise.resolve();
    } else {
      return Promise.reject(t('tb.ruleChain.nodeAction.originatorAttributesRequired'));
    }
  }

  function addRelationType(e) {
    e.preventDefault();
    relationTypeOptions.value.push(addName.value);
    addName.value = '';
    setTimeout(() => {
      inputRef.value?.focus();
    }, 0);
  }

  onMounted(async () => {
    deviceTypesOptions.value = await getDeviceTypes();
  });

  defineExpose({ getConfiguration });
</script>
