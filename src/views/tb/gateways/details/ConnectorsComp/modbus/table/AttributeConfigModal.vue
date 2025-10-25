<template>
  <BasicModal
    @register="registerModal"
    :title="t('tb.gateway.details.attributeConfigModal.title')"
    width="600px"
    :showFooter="true"
    @ok="handleSave"
  >
    <Form ref="formRef" :model="formState" layout="vertical">
      <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6">
        <div class="flex items-start">
          <Icon icon="ant-design:info-circle-outlined" class="text-blue-400 mr-2 mt-0.5" />
          <div class="text-sm text-blue-700">{{ t('tb.gateway.details.attributeConfigModal.description') }}</div>
        </div>
      </div>

      <!-- Report Strategy 配置 -->
      <div class="mb-6">
        <div class="flex items-center mb-4">
          <div class="w-1 h-4 bg-green-500 mr-2"></div>
          <span class="text-sm font-medium">{{
            t('tb.gateway.details.attributeConfigModal.reportStrategyConfig')
          }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div class="flex items-center gap-2">
            <Switch v-model:checked="enableReportStrategy" />
            <span class="text-sm font-medium">{{
              t('tb.gateway.details.attributeConfigModal.enableReportStrategy')
            }}</span>
          </div>
        </div>

        <div v-if="enableReportStrategy" class="mt-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormItem :label="t('tb.gateway.details.attributeConfigModal.reportType')">
              <Select
                v-model:value="reportStrategyType"
                :options="REPORT_TYPE_OPTIONS"
                :placeholder="t('tb.gateway.details.attributeConfigModal.selectReportType')"
              />
            </FormItem>
            <FormItem
              v-if="SHOW_REPORT_PERIOD.includes(reportStrategyType as REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD)"
              :label="t('tb.gateway.details.attributeConfigModal.reportPeriod')"
              :rules="[{ required: true, message: t('tb.gateway.details.attributeConfigModal.reportPeriodRequired') }]"
            >
              <InputNumber
                v-model:value="reportPeriod"
                :addon-after="t('tb.gateway.details.attributeConfigModal.milliseconds')"
                :min="1000"
                :placeholder="t('tb.gateway.details.attributeConfigModal.reportPeriodPlaceholder')"
                class="w-full"
              />
            </FormItem>
          </div>
        </div>

        <div v-else class="mt-4">
          <div class="bg-gray-50 border-l-4 border-gray-400 p-3">
            <div class="flex items-start">
              <Icon icon="ant-design:pause-circle-outlined" class="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <div class="text-sm text-gray-600">{{
                t('tb.gateway.details.attributeConfigModal.reportStrategyDisabled')
              }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modifier 配置 (仅整数类型显示) -->
      <div v-if="isIntegerType(tempDataType)" class="mb-6">
        <div class="flex items-center mb-4">
          <div class="w-1 h-4 bg-blue-500 mr-2"></div>
          <span class="text-sm font-medium">{{ t('tb.gateway.details.attributeConfigModal.dataModifierConfig') }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div class="flex items-center gap-2">
            <Switch v-model:checked="enableModifier" />
            <span class="text-sm font-medium">{{
              t('tb.gateway.details.attributeConfigModal.enableDataModifier')
            }}</span>
          </div>
        </div>

        <div v-if="enableModifier" class="mt-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormItem :label="t('tb.gateway.details.attributeConfigModal.modifierType')">
              <Select
                v-model:value="modifierType"
                :options="MODIFIER_TYPE_OPTIONS"
                :placeholder="t('tb.gateway.details.attributeConfigModal.selectModifierType')"
              />
            </FormItem>
            <FormItem :label="t('tb.gateway.details.attributeConfigModal.value')">
              <InputNumber
                v-model:value="modifierValue"
                :min="0.01"
                :step="0.1"
                :placeholder="t('tb.gateway.details.attributeConfigModal.valuePlaceholder')"
                class="w-full"
                :rules="[{ required: true, message: t('tb.gateway.details.attributeConfigModal.valueRequired') }]"
              />
            </FormItem>
          </div>
        </div>

        <div v-else class="mt-4">
          <div class="bg-gray-50 border-l-4 border-gray-400 p-3">
            <div class="flex items-start">
              <Icon icon="ant-design:pause-circle-outlined" class="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <div class="text-sm text-gray-600">{{
                t('tb.gateway.details.attributeConfigModal.dataModifierDisabled')
              }}</div>
            </div>
          </div>
        </div>
      </div>
    </Form>
  </BasicModal>
</template>

<script lang="ts" setup name="AttributeConfigModal">
  import { ref, unref } from 'vue';
  import { Form, FormItem, InputNumber, Select, Switch } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ModbusAttribute, DATA_TYPE, MODIFIER_TYPE, isIntegerType, MODIFIER_TYPE_OPTIONS } from '../type';
  import { REPORT_TYPE, SHOW_REPORT_PERIOD, REPORT_TYPE_OPTIONS } from '/@/enums/gateway';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n();

  const formRef = ref<FormInstance>();
  const enableReportStrategy = ref(false);
  const enableModifier = ref(false);

  // 高级配置相关的状态
  const reportStrategyType = ref(REPORT_TYPE.ON_REPORT_PERIOD);
  const reportPeriod = ref(15000);
  const modifierType = ref(MODIFIER_TYPE.MULTIPLIER);
  const modifierValue = ref(1);
  const tempDataType = ref<DATA_TYPE>(DATA_TYPE.STRING);

  // 临时存储原始数据，用于最终保存
  const originalData = ref<ModbusAttribute | null>(null);

  const formState = ref<{ configItems: any[] }>({ configItems: [] });

  const [registerModal, { closeModal }] = useModalInner(async (data) => {
    if (data) {
      originalData.value = cloneDeep(data);
      tempDataType.value = data.type || DATA_TYPE.STRING;

      // 设置高级配置状态
      enableReportStrategy.value = !!data.reportStrategy;
      reportStrategyType.value = data.reportStrategy?.type || REPORT_TYPE.ON_REPORT_PERIOD;
      reportPeriod.value = data.reportStrategy?.reportPeriod || 15000;

      enableModifier.value = !!(data.divider || data.multiplier);
      modifierType.value = data.divider ? MODIFIER_TYPE.DIVIDER : MODIFIER_TYPE.MULTIPLIER;
      modifierValue.value = data.divider || data.multiplier || 1;
    } else {
      originalData.value = null;
      tempDataType.value = DATA_TYPE.STRING;
      enableReportStrategy.value = false;
      enableModifier.value = false;
      reportStrategyType.value = REPORT_TYPE.ON_REPORT_PERIOD;
      reportPeriod.value = 15000;
      modifierType.value = MODIFIER_TYPE.MULTIPLIER;
      modifierValue.value = 1;
    }
  });

  async function handleSave() {
    try {
      await unref(formRef)?.validate();

      if (!originalData.value) return;

      const result = cloneDeep(originalData.value);

      // 处理 Report Strategy
      if (enableReportStrategy.value) {
        result.reportStrategy = {
          type: reportStrategyType.value as REPORT_TYPE,
          reportPeriod: reportPeriod.value,
        };
      } else {
        delete result.reportStrategy;
      }

      // 处理 Modifier (仅整数类型)
      if (isIntegerType(tempDataType.value)) {
        // 清除之前的修饰符
        delete result.divider;
        delete result.multiplier;

        if (enableModifier.value) {
          if (modifierType.value === MODIFIER_TYPE.DIVIDER) {
            result.divider = modifierValue.value;
          } else {
            result.multiplier = modifierValue.value;
          }
        }
      }

      emit('success', result);
      closeModal();
    } catch (error) {
      console.error(t('tb.gateway.details.attributeConfigModal.validationFailed'), error);
    }
  }
</script>
