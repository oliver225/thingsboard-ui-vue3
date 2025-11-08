<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.function')"
      name="operation"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.functionRequired') }]"
    >
      <Select v-model:value="formState.operation" @change="onOperationChange">
        <Select.Option value="CUSTOM">
          <p>{{ t('tb.ruleChain.nodeAction.customFunction') }}</p>
          <p class="text-sm">{{ t('tb.ruleChain.nodeAction.customFunctionHelp') }}</p>
        </Select.Option>
        <Select.Option value="ADD">
          <p>{{ t('tb.ruleChain.nodeAction.add') }}</p>
          <p class="text-sm">x + y</p>
        </Select.Option>
        <Select.Option value="SUB">
          <p>{{ t('tb.ruleChain.nodeAction.subtract') }}</p>
          <p class="text-sm">x - y</p>
        </Select.Option>
        <Select.Option value="MULT">
          <p>{{ t('tb.ruleChain.nodeAction.multiply') }}</p>
          <p class="text-sm">x * y</p>
        </Select.Option>
        <Select.Option value="DIV">
          <p>{{ t('tb.ruleChain.nodeAction.divide') }}</p>
          <p class="text-sm">x / y</p>
        </Select.Option>
      </Select>
    </Form.Item>
    <div class="border border-solid border-neutral-400 p-2 rounded mt-3">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.parameters') }}</p>
      <div class="p-4">
        <Row
          :gutter="20"
          v-for="(argument, index) in formState.arguments"
          :key="index"
          class="border border-solid border-neutral-400 p-2 mb-3 rounded"
        >
          <Col :span="2">
            <div class="h-full place-content-center">
              <span class="text-base font-bold">= {{ argument.name }}</span>
            </div>
          </Col>
          <Col :span="20">
            <Row :gutter="20">
              <Col :span="24">
                <Form.Item :name="['arguments', index, 'type']" :rules="[{ required: true }]">
                  <Select v-model:value="formState.arguments[index].type">
                    <Select.Option value="MESSAGE_BODY">{{
                      t('tb.ruleChain.nodeAction.argFromMessage')
                    }}</Select.Option>
                    <Select.Option value="MESSAGE_METADATA">{{
                      t('tb.ruleChain.nodeAction.argFromMetadata')
                    }}</Select.Option>
                    <Select.Option value="ATTRIBUTE">{{ t('tb.ruleChain.nodeAction.argFromAttribute') }}</Select.Option>
                    <Select.Option value="TIME_SERIES">{{
                      t('tb.ruleChain.nodeAction.argFromTimeseries')
                    }}</Select.Option>
                    <Select.Option value="CONSTANT">{{ t('tb.ruleChain.nodeAction.argConstant') }}</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.ruleChain.nodeAction.value')"
                  :name="['arguments', index, 'key']"
                  :rules="[{ required: true }]"
                >
                  <Input v-model:value="formState.arguments[index].key" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :label="t('tb.ruleChain.nodeAction.defaultValue')"
                  :name="['arguments', index, 'defaultValue']"
                >
                  <InputNumber v-model:value="formState.arguments[index].defaultValue" :style="{ width: '100%' }" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
          <Col :span="2">
            <div class="h-full place-content-center" v-show="formState.operation == 'CUSTOM'">
              <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
                <Icon
                  :icon="'ant-design:delete-outlined'"
                  :size="20"
                  color="red"
                  class="cursor-pointer"
                  @click="handleDeleteArgument(index)"
                />
              </Tooltip>
            </div>
          </Col>
        </Row>
        <Button block type="primary" :disabled="formState.operation != 'CUSTOM'" @click="handleAddArguments">{{
          t('tb.ruleChain.nodeAction.addArgument')
        }}</Button>
      </div>
    </div>
    <div class="border border-solid border-neutral-400 p-2 rounded mt-3" v-if="formState.operation == 'CUSTOM'">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.mathExpression') }}</p>
      <div class="p-2">
        <Form.Item
          name="customFunction"
          :help="t('tb.ruleChain.nodeAction.mathExpressionHelp')"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.customFunction" default-value="(x - 32) / 1.8" />
        </Form.Item>
      </div>
    </div>
    <div class="border border-solid border-neutral-400 p-2 rounded mt-3">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.result') }}</p>
      <div class="p-2">
        <Form.Item :label="t('tb.ruleChain.nodeAction.type')" :name="['result', 'type']" :rules="[{ required: true }]">
          <Select v-model:value="formState.result.type">
            <Select.Option value="MESSAGE_BODY">{{ t('tb.ruleChain.nodeAction.resultToMessage') }}</Select.Option>
            <Select.Option value="MESSAGE_METADATA">{{ t('tb.ruleChain.nodeAction.resultToMetadata') }}</Select.Option>
            <Select.Option value="ATTRIBUTE">{{ t('tb.ruleChain.nodeAction.resultToAttribute') }}</Select.Option>
            <Select.Option value="TIME_SERIES">{{ t('tb.ruleChain.nodeAction.resultToTimeseries') }}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item :label="t('tb.ruleChain.nodeAction.key')" :name="['result', 'key']" :rules="[{ required: true }]">
          <Input v-model:value="formState.result.key" />
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.precision')"
          :name="['result', 'resultValuePrecision']"
          :rules="[{ required: true }]"
          :help="t('tb.ruleChain.nodeAction.precisionHelp')"
        >
          <InputNumber v-model:value="formState.result.resultValuePrecision" :min="0" :style="{ width: '100%' }" />
        </Form.Item>
      </div>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'math-function',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Form, Select, Input, InputNumber, Row, Col, Button, Tooltip } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Arguments {
    name: string;
    type: 'MESSAGE_BODY' | 'MESSAGE_METADATA' | 'ATTRIBUTE' | 'TIME_SERIES' | 'CONSTANT';
    key: string;
    defaultValue: number;
    attributeScope: 'SHARED_SCOPE' | 'SERVER_SCOPE';
    resultValuePrecision: number;
  }

  interface Configuration {
    arguments: Array<Arguments>;
    customFunction: string;
    operation: string;
    result: Arguments;
  }

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
    arguments: [],
    customFunction: '(x - 32) / 1.8',
    operation: 'CUSTOM',
  });

  watch(
    () => props.configuration,
    () => {
      formState.arguments = props.configuration.arguments;
      formState.customFunction = props.configuration.customFunction;
      formState.operation = props.configuration.operation;
      formState.result = props.configuration.result;
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

  function onOperationChange(operate) {
    if (operate == 'CUSTOM') {
      formState.customFunction = '(x - 32) / 1.8';
      formState.arguments = [{ name: 'x', type: 'MESSAGE_BODY', key: '', defaultValue: undefined }];
    } else {
      formState.customFunction = undefined;
      formState.arguments = [
        { name: 'x', type: 'MESSAGE_BODY', key: '', defaultValue: undefined },
        { name: 'y', type: 'MESSAGE_BODY', key: '', defaultValue: undefined },
      ];
    }
  }

  function handleAddArguments() {
    if (formState.arguments.length) {
      formState.arguments.push({ name: generateName(), type: 'MESSAGE_BODY', key: '', defaultValue: undefined });
    } else {
      formState.arguments = [{ name: 'x', type: 'MESSAGE_BODY', key: '', defaultValue: undefined }];
    }
  }
  function handleDeleteArgument(index: number) {
    formState.arguments.splice(index, 1);
  }

  function generateName() {
    if (!formState.arguments.length) {
      return 'x';
    }
    const last = formState.arguments.length - 1;
    const lastName = formState.arguments[last].name;
    if (lastName == 'x') {
      return 'y';
    } else if (lastName == 'y') {
      return 'z';
    } else if (lastName == 'z') {
      return 'a';
    } else {
      const asciiCode = lastName.charCodeAt(0);
      return String.fromCharCode(asciiCode + 1);
    }
  }

  defineExpose({ getConfiguration });
</script>
