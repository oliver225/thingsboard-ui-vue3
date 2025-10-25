<template>
  <BasicModal
    @register="registerModal"
    :title="t('tb.gateway.details.mqtt.fieldConfigModal.title', { fieldType: fieldTypeName })"
    width="800px"
    :showFooter="true"
    @ok="handleSave"
  >
    <Form ref="formRef" :model="{ fields: tempFields }">
      <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6">
        <div class="flex items-start">
          <Icon icon="ant-design:info-circle-outlined" class="text-blue-400 mr-2 mt-0.5" />
          <div class="text-sm text-blue-700">
            {{
              isAttributesField
                ? t('tb.gateway.details.mqtt.fieldConfigModal.attributesDescription')
                : t('tb.gateway.details.mqtt.fieldConfigModal.timeseriesDescription')
            }}
          </div>
        </div>
      </div>

      <div v-if="tempFields.length === 0" class="text-center py-8 text-gray-500">
        <Icon :icon="fieldTypeIcon" class="text-3xl mb-2" />
        <div>{{ t('tb.gateway.details.mqtt.fieldConfigModal.noFields', { fieldType: fieldTypeName }) }}</div>
        <div class="text-xs">{{ t('tb.gateway.details.mqtt.fieldConfigModal.clickToAdd') }}</div>
      </div>

      <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-2">
        <div v-for="(field, index) in tempFields" :key="index" class="border border-gray-200 rounded bg-white">
          <!-- 折叠视图 -->
          <div
            v-if="!expandedFields[index]"
            class="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
            @click="toggleFieldExpanded(index)"
          >
            <div class="flex items-center gap-2">
              <Tag :color="getFieldTypeColor(field.type)" size="small">{{ field.type.toUpperCase() }}</Tag>
              <span class="font-medium">{{ field.key || t('tb.gateway.details.mqtt.fieldConfigModal.unnamed') }}</span>
              <Icon icon="ant-design:arrow-right-outlined" class="text-gray-400" />
              <span class="text-gray-600">{{
                field.value || t('tb.gateway.details.mqtt.fieldConfigModal.noValue')
              }}</span>
              <div v-if="isAttributesField && field.reportStrategy" class="ml-2">
                <Tag color="orange" size="small">{{
                  t('tb.gateway.details.mqtt.fieldConfigModal.reportStrategy')
                }}</Tag>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button
                type="text"
                size="small"
                @click.stop="toggleFieldExpanded(index)"
                class="text-gray-400 hover:text-blue-500"
              >
                <Icon icon="ant-design:down-outlined" />
              </Button>
              <Button
                type="text"
                size="small"
                @click.stop="removeTempField(index)"
                class="text-red-500 hover:text-red-600"
              >
                <Icon icon="ant-design:delete-outlined" />
              </Button>
            </div>
          </div>

          <!-- 展开视图 -->
          <div v-else class="p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Icon icon="ant-design:setting-outlined" class="text-blue-500" />
                <span class="font-medium">{{
                  t('tb.gateway.details.mqtt.fieldConfigModal.fieldConfig', { fieldType: fieldTypeName })
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  type="text"
                  size="small"
                  @click="toggleFieldExpanded(index)"
                  class="text-gray-400 hover:text-blue-500"
                >
                  <Icon icon="ant-design:up-outlined" />
                </Button>
                <Button
                  type="text"
                  size="small"
                  @click="removeTempField(index)"
                  class="text-red-500 hover:text-red-600"
                >
                  <Icon icon="ant-design:delete-outlined" />
                  {{ t('tb.gateway.details.mqtt.fieldConfigModal.delete') }}
                </Button>
              </div>
            </div>

            <div>
              <!-- 第一行：数据类型和字段名 -->
              <div class="grid grid-cols-2 gap-4">
                <FormItem
                  :label="t('tb.gateway.details.mqtt.fieldConfigModal.dataType')"
                  :name="['fields', index, 'type']"
                  :rules="[{ required: true, message: t('tb.gateway.details.mqtt.fieldConfigModal.selectDataType') }]"
                  class="mb-0"
                >
                  <Select
                    v-model:value="field.type"
                    :options="DATA_TYPE_OPTIONS"
                    :placeholder="t('tb.gateway.details.mqtt.fieldConfigModal.selectDataType')"
                  />
                </FormItem>
                <FormItem
                  :label="t('tb.gateway.details.mqtt.fieldConfigModal.fieldName')"
                  :name="['fields', index, 'key']"
                  :rules="[
                    { required: true, message: t('tb.gateway.details.mqtt.fieldConfigModal.fieldNameRequired') },
                  ]"
                  class="mb-0"
                >
                  <Input
                    v-model:value="field.key"
                    :placeholder="t('tb.gateway.details.mqtt.fieldConfigModal.fieldNamePlaceholder')"
                  />
                </FormItem>
              </div>
              <!-- 第二行：字段值表达式 -->
              <div>
                <FormItem
                  :label="t('tb.gateway.details.mqtt.fieldConfigModal.fieldValueExpression')"
                  :name="['fields', index, 'value']"
                  :rules="[
                    { required: true, message: t('tb.gateway.details.mqtt.fieldConfigModal.fieldValueRequired') },
                  ]"
                  class="mb-0"
                >
                  <Input
                    v-model:value="field.value"
                    :placeholder="t('tb.gateway.details.mqtt.fieldConfigModal.fieldValuePlaceholder')"
                  />
                </FormItem>
              </div>
            </div>

            <!-- 上报策略配置 (仅属性字段) -->
            <div v-if="isAttributesField" class="border-t border-gray-200">
              <div class="flex items-center gap-2 mb-3">
                <Switch
                  v-model:checked="fieldReportStrategyEnabled[index]"
                  @change="onFieldReportStrategyChange(index, $event)"
                />
                <span class="text-sm font-medium">{{
                  t('tb.gateway.details.mqtt.fieldConfigModal.enableReportStrategy')
                }}</span>
              </div>

              <div
                v-if="fieldReportStrategyEnabled[index]"
                class="bg-orange-50 border border-orange-200 rounded p-3 pb-0"
              >
                <div class="grid grid-cols-2 gap-4">
                  <FormItem
                    :label="t('tb.gateway.details.mqtt.fieldConfigModal.reportType')"
                    :name="['fields', index, 'reportStrategy', 'type']"
                    :rules="[
                      { required: true, message: t('tb.gateway.details.mqtt.fieldConfigModal.selectReportType') },
                    ]"
                    class="mb-0"
                  >
                    <Select
                      v-model:value="field.reportStrategy!.type"
                      :options="REPORT_TYPE_OPTIONS"
                      :placeholder="t('tb.gateway.details.mqtt.fieldConfigModal.selectReportType')"
                    />
                  </FormItem>
                  <FormItem
                    v-if="
                      SHOW_REPORT_PERIOD.includes(
                        field?.reportStrategy?.type as REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD,
                      )
                    "
                    :label="t('tb.gateway.details.mqtt.fieldConfigModal.reportPeriod')"
                    :name="['fields', index, 'reportStrategy', 'reportPeriod']"
                    :rules="[
                      { required: true, message: t('tb.gateway.details.mqtt.fieldConfigModal.reportPeriodRequired') },
                    ]"
                    class="mb-0"
                  >
                    <InputNumber
                      v-model:value="field.reportStrategy!.reportPeriod"
                      :min="0"
                      :addon-after="t('tb.gateway.details.mqtt.fieldConfigModal.milliseconds')"
                      placeholder="15000"
                      class="w-full"
                    />
                  </FormItem>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button type="dashed" block @click="addTempField" class="mt-4">
        <Icon icon="ant-design:plus-outlined" />
        {{ t('tb.gateway.details.mqtt.fieldConfigModal.addField', { fieldType: fieldTypeName }) }}
      </Button>
    </Form>
  </BasicModal>
</template>

<script lang="ts" setup name="FieldConfigModal">
  import { ref, computed, unref } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Switch, Button, Tag } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { REPORT_TYPE, REPORT_TYPE_OPTIONS, SHOW_REPORT_PERIOD } from '/@/enums/gateway';

  import { AttributeMapping, CONVERTER_FIELD_TYPE, DATA_TYPE, DATA_TYPE_OPTIONS } from './type';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n();

  const formRef = ref<FormInstance>();
  const tempFields = ref<AttributeMapping[]>([]);
  const fieldType = ref<CONVERTER_FIELD_TYPE>(CONVERTER_FIELD_TYPE.ATTRIBUTES);

  // UI state
  const expandedFields = ref<Record<number, boolean>>({});
  const fieldReportStrategyEnabled = ref<Record<number, boolean>>({});

  // Computed properties
  const isAttributesField = computed(() => fieldType.value === CONVERTER_FIELD_TYPE.ATTRIBUTES);
  const fieldTypeName = computed(() =>
    isAttributesField.value
      ? t('tb.gateway.details.mqtt.fieldConfigModal.attributeTypeName')
      : t('tb.gateway.details.mqtt.fieldConfigModal.timeseriesTypeName'),
  );
  const fieldTypeIcon = computed(() =>
    isAttributesField.value ? 'ant-design:tag-outlined' : 'ant-design:line-chart-outlined',
  );

  const [registerModal, { closeModal }] = useModalInner(async (data) => {
    fieldType.value = data.fieldType;
    if (data?.fields) {
      tempFields.value = cloneDeep(data.fields);
      // Initialize UI state
      expandedFields.value = {};
      fieldReportStrategyEnabled.value = {};

      tempFields.value.forEach((field, index) => {
        expandedFields.value[index] = false;
        fieldReportStrategyEnabled.value[index] = !!field.reportStrategy;
      });
    } else {
      tempFields.value = [];
      expandedFields.value = {};
      fieldReportStrategyEnabled.value = {};
    }
  });

  function createDefaultField() {
    const baseField: AttributeMapping = {
      type: DATA_TYPE.STRING,
      key: '',
      value: '',
    };

    return baseField;
  }

  function addTempField() {
    const newIndex = tempFields.value.length;
    tempFields.value.push(createDefaultField());

    // Initialize UI state for new field
    expandedFields.value[newIndex] = true; // New fields start expanded
    fieldReportStrategyEnabled.value[newIndex] = false;
  }

  function removeTempField(index: number) {
    if (tempFields.value.length > index) {
      tempFields.value.splice(index, 1);

      // Clean up UI state
      delete expandedFields.value[index];
      delete fieldReportStrategyEnabled.value[index];
    }
  }

  function toggleFieldExpanded(index: number) {
    expandedFields.value[index] = !expandedFields.value[index];
  }

  function onFieldReportStrategyChange(index: number, enabled: boolean | string | number) {
    const field = tempFields.value[index];
    if (enabled) {
      field.reportStrategy = {
        type: REPORT_TYPE.ON_REPORT_PERIOD,
        reportPeriod: 15000,
      };
    } else {
      delete field.reportStrategy;
    }
  }

  function getFieldTypeColor(type: DATA_TYPE) {
    const colors = {
      [DATA_TYPE.STRING]: 'blue',
      [DATA_TYPE.DOUBLE]: 'green',
      [DATA_TYPE.INTEGER]: 'orange',
      [DATA_TYPE.BOOLEAN]: 'purple',
    };
    return colors[type] || 'default';
  }

  async function handleSave() {
    try {
      await unref(formRef)?.validate();

      emit('success', {
        fields: cloneDeep(tempFields.value),
        fieldType: fieldType.value,
      });
      closeModal();
    } catch (error) {
      console.error(t('tb.gateway.details.mqtt.fieldConfigModal.validationFailed'), error);
    }
  }
</script>

<style scoped></style>
