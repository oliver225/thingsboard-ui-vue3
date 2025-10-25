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
        <div class="flex items-center mb-3">
          <div class="w-1 h-4 bg-green-500 mr-2"></div>
          <span class="text-sm font-medium">{{
            t('tb.gateway.details.attributeConfigModal.reportStrategyConfig')
          }}</span>
        </div>

        <div class="flex items-center mb-3">
          <Switch v-model:checked="enableReportStrategy" class="ml-3" @change="onReportStrategyToggle" />
          <span class="ml-2 text-xs text-gray-500">{{
            t('tb.gateway.details.attributeConfigModal.enableReportStrategy')
          }}</span>
        </div>

        <div v-if="enableReportStrategy" class="grid grid-cols-2 gap-4">
          <FormItem
            :label="t('tb.gateway.details.attributeConfigModal.reportType')"
            :name="['reportStrategy', 'type']"
            :rules="[{ required: true, message: t('tb.gateway.details.attributeConfigModal.reportTypeRequired') }]"
          >
            <Select
              v-model:value="formState.reportStrategy!.type"
              :options="REPORT_TYPE_OPTIONS"
              :placeholder="t('tb.gateway.details.attributeConfigModal.selectReportType')"
            />
          </FormItem>
          <FormItem
            v-if="
              SHOW_REPORT_PERIOD.includes(
                formState?.reportStrategy?.type as REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD,
              )
            "
            :label="t('tb.gateway.details.attributeConfigModal.reportPeriod')"
            :name="['reportStrategy', 'reportPeriod']"
            :rules="[{ required: true, message: t('tb.gateway.details.attributeConfigModal.reportPeriodRequired') }]"
          >
            <InputNumber
              v-model:value="formState.reportStrategy!.reportPeriod"
              :addon-after="t('tb.gateway.details.attributeConfigModal.milliseconds')"
              :min="1000"
              :step="1000"
              :placeholder="t('tb.gateway.details.attributeConfigModal.reportPeriodPlaceholder')"
              class="w-full"
            />
          </FormItem>
        </div>
      </div>
    </Form>
  </BasicModal>
</template>

<script lang="ts" setup name="OpcuaAttributeConfigModal">
  import { ref, unref } from 'vue';
  import { Form, FormItem, InputNumber, Select, Switch } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { AttributeMapping, DEVICE_INFO_SOURCE } from '../type';
  import { REPORT_TYPE, SHOW_REPORT_PERIOD, REPORT_TYPE_OPTIONS } from '/@/enums/gateway';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n();

  const formRef = ref<FormInstance>();
  const enableReportStrategy = ref(false);

  const formState = ref<AttributeMapping>({
    key: '',
    type: DEVICE_INFO_SOURCE.PATH,
    value: '',
  });

  const [registerModal, { closeModal }] = useModalInner(async (data: AttributeMapping) => {
    if (data) {
      formState.value = cloneDeep(data);

      // 设置报告策略状态
      enableReportStrategy.value = !!data.reportStrategy;

      // 如果启用了报告策略但对象不存在，创建默认对象
      if (enableReportStrategy.value && !formState.value.reportStrategy) {
        formState.value.reportStrategy = {
          type: REPORT_TYPE.ON_REPORT_PERIOD,
          reportPeriod: 30000,
        };
      }
    } else {
      formState.value = {
        key: '',
        type: DEVICE_INFO_SOURCE.PATH,
        value: '',
      };
      enableReportStrategy.value = false;
    }
  });

  function onReportStrategyToggle(checked: boolean | string | number) {
    if (checked) {
      // 启用上报策略，创建默认对象
      formState.value.reportStrategy = {
        type: REPORT_TYPE.ON_REPORT_PERIOD,
        reportPeriod: 30000,
      };
    } else {
      // 关闭上报策略，删除对象
      delete formState.value.reportStrategy;
    }
  }

  async function handleSave() {
    try {
      await unref(formRef)?.validate();

      const result = cloneDeep(formState.value);

      // 如果未启用上报策略，清除相关字段
      if (!enableReportStrategy.value) {
        delete result.reportStrategy;
      }

      emit('success', result);
      closeModal();
    } catch (error) {
      console.error(t('tb.gateway.details.attributeConfigModal.validationFailed'), error);
    }
  }
</script>
