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
        <div class="border border-neutral-200 rounded-md">
          <div class="font-medium mb-3">{{ t('tb.ruleChain.nodeAction.attributes') }}</div>
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.strategy')"
            name="attributesStrategy"
            :rules="[{ required: true }]"
          >
            <Select v-model:value="formState.attributesStrategy">
              <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
          <div v-if="formState.attributesStrategy === 'DEDUPLICATE'" class="flex gap-2">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.deduplicationInterval')"
              name="attributesDeduplicationInterval"
              :rules="[
                { required: true, message: t('tb.ruleChain.nodeAction.deduplicationIntervalRequired') },
                {
                  validator: (rule, value) =>
                    validateDeduplicationInterval(value, formState.attributesDeduplicationUnit),
                },
              ]"
              class="flex-1"
            >
              <InputNumber
                v-model:value="formState.attributesDeduplicationInterval"
                :style="{ width: '100%' }"
                :min="1"
              />
            </Form.Item>
            <Form.Item :label="t('tb.ruleChain.nodeAction.units')" name="attributesDeduplicationUnit" class="w-32">
              <Select
                v-model:value="formState.attributesDeduplicationUnit"
                @change="() => formRef?.validateFields(['attributesDeduplicationInterval'])"
              >
                <Select.Option v-for="option in ttlUnitOptions" :key="option.value" :value="option.value">
                  {{ t(option.label) }}
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
        </div>

        <div class="border border-neutral-200 rounded-md">
          <div class="font-medium mb-3">{{ t('tb.ruleChain.nodeAction.webSockets') }}</div>
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.strategy')"
            name="webSocketsStrategy"
            :rules="[{ required: true }]"
          >
            <Select v-model:value="formState.webSocketsStrategy">
              <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
          <div v-if="formState.webSocketsStrategy === 'DEDUPLICATE'" class="flex gap-2">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.deduplicationInterval')"
              name="webSocketsDeduplicationInterval"
              :rules="[
                { required: true, message: t('tb.ruleChain.nodeAction.deduplicationIntervalRequired') },
                {
                  validator: (rule, value) =>
                    validateDeduplicationInterval(value, formState.webSocketsDeduplicationUnit),
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
        </div>

        <div class="border border-neutral-200 rounded-md">
          <div class="font-medium mb-3">{{ t('tb.ruleChain.nodeAction.calculatedFields') }}</div>
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.strategy')"
            name="calculatedFieldsStrategy"
            :rules="[{ required: true }]"
          >
            <Select v-model:value="formState.calculatedFieldsStrategy">
              <Select.Option v-for="option in advancedStrategyOptions" :key="option.value" :value="option.value">
                {{ t(option.label) }}
              </Select.Option>
            </Select>
          </Form.Item>
          <div v-if="formState.calculatedFieldsStrategy === 'DEDUPLICATE'" class="flex gap-2">
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
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.units')"
              name="calculatedFieldsDeduplicationUnit"
              class="w-32"
            >
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
    </div>

    <!-- Scope -->
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.scope')"
      name="scope"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.scopeRequired') }]"
    >
      <Select v-model:value="formState.scope" :options="SCOPE_OPTIONS_SIMPLE" />
    </Form.Item>

    <!-- Save attributes only on value change -->
    <Form.Item name="updateAttributesOnlyOnValueChange">
      <div class="border border-neutral-300 rounded-md px-4 py-3">
        <Switch size="small" v-model:checked="formState.updateAttributesOnlyOnValueChange" />
        <span class="ml-2">{{ t('tb.ruleChain.nodeAction.saveAttributesOnlyOnValueChange') }}</span>
      </div>
    </Form.Item>

    <!-- Send attributes updated notification -->
    <Form.Item name="sendAttributesUpdatedNotification" v-if="formState.scope != Scope.CLIENT_SCOPE">
      <div class="border border-neutral-300 rounded-md px-4 py-3">
        <Switch size="small" v-model:checked="formState.sendAttributesUpdatedNotification" />
        <span class="ml-2">{{ t('tb.ruleChain.nodeAction.sendAttributesUpdatedNotification') }}</span>
      </div>
    </Form.Item>

    <!-- Notify device -->
    <Form.Item name="notifyDevice" v-if="formState.scope == Scope.SHARED_SCOPE">
      <div class="border border-neutral-300 rounded-md px-4 py-3">
        <Switch size="small" v-model:checked="formState.notifyDevice" />
        <span class="ml-2">{{ t('tb.ruleChain.nodeAction.notifyDevice') }}</span>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'save-attributes',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Switch, Button, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { SCOPE_OPTIONS_SIMPLE, Scope } from '/@/enums/telemetryEnum';
  import { basicStrategyOptions, advancedStrategyOptions, ttlUnitOptions } from '/@/enums/ruleChains';

  interface ProcessingSettings {
    type?: string;
    attributes?: { type: string; deduplicationIntervalSecs?: number };
    webSockets?: { type: string; deduplicationIntervalSecs?: number };
    calculatedFields?: { type: string; deduplicationIntervalSecs?: number };
  }

  interface Configuration {
    scope: string;
    notifyDevice: boolean;
    sendAttributesUpdatedNotification: boolean;
    updateAttributesOnlyOnValueChange: boolean;
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
    scope: Scope.SERVER_SCOPE,
    notifyDevice: false,
    sendAttributesUpdatedNotification: false,
    updateAttributesOnlyOnValueChange: false,
    basicStrategy: 'ON_EVERY_MESSAGE',
    attributesStrategy: 'ON_EVERY_MESSAGE',
    attributesDeduplicationInterval: 1,
    attributesDeduplicationUnit: 'SECONDS',
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

      formState.scope = config.scope;
      formState.notifyDevice = config.notifyDevice;
      formState.sendAttributesUpdatedNotification = config.sendAttributesUpdatedNotification;
      formState.updateAttributesOnlyOnValueChange = config.updateAttributesOnlyOnValueChange;

      // 解析 processingSettings
      const settings = config.processingSettings;
      if (settings?.type === 'ADVANCED') {
        processingMode.value = 'advanced';

        // Attributes
        formState.attributesStrategy = settings.attributes?.type || 'ON_EVERY_MESSAGE';
        if (settings.attributes?.deduplicationIntervalSecs) {
          const interval = settings.attributes.deduplicationIntervalSecs;
          formState.attributesDeduplicationUnit = 'SECONDS';
          formState.attributesDeduplicationInterval = interval;
          // 自动选择最合适的单位
          if (interval % 86400 === 0) {
            formState.attributesDeduplicationUnit = 'DAYS';
            formState.attributesDeduplicationInterval = convertFromSeconds(interval, 'DAYS');
          } else if (interval % 3600 === 0) {
            formState.attributesDeduplicationUnit = 'HOURS';
            formState.attributesDeduplicationInterval = convertFromSeconds(interval, 'HOURS');
          } else if (interval % 60 === 0) {
            formState.attributesDeduplicationUnit = 'MINUTES';
            formState.attributesDeduplicationInterval = convertFromSeconds(interval, 'MINUTES');
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
        const result: any = {
          scope: data.scope,
          notifyDevice: data.notifyDevice,
          sendAttributesUpdatedNotification: data.sendAttributesUpdatedNotification,
          updateAttributesOnlyOnValueChange: data.updateAttributesOnlyOnValueChange,
        };

        // 构建 processingSettings
        if (processingMode.value === 'basic') {
          result.processingSettings = {
            type: data.basicStrategy,
          };
        } else {
          // Attributes
          const attributesConfig: any = { type: data.attributesStrategy };
          if (data.attributesStrategy === 'DEDUPLICATE') {
            attributesConfig.deduplicationIntervalSecs = convertToSeconds(
              data.attributesDeduplicationInterval,
              data.attributesDeduplicationUnit,
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
            attributes: attributesConfig,
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
