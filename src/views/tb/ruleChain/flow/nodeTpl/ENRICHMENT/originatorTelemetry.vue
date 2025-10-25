<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.telemetryKeys')"
      name="latestTsKeyNames"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.telemetryKeysRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
    >
      <Select v-model:value="formState.latestTsKeyNames" mode="tags" />
    </Form.Item>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.fetchInterval') }}</p>
      <div class="p-2">
        <Form.Item name="useMetadataIntervalPatterns">
          <div class="flex items-center">
            <Switch
              size="small"
              v-model:checked="formState.useMetadataIntervalPatterns"
              @change="handleUseMetadataIntervalChange"
            />
            <span class="ml-4">{{ t('tb.ruleChain.nodeAction.useDynamicInterval') }}</span>
          </div>
        </Form.Item>
        <Row :gutter="20" v-if="formState.useMetadataIntervalPatterns == false">
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.startInterval')"
              name="startInterval"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.startIntervalRequired') }]"
            >
              <InputNumber v-model:value="formState.startInterval" :min="1" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.timeUnit')" name="startIntervalTimeUnit">
              <Select v-model:value="formState.startIntervalTimeUnit" :options="TIME_UNIT_OPTIONS" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.endInterval')"
              name="endInterval"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.endIntervalRequired') }]"
            >
              <InputNumber v-model:value="formState.endInterval" :min="1" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.timeUnit')" name="endIntervalTimeUnit">
              <Select v-model:value="formState.endIntervalTimeUnit" :options="TIME_UNIT_OPTIONS" />
            </Form.Item>
          </Col>
        </Row>
        <template v-if="formState.useMetadataIntervalPatterns == true">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.startInterval')"
            name="startIntervalPattern"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.startIntervalRequired') }]"
          >
            <Input v-model:value="formState.startIntervalPattern" />
          </Form.Item>
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.endInterval')"
            name="endIntervalPattern"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.endIntervalRequired') }]"
          >
            <Input v-model:value="formState.endIntervalPattern" />
          </Form.Item>
        </template>
        <Alert type="success">
          <template #message>
            <div v-if="formState.useMetadataIntervalPatterns == false">
              {{
                t('tb.ruleChain.nodeAction.fetchIntervalHelp', {
                  startInterval: formState.startInterval,
                  startIntervalTimeUnit: TIME_UNIT_OPTIONS.find((unit) => unit.value == formState.startIntervalTimeUnit)
                    ?.label,
                  endInterval: formState.endInterval,
                  endIntervalTimeUnit: TIME_UNIT_OPTIONS.find((unit) => unit.value == formState.endIntervalTimeUnit)
                    ?.label,
                })
              }}
            </div>
            <div v-else>
              {{ t('tb.ruleChain.nodeAction.dynamicIntervalHelp') }}
            </div>
          </template>
        </Alert>
      </div>
    </div>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.fetchStrategy') }}</p>
      <div class="p-2">
        <Form.Item name="fetchMode">
          <Radio.Group
            v-model:value="formState.fetchMode"
            button-style="solid"
            :style="{ display: 'flex' }"
            class="w-full"
          >
            <Radio.Button class="flex-1" value="FIRST">First</Radio.Button>
            <Radio.Button class="flex-1" value="LAST">Last</Radio.Button>
            <Radio.Button class="flex-1" value="ALL">All</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Alert type="success">
          <template #message>
            <span v-if="formState.fetchMode == 'FIRST'">
              {{ t('tb.ruleChain.nodeAction.fetchStrategyFirstHelp') }}
            </span>
            <span v-else-if="formState.fetchMode == 'LAST'">
              {{ t('tb.ruleChain.nodeAction.fetchStrategyLastHelp') }}
            </span>
            <span v-else="formState.fetchMode == 'ALL'">
              {{ t('tb.ruleChain.nodeAction.fetchStrategyAllHelp') }}
            </span>
          </template>
        </Alert>
        <template v-if="formState.fetchMode == 'ALL'">
          <Form.Item :label="t('tb.ruleChain.nodeAction.dataAggregation')" name="aggregation">
            <Select v-model:value="formState.aggregation" :options="AGGREGATION_OPTIONS" />
          </Form.Item>
          <Form.Item :label="t('tb.ruleChain.nodeAction.timestampOrdering')" name="orderBy">
            <Select v-model:value="formState.orderBy">
              <Select.Option value="ASC">ASC</Select.Option>
              <Select.Option value="DESC">DESC</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.limit')"
            name="limit"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.limitRequired') }]"
            :help="t('tb.ruleChain.nodeAction.limitHelp')"
          >
            <InputNumber v-model:value="formState.limit" :min="2" :max="1000" :style="{ width: '100%' }" />
          </Form.Item>
        </template>
      </div>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'originator-telemetry',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Switch, Select, Row, Col, Radio, Input, InputNumber, Alert } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Aggregation, OrderBy, TimeUnit, TIME_UNIT_OPTIONS, AGGREGATION_OPTIONS } from '/@/enums/telemetryEnum';

  interface Configuration {
    latestTsKeyNames: [];
    useMetadataIntervalPatterns: boolean;
    startInterval: number;
    startIntervalPattern: string;
    startIntervalTimeUnit: TimeUnit;
    endInterval: number;
    endIntervalPattern: string;
    endIntervalTimeUnit: TimeUnit;
    fetchMode: 'FIRST' | 'LAST' | 'ALL';
    aggregation: Aggregation;
    orderBy: OrderBy;
    limit: 1000;
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
    latestTsKeyNames: [],
    useMetadataIntervalPatterns: false,
    startInterval: 2,
    startIntervalPattern: '',
    startIntervalTimeUnit: TimeUnit.SECONDS,
    endInterval: 1,
    endIntervalPattern: '',
    endIntervalTimeUnit: TimeUnit.SECONDS,
    fetchMode: 'FIRST',
    aggregation: Aggregation.NONE,
    orderBy: OrderBy.ASCENDING,
    limit: 1000,
  });

  watch(
    () => props.configuration,
    () => {
      formState.latestTsKeyNames = props.configuration.latestTsKeyNames;
      formState.useMetadataIntervalPatterns = props.configuration.useMetadataIntervalPatterns;
      formState.startInterval = props.configuration.startInterval;
      formState.startIntervalPattern = props.configuration.startIntervalPattern;
      formState.startIntervalTimeUnit = props.configuration.startIntervalTimeUnit;
      formState.endInterval = props.configuration.endInterval;
      formState.endIntervalPattern = props.configuration.endIntervalPattern;
      formState.endIntervalTimeUnit = props.configuration.endIntervalTimeUnit;
      formState.fetchMode = props.configuration.fetchMode;
      formState.aggregation = props.configuration.aggregation;
      formState.orderBy = props.configuration.orderBy;
      formState.limit = props.configuration.limit;
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

  function handleUseMetadataIntervalChange(useMetadataInterval) {
    if (useMetadataInterval == true) {
      formState.startInterval = -1;
      formState.endInterval = 1;
    } else {
      formState.startInterval = 1;
      formState.endInterval = 2;
    }
  }

  defineExpose({ getConfiguration });
</script>
