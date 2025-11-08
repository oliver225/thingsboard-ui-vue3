<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- Processing settings -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <span class="font-medium">{{ t('tb.ruleChain.nodeAction.processingSettings') }}</span>
        <div class="flex gap-2">
          <Button :type="processingMode === 'basic' ? 'primary' : 'default'" @click="processingMode = 'basic'">
            {{ t('tb.ruleChain.nodeAction.modeBasic') }}
          </Button>
          <Button :type="processingMode === 'advanced' ? 'primary' : 'default'" @click="processingMode = 'advanced'">
            {{ t('tb.ruleChain.nodeAction.modeAdvanced') }}
          </Button>
        </div>
      </div>

      <!-- Basic Mode -->
      <Form.Item
        v-if="processingMode === 'basic'"
        :label="t('tb.ruleChain.nodeAction.strategy')"
        name="basicStrategy"
        :rules="[{ required: true }]"
      >
        <Select v-model:value="formState.basicStrategy">
          <Select.Option v-for="option in basicStrategyOptions" :key="option.value" :value="option.value">
            {{ t(option.label) }}
          </Select.Option>
        </Select>
      </Form.Item>

      <!-- Advanced Mode -->
      <div v-else>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.timeSeries')"
          name="timeseriesStrategy"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.timeseriesStrategy">
            <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
              {{ t(option.label) }}
            </Select.Option>
          </Select>
        </Form.Item>
        <div v-if="formState.timeseriesStrategy === 'DEDUPLICATE'" class="flex gap-2 -mt-2">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.deduplicationInterval')"
            name="timeseriesDeduplicationInterval"
            :rules="[
              { required: true, message: t('tb.ruleChain.nodeAction.deduplicationIntervalRequired') },
              {
                validator: (rule, value) => validateDeduplicationInterval(value, formState.timeseriesDeduplicationUnit),
              },
            ]"
            class="flex-1"
          >
            <InputNumber
              v-model:value="formState.timeseriesDeduplicationInterval"
              :style="{ width: '100%' }"
              :min="1"
            />
          </Form.Item>
          <Form.Item :label="t('tb.ruleChain.nodeAction.units')" name="timeseriesDeduplicationUnit" class="w-32">
            <Select
              v-model:value="formState.timeseriesDeduplicationUnit"
              @change="() => formRef?.validateFields(['timeseriesDeduplicationInterval'])"
            >
              <Select.Option v-for="option in ttlUnitOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          :label="t('tb.ruleChain.nodeAction.latestValues')"
          name="latestStrategy"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.latestStrategy">
            <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
              {{ t(option.label) }}
            </Select.Option>
          </Select>
        </Form.Item>
        <div v-if="formState.latestStrategy === 'DEDUPLICATE'" class="flex gap-2 -mt-2">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.deduplicationInterval')"
            name="latestDeduplicationInterval"
            :rules="[
              { required: true, message: t('tb.ruleChain.nodeAction.deduplicationIntervalRequired') },
              { validator: (rule, value) => validateDeduplicationInterval(value, formState.latestDeduplicationUnit) },
            ]"
            class="flex-1"
          >
            <InputNumber v-model:value="formState.latestDeduplicationInterval" :style="{ width: '100%' }" :min="1" />
          </Form.Item>
          <Form.Item :label="t('tb.ruleChain.nodeAction.units')" name="latestDeduplicationUnit" class="w-32">
            <Select
              v-model:value="formState.latestDeduplicationUnit"
              @change="() => formRef?.validateFields(['latestDeduplicationInterval'])"
            >
              <Select.Option v-for="option in ttlUnitOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          :label="t('tb.ruleChain.nodeAction.webSockets')"
          name="webSocketsStrategy"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.webSocketsStrategy">
            <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
              {{ t(option.label) }}
            </Select.Option>
          </Select>
        </Form.Item>
        <div v-if="formState.webSocketsStrategy === 'DEDUPLICATE'" class="flex gap-2 -mt-2">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.deduplicationInterval')"
            name="webSocketsDeduplicationInterval"
            :rules="[
              { required: true, message: t('tb.ruleChain.nodeAction.deduplicationIntervalRequired') },
              {
                validator: (rule, value) => validateDeduplicationInterval(value, formState.webSocketsDeduplicationUnit),
              },
            ]"
            class="flex-1"
          >
            <InputNumber
              v-model:value="formState.webSocketsDeduplicationInterval"
              :style="{ width: '100%' }"
              :min="1"
            />
          </Form.Item>
          <Form.Item :label="t('tb.ruleChain.nodeAction.units')" name="webSocketsDeduplicationUnit" class="w-32">
            <Select
              v-model:value="formState.webSocketsDeduplicationUnit"
              @change="() => formRef?.validateFields(['webSocketsDeduplicationInterval'])"
            >
              <Select.Option v-for="option in ttlUnitOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          :label="t('tb.ruleChain.nodeAction.calculatedFields')"
          name="calculatedFieldsStrategy"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.calculatedFieldsStrategy">
            <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
              {{ t(option.label) }}
            </Select.Option>
          </Select>
        </Form.Item>
        <div v-if="formState.calculatedFieldsStrategy === 'DEDUPLICATE'" class="flex gap-2 -mt-2">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.deduplicationInterval')"
            name="calculatedFieldsDeduplicationInterval"
            :rules="[
              { required: true, message: t('tb.ruleChain.nodeAction.deduplicationIntervalRequired') },
              {
                validator: (rule, value) =>
                  validateDeduplicationInterval(value, formState.calculatedFieldsDeduplicationUnit),
              },
            ]"
            class="flex-1"
          >
            <InputNumber
              v-model:value="formState.calculatedFieldsDeduplicationInterval"
              :style="{ width: '100%' }"
              :min="1"
            />
          </Form.Item>
          <Form.Item :label="t('tb.ruleChain.nodeAction.units')" name="calculatedFieldsDeduplicationUnit" class="w-32">
            <Select
              v-model:value="formState.calculatedFieldsDeduplicationUnit"
              @change="() => formRef?.validateFields(['calculatedFieldsDeduplicationInterval'])"
            >
              <Select.Option v-for="option in ttlUnitOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
        </div>
      </div>
    </div>

    <!-- Advanced settings -->
    <div class="mb-4">
      <div class="font-medium mb-3">Advanced settings</div>

      <!-- Use server timestamp -->
      <Form.Item :label="t('tb.ruleChain.nodeAction.useServerTs')" name="useServerTs">
        <Switch v-model:checked="formState.useServerTs" />
      </Form.Item>

      <!-- Default TTL with Units -->
      <div class="flex gap-2">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.defaultTTL')"
          name="defaultTTL"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.defaultTTLRequired') }]"
          class="flex-1"
        >
          <InputNumber v-model:value="formState.defaultTTL" :style="{ width: '100%' }" :min="0" />
        </Form.Item>

        <Form.Item :label="t('tb.ruleChain.nodeAction.units')" name="ttlUnit" class="w-32">
          <Select v-model:value="formState.ttlUnit">
            <Select.Option v-for="option in ttlUnitOptions" :key="option.value" :value="option.value">
              {{ t(option.label) }}
            </Select.Option>
          </Select>
        </Form.Item>
      </div>

      <!-- Skip latest persistence -->
      <Form.Item name="skipLatestPersistence">
        <Checkbox v-model:checked="formState.skipLatestPersistence">
          {{ t('tb.ruleChain.nodeAction.skipLatestPersistence') }}
        </Checkbox>
      </Form.Item>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'save-timeseries',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive, computed } from 'vue';
  import { Form, InputNumber, Checkbox, Select, Switch, Button } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { basicStrategyOptions, advancedStrategyOptions, ttlUnitOptions } from '/@/enums/ruleChains';

  interface ProcessingSettings {
    type?: string;
    timeseries?: { type: string; deduplicationIntervalSecs?: number };
    latest?: { type: string; deduplicationIntervalSecs?: number };
    webSockets?: { type: string; deduplicationIntervalSecs?: number };
    calculatedFields?: { type: string; deduplicationIntervalSecs?: number };
  }

  interface Configuration {
    defaultTTL: number;
    skipLatestPersistence: boolean;
    useServerTs: boolean;
    processingSettings?: ProcessingSettings;
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
  const processingMode = ref<'basic' | 'advanced'>('basic');

  const formState = reactive<any>({
    defaultTTL: 0,
    ttlUnit: 'SECONDS',
    skipLatestPersistence: false,
    useServerTs: false,
    basicStrategy: 'ON_EVERY_MESSAGE',
    timeseriesStrategy: 'ON_EVERY_MESSAGE',
    timeseriesDeduplicationInterval: 1,
    timeseriesDeduplicationUnit: 'SECONDS',
    latestStrategy: 'ON_EVERY_MESSAGE',
    latestDeduplicationInterval: 1,
    latestDeduplicationUnit: 'SECONDS',
    webSocketsStrategy: 'ON_EVERY_MESSAGE',
    webSocketsDeduplicationInterval: 1,
    webSocketsDeduplicationUnit: 'SECONDS',
    calculatedFieldsStrategy: 'ON_EVERY_MESSAGE',
    calculatedFieldsDeduplicationInterval: 1,
    calculatedFieldsDeduplicationUnit: 'SECONDS',
  });

  // 将秒转换为指定单位
  function convertFromSeconds(seconds: number, unit: string): number {
    switch (unit) {
      case 'MINUTES':
        return seconds / 60;
      case 'HOURS':
        return seconds / 3600;
      case 'DAYS':
        return seconds / 86400;
      default:
        return seconds;
    }
  }

  // 将指定单位转换为秒
  function convertToSeconds(value: number, unit: string): number {
    switch (unit) {
      case 'MINUTES':
        return value * 60;
      case 'HOURS':
        return value * 3600;
      case 'DAYS':
        return value * 86400;
      default:
        return value;
    }
  }

  // 验证去重间隔（最小1秒，最大1天）
  function validateDeduplicationInterval(value: number, unit: string): Promise<void> {
    if (!value) {
      return Promise.resolve();
    }
    const seconds = convertToSeconds(value, unit);
    if (seconds < 1 || seconds > 86400) {
      return Promise.reject(t('tb.ruleChain.nodeAction.deduplicationIntervalRange'));
    }
    return Promise.resolve();
  }

  watch(
    () => props.configuration,
    () => {
      const config = props.configuration;

      // 解析 defaultTTL 和单位
      formState.defaultTTL = config.defaultTTL || 0;
      formState.ttlUnit = 'SECONDS';

      // 自动选择最合适的单位
      if (formState.defaultTTL > 0) {
        if (formState.defaultTTL % 86400 === 0) {
          formState.ttlUnit = 'DAYS';
          formState.defaultTTL = convertFromSeconds(formState.defaultTTL, 'DAYS');
        } else if (formState.defaultTTL % 3600 === 0) {
          formState.ttlUnit = 'HOURS';
          formState.defaultTTL = convertFromSeconds(formState.defaultTTL, 'HOURS');
        } else if (formState.defaultTTL % 60 === 0) {
          formState.ttlUnit = 'MINUTES';
          formState.defaultTTL = convertFromSeconds(formState.defaultTTL, 'MINUTES');
        }
      }

      formState.skipLatestPersistence = config.skipLatestPersistence || false;
      formState.useServerTs = config.useServerTs || false;

      // 解析 processingSettings
      const settings = config.processingSettings;
      if (settings?.type === 'ADVANCED') {
        processingMode.value = 'advanced';

        // Timeseries
        formState.timeseriesStrategy = settings.timeseries?.type || 'ON_EVERY_MESSAGE';
        if (settings.timeseries?.deduplicationIntervalSecs) {
          const interval = settings.timeseries.deduplicationIntervalSecs;
          formState.timeseriesDeduplicationUnit = 'SECONDS';
          formState.timeseriesDeduplicationInterval = interval;
          // 自动选择最合适的单位
          if (interval % 86400 === 0) {
            formState.timeseriesDeduplicationUnit = 'DAYS';
            formState.timeseriesDeduplicationInterval = convertFromSeconds(interval, 'DAYS');
          } else if (interval % 3600 === 0) {
            formState.timeseriesDeduplicationUnit = 'HOURS';
            formState.timeseriesDeduplicationInterval = convertFromSeconds(interval, 'HOURS');
          } else if (interval % 60 === 0) {
            formState.timeseriesDeduplicationUnit = 'MINUTES';
            formState.timeseriesDeduplicationInterval = convertFromSeconds(interval, 'MINUTES');
          }
        }

        // Latest
        formState.latestStrategy = settings.latest?.type || 'ON_EVERY_MESSAGE';
        if (settings.latest?.deduplicationIntervalSecs) {
          const interval = settings.latest.deduplicationIntervalSecs;
          formState.latestDeduplicationUnit = 'SECONDS';
          formState.latestDeduplicationInterval = interval;
          if (interval % 86400 === 0) {
            formState.latestDeduplicationUnit = 'DAYS';
            formState.latestDeduplicationInterval = convertFromSeconds(interval, 'DAYS');
          } else if (interval % 3600 === 0) {
            formState.latestDeduplicationUnit = 'HOURS';
            formState.latestDeduplicationInterval = convertFromSeconds(interval, 'HOURS');
          } else if (interval % 60 === 0) {
            formState.latestDeduplicationUnit = 'MINUTES';
            formState.latestDeduplicationInterval = convertFromSeconds(interval, 'MINUTES');
          }
        }

        // WebSockets
        formState.webSocketsStrategy = settings.webSockets?.type || 'ON_EVERY_MESSAGE';
        if (settings.webSockets?.deduplicationIntervalSecs) {
          const interval = settings.webSockets.deduplicationIntervalSecs;
          formState.webSocketsDeduplicationUnit = 'SECONDS';
          formState.webSocketsDeduplicationInterval = interval;
          if (interval % 86400 === 0) {
            formState.webSocketsDeduplicationUnit = 'DAYS';
            formState.webSocketsDeduplicationInterval = convertFromSeconds(interval, 'DAYS');
          } else if (interval % 3600 === 0) {
            formState.webSocketsDeduplicationUnit = 'HOURS';
            formState.webSocketsDeduplicationInterval = convertFromSeconds(interval, 'HOURS');
          } else if (interval % 60 === 0) {
            formState.webSocketsDeduplicationUnit = 'MINUTES';
            formState.webSocketsDeduplicationInterval = convertFromSeconds(interval, 'MINUTES');
          }
        }

        // Calculated Fields
        formState.calculatedFieldsStrategy = settings.calculatedFields?.type || 'ON_EVERY_MESSAGE';
        if (settings.calculatedFields?.deduplicationIntervalSecs) {
          const interval = settings.calculatedFields.deduplicationIntervalSecs;
          formState.calculatedFieldsDeduplicationUnit = 'SECONDS';
          formState.calculatedFieldsDeduplicationInterval = interval;
          if (interval % 86400 === 0) {
            formState.calculatedFieldsDeduplicationUnit = 'DAYS';
            formState.calculatedFieldsDeduplicationInterval = convertFromSeconds(interval, 'DAYS');
          } else if (interval % 3600 === 0) {
            formState.calculatedFieldsDeduplicationUnit = 'HOURS';
            formState.calculatedFieldsDeduplicationInterval = convertFromSeconds(interval, 'HOURS');
          } else if (interval % 60 === 0) {
            formState.calculatedFieldsDeduplicationUnit = 'MINUTES';
            formState.calculatedFieldsDeduplicationInterval = convertFromSeconds(interval, 'MINUTES');
          }
        }
      } else {
        processingMode.value = 'basic';
        formState.basicStrategy = settings?.type || 'ON_EVERY_MESSAGE';
      }
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        // 将 TTL 转换回秒
        const ttlInSeconds = convertToSeconds(data.defaultTTL, data.ttlUnit);

        const result: any = {
          defaultTTL: ttlInSeconds,
          skipLatestPersistence: data.skipLatestPersistence,
          useServerTs: data.useServerTs,
        };

        // 构建 processingSettings
        if (processingMode.value === 'basic') {
          result.processingSettings = {
            type: data.basicStrategy,
          };
        } else {
          // Timeseries
          const timeseriesConfig: any = { type: data.timeseriesStrategy };
          if (data.timeseriesStrategy === 'DEDUPLICATE') {
            timeseriesConfig.deduplicationIntervalSecs = convertToSeconds(
              data.timeseriesDeduplicationInterval,
              data.timeseriesDeduplicationUnit,
            );
          }

          // Latest
          const latestConfig: any = { type: data.latestStrategy };
          if (data.latestStrategy === 'DEDUPLICATE') {
            latestConfig.deduplicationIntervalSecs = convertToSeconds(
              data.latestDeduplicationInterval,
              data.latestDeduplicationUnit,
            );
          }

          // WebSockets
          const webSocketsConfig: any = { type: data.webSocketsStrategy };
          if (data.webSocketsStrategy === 'DEDUPLICATE') {
            webSocketsConfig.deduplicationIntervalSecs = convertToSeconds(
              data.webSocketsDeduplicationInterval,
              data.webSocketsDeduplicationUnit,
            );
          }

          // Calculated Fields
          const calculatedFieldsConfig: any = { type: data.calculatedFieldsStrategy };
          if (data.calculatedFieldsStrategy === 'DEDUPLICATE') {
            calculatedFieldsConfig.deduplicationIntervalSecs = convertToSeconds(
              data.calculatedFieldsDeduplicationInterval,
              data.calculatedFieldsDeduplicationUnit,
            );
          }

          result.processingSettings = {
            timeseries: timeseriesConfig,
            latest: latestConfig,
            webSockets: webSocketsConfig,
            calculatedFields: calculatedFieldsConfig,
            type: 'ADVANCED',
          };
        }

        return result;
      }
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
