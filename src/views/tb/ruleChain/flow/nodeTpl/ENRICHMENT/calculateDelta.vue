<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Row :gutter="20">
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.inputValue')"
          name="inputValueKey"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.inputValueRequired') }]"
        >
          <Input v-model:value="formState.inputValueKey"> </Input>
        </Form.Item>
      </Col>
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.outputValue')"
          name="outputValueKey"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.outputValueRequired') }]"
        >
          <Input v-model:value="formState.outputValueKey"> </Input>
        </Form.Item>
      </Col>
    </Row>
    <Form.Item :label="t('tb.ruleChain.nodeAction.decimalPlaces')" name="round">
      <InputNumber v-model:value="formState.round" style="width: 100%"> </InputNumber>
    </Form.Item>
    <Form.Item
      name="tellFailureIfDeltaIsNegative"
      :help="t('tb.ruleChain.nodeAction.tellFailureIfDeltaIsNegativeHelp')"
    >
      <div class="border border-solid border-neutral-300 rounded-md px-4 py-2">
        <Checkbox v-model:checked="formState.tellFailureIfDeltaIsNegative">
          {{ t('tb.ruleChain.nodeAction.tellFailureIfDeltaIsNegative') }}
        </Checkbox>
      </div>
    </Form.Item>
    <Form.Item name="useCache">
      <div class="border border-neutral-300 rounded-md px-4 py-2" :help="t('tb.ruleChain.nodeAction.useCacheHelp')">
        <Checkbox v-model:checked="formState.useCache"> {{ t('tb.ruleChain.nodeAction.useCache') }} </Checkbox>
      </div>
    </Form.Item>
    <Form.Item name="addPeriodBetweenMsgs" :help="t('tb.ruleChain.nodeAction.addPeriodBetweenMsgsHelp')">
      <div class="border border-neutral-300 rounded-md px-4 py-2">
        <Checkbox v-model:checked="formState.addPeriodBetweenMsgs">
          {{ t('tb.ruleChain.nodeAction.addPeriodBetweenMsgs') }}
        </Checkbox>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'calculate-delta',
    components: { Checkbox },
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Row, Col, InputNumber, Checkbox } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    inputValueKey: string;
    outputValueKey: string;
    periodValueKey: string;
    round: number;
    useCache: boolean;
    addPeriodBetweenMsgs: boolean;
    tellFailureIfDeltaIsNegative: boolean;
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
    inputValueKey: 'pulseCounter',
    outputValueKey: 'delta',
    round: undefined,
    tellFailureIfDeltaIsNegative: true,
    useCache: true,
    addPeriodBetweenMsgs: false,
    periodValueKey: 'periodInMs',
  });

  watch(
    () => props.configuration,
    () => {
      formState.inputValueKey = props.configuration.inputValueKey;
      formState.outputValueKey = props.configuration.outputValueKey;
      formState.periodValueKey = props.configuration.periodValueKey;
      formState.round = props.configuration.round;
      formState.useCache = props.configuration.useCache;
      formState.addPeriodBetweenMsgs = props.configuration.addPeriodBetweenMsgs;
      formState.tellFailureIfDeltaIsNegative = props.configuration.tellFailureIfDeltaIsNegative;
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

  defineExpose({ getConfiguration });
</script>
