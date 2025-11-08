<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Row :gutter="20">
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.inputValue')"
          name="inputValueKey"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.inputValueRequired') }]"
        >
          <Input v-model:value="formState.inputValueKey" />
        </Form.Item>
      </Col>
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.outputValue')"
          name="outputValueKey"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.outputValueRequired') }]"
        >
          <Input v-model:value="formState.outputValueKey" />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item :label="t('tb.ruleChain.nodeAction.decimalPlaces')" name="round">
      <InputNumber v-model:value="formState.round" :min="0" :max="15" style="width: 100%" />
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
    <Form.Item name="useCache" :help="t('tb.ruleChain.nodeAction.useCacheHelp')">
      <div class="border border-solid border-neutral-300 rounded-md px-4 py-2">
        <Checkbox v-model:checked="formState.useCache"> {{ t('tb.ruleChain.nodeAction.useCache') }} </Checkbox>
      </div>
    </Form.Item>
    <Form.Item name="addPeriodBetweenMsgs" :help="t('tb.ruleChain.nodeAction.addPeriodBetweenMsgsHelp')">
      <div class="border border-solid border-neutral-300 rounded-md px-4 py-2">
        <Checkbox v-model:checked="formState.addPeriodBetweenMsgs">
          {{ t('tb.ruleChain.nodeAction.addPeriodBetweenMsgs') }}
        </Checkbox>
      </div>
    </Form.Item>
    <Form.Item
      v-if="formState.addPeriodBetweenMsgs == true"
      name="periodValueKey"
      label="Period value key"
      :defaultValue="'periodInMs'"
      :rules="[{ required: true }]"
    >
      <Input v-model:value="formState.periodValueKey" />
    </Form.Item>

    <Form.Item name="excludeZeroDeltas" :help="t('tb.ruleChain.nodeAction.calculateDelta.excludeZeroDeltas_help')">
      <div class="border border-solid border-neutral-300 rounded-md px-4 py-2">
        <Checkbox v-model:checked="formState.excludeZeroDeltas">
          {{ t('tb.ruleChain.nodeAction.calculateDelta.excludeZeroDeltas') }}
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
    excludeZeroDeltas: false;
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
    excludeZeroDeltas: false,
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
