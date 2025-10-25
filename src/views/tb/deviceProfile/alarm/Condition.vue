<template>
  <div class="device-profile-alarm-condition">
    <div v-if="record.condition.length == 0" @click="handleConditionForm">
      <span class="text-red-500" v-if="edit == true">{{ t('tb.deviceProfile.alarmCondition.addConditionTip') }}</span>
    </div>
    <div v-else @click="handleConditionForm">
      <div class="preview truncate" v-if="flatCondition.length > 0">
        <span v-for="(item, index) in flatCondition" :key="index">
          <span v-if="index > 0" class="he">{{ t('tb.deviceProfile.alarmCondition.and') }}</span>
          <span class="key-key">{{ item?.key.key }}</span>
          {{ PREDICATE_OPERATION_OPTIONS.find((operation) => operation.value === item?.predicate.operation)?.label }}
          <span class="predicate-value" v-if="item.predicate.value.defaultValue">
            {{
              item.valueType == 'DATE_TIME'
                ? dayjs(item.predicate.value.defaultValue as number).format('YYYY-MM-DD HH:mm:ss')
                : item.predicate.value.defaultValue
            }}
          </span>
        </span>
        <div v-if="record.spec.type !== 'SIMPLE'">
          <span v-if="record.spec.type == 'DURATION'">
            {{
              t('tb.deviceProfile.alarmCondition.durationWithin', {
                value: record.spec.predicate?.defaultValue,
                unit: getUnitLabel(record.spec.unit || 'SECONDS'),
              })
            }}
          </span>
          <span v-if="record.spec.type == 'REPEATING'">
            {{ t('tb.deviceProfile.alarmCondition.repeat', { value: record.spec.predicate?.defaultValue }) }}
          </span>
        </div>
      </div>
    </div>

    <BasicModal
      :open="modalVisible"
      :title="t('tb.deviceProfile.alarmCondition.conditionModalTitle')"
      width="50%"
      :show-ok-btn="edit == true"
      @ok="handleSubmit"
      :onCancel="handleModalClose"
    >
      <div class="condition-modal">
        <CollapseContainer
          :title="t('tb.deviceProfile.alarmCondition.keyFilter')"
          class="border border-solid border-neutral-300 mb-2"
        >
          <BasicTable @register="registerTable" size="small" :dataSource="record.condition" style="padding: 0" />
          <a-button type="primary" v-if="edit == true" @click="handleConditionItemForm({})" size="small">
            <Icon icon="i-fluent:add-12-filled" />{{ t('tb.deviceProfile.alarmCondition.addFilter') }}
          </a-button>
        </CollapseContainer>
        <CollapseContainer
          :title="t('tb.deviceProfile.alarmCondition.filterPreview')"
          class="border border-solid border-neutral-300 mb-2"
        >
          <div class="m-2 p-2 border border-solid border-neutral-400 preview" v-if="flatCondition.length > 0">
            <span v-for="(item, index) in flatCondition" :key="index">
              <span v-if="index > 0" class="he">{{ t('tb.deviceProfile.alarmCondition.and') }}</span>
              <span class="key-key">{{ item?.key.key }}</span>
              {{
                PREDICATE_OPERATION_OPTIONS.find((operation) => operation.value === item?.predicate.operation)?.label
              }}
              <span class="predicate-value" v-if="item.predicate.value.defaultValue">
                {{
                  item.valueType == 'DATE_TIME'
                    ? dayjs(item.predicate.value.defaultValue as number).format('YYYY-MM-DD HH:mm:ss')
                    : item.predicate.value.defaultValue
                }}
              </span>
            </span>
          </div>
        </CollapseContainer>
        <CollapseContainer
          :title="t('tb.deviceProfile.alarmCondition.conditionType')"
          class="border border-solid border-neutral-300 mb-2"
        >
          <Select
            v-model:value="record.spec.type"
            style="width: 100%"
            :disabled="edit == false"
            @change="handleSepcTypeChange"
          >
            <Select.Option value="SIMPLE">{{ t('tb.deviceProfile.alarmCondition.simple') }}</Select.Option>
            <Select.Option value="DURATION">{{ t('tb.deviceProfile.alarmCondition.duration') }}</Select.Option>
            <Select.Option value="REPEATING">{{ t('tb.deviceProfile.alarmCondition.repeating') }}</Select.Option>
          </Select>
          <div class="mt-4" v-if="record.spec.type == 'DURATION' && record.spec.predicate">
            <InputGroup compact>
              <InputNumber
                :placeholder="t('tb.deviceProfile.alarmCondition.inputDuration')"
                v-model:value="record.spec.predicate.defaultValue"
                :min="1"
                style="width: 70%"
                :disabled="edit == false"
              />
              <Select
                v-model:value="record.spec.unit"
                style="width: 30%"
                :defaultValue="'SECONDS'"
                :disabled="edit == false"
              >
                <Select.Option value="SECONDS">{{ t('tb.deviceProfile.alarmCondition.seconds') }}</Select.Option>
                <Select.Option value="MINUTES">{{ t('tb.deviceProfile.alarmCondition.minutes') }}</Select.Option>
                <Select.Option value="HOURS">{{ t('tb.deviceProfile.alarmCondition.hours') }}</Select.Option>
                <Select.Option value="DAYS">{{ t('tb.deviceProfile.alarmCondition.days') }}</Select.Option>
              </Select>
            </InputGroup>
          </div>
          <div class="mt-4" v-if="record.spec.type == 'REPEATING' && record.spec.predicate">
            <InputNumber
              :placeholder="t('tb.deviceProfile.alarmCondition.inputRepeat')"
              v-model:value="record.spec.predicate.defaultValue"
              :min="1"
              style="width: 100%"
              :disabled="edit == false"
            >
              <template #addonAfter>{{ t('tb.deviceProfile.alarmCondition.times') }}</template>
            </InputNumber>
          </div>
        </CollapseContainer>
      </div>
      <ConditionItemForm @register="registerConditionItemModal" @success="handleConditionItemSuccess" />
    </BasicModal>
  </div>
</template>
<script lang="ts" setup name="AlarmCondition">
  import { reactive, ref, onMounted, computed } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Select, InputNumber, InputGroup } from 'ant-design-vue';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { BasicModal, useModal } from '/@/components/Modal';
  import { Condition, ConditionItem, Spec } from '/@/api/tb/deviceProfile';
  import { CollapseContainer } from '/@/components/Container';
  import ConditionItemForm from './ConditionItem.vue';
  import { propTypes } from '/@/utils/propTypes';
  import {
    ALARM_CONDITION_KEY_TYPE_OPTIONS,
    PREDICATE_OPERATION_OPTIONS,
    ALARM_CONDITION_VALUE_TYPE_OPTIONS,
  } from '/@/enums/alarmEnum';
  import { isArray } from 'lodash-es';
  import dayjs from 'dayjs';
  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');

  const emit = defineEmits(['update:value']);

  const modalVisible = ref(false);

  const record = reactive({
    condition: [] as Array<ConditionItem | undefined>,
    spec: { type: 'SIMPLE' } as Spec,
  });

  const props = defineProps({
    value: {
      type: Object as PropType<Condition>,
      required: true,
    },
    edit: propTypes.bool.def(true),
  });

  const flatCondition = computed(() => {
    const result: Array<ConditionItem> = [];
    record.condition.forEach((item) => {
      if (isArray(item?.predicate)) {
        item?.predicate.forEach((predicate) => {
          result.push({
            key: item.key,
            valueType: item.valueType,
            value: item.value,
            predicate: predicate,
          });
        });
      } else {
        result.push(item as ConditionItem);
      }
    });
    return result;
  });

  const tableColumns: BasicColumn[] = [
    {
      title: '',
      dataIndex: 'key',
      align: 'center',
      format: () => t('tb.deviceProfile.alarmCondition.and'),
      width: 80,
    },
    {
      title: t('tb.deviceProfile.alarmCondition.keyName'),
      dataIndex: 'key.key',
      align: 'left',
    },
    {
      title: t('tb.deviceProfile.alarmCondition.keyType'),
      dataIndex: 'key.type',
      align: 'center',
      format: (text: any) =>
        text ? ALARM_CONDITION_KEY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : '',
    },
    {
      title: t('tb.deviceProfile.alarmCondition.dataType'),
      dataIndex: 'valueType',
      align: 'center',
      format: (text: any) =>
        text ? ALARM_CONDITION_VALUE_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : '',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 80,
    ifShow: props.edit == true,
    actions: (record: Recordable) => [
      {
        icon: 'i-clarity:note-edit-line',
        title: t('tb.deviceProfile.alarmCondition.editFilter'),
        onClick: handleConditionItemForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        title: t('tb.deviceProfile.alarmCondition.deleteFilter'),
        color: 'error',
        onClick: handleDeleteConditionItem.bind(this, { ...record }),
      },
    ],
  };

  const [registerConditionItemModal, { openModal: openConditionItemModal }] = useModal();

  const [registerTable, { reload }] = useTable({
    rowKey: 'key.key',
    maxHeight: 150,
    bordered: false,
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: false,
    showIndexColumn: false,
    pagination: false,
    useSearchForm: false,
    canResize: true,
  });

  onMounted(() => {
    init();
  });

  function init() {
    record.spec = props.value?.spec || { type: 'SIMPLE' };
    record.condition = [];
    if (isArray(props.value?.condition)) {
      const tmpMap = new Map<string, Array<ConditionItem>>();
      props.value.condition.forEach((conditionItem) => {
        let list = tmpMap.get(conditionItem.key.key || '');
        if (!list) {
          list = [];
        }
        list.push(conditionItem);
        tmpMap.set(conditionItem.key.key || '', list);
      });
      record.condition = [];
      tmpMap.forEach((value, key) => {
        record.condition.push({ ...value[0], predicate: value.map((item) => item.predicate) });
      });
    }
  }

  function handleConditionForm() {
    modalVisible.value = true;
  }

  function handleModalClose() {
    modalVisible.value = false;
  }

  function handleConditionItemForm(data: Recordable) {
    openConditionItemModal(true, { ...data });
  }

  function handleDeleteConditionItem(data: Recordable) {
    const index = record.condition.findIndex((item) => item?.key.key == data.key.key);
    if (index > -1) {
      record.condition.splice(index, 1);
    }
  }

  function handleConditionItemSuccess(data: Recordable) {
    const index = record.condition.findIndex((item) => item?.key.key == data.key.key);
    if (index > -1) {
      record.condition[index] = data as ConditionItem;
    } else {
      record.condition.push(data as ConditionItem);
    }
  }

  function handleSepcTypeChange(sepcType: string) {
    if (sepcType == 'SIMPLE') {
      record.spec = { type: 'SIMPLE' };
    } else if (sepcType == 'DURATION') {
      record.spec = { type: 'DURATION', unit: 'SECONDS', predicate: { defaultValue: 100 } };
    } else if (sepcType == 'REPEATING') {
      record.spec = { type: 'REPEATING', predicate: { defaultValue: 10 } };
    } else {
      record.spec = { type: 'SIMPLE' };
    }
  }

  function getUnitLabel(unit: string) {
    if (unit == 'SECONDS') {
      return t('tb.deviceProfile.alarmCondition.seconds');
    } else if (unit == 'MINUTES') {
      return t('tb.deviceProfile.alarmCondition.minutes');
    } else if (unit == 'HOURS') {
      return t('tb.deviceProfile.alarmCondition.hours');
    } else if (unit == 'DAYS') {
      return t('tb.deviceProfile.alarmCondition.days');
    } else {
      return unit;
    }
  }

  function handleSubmit() {
    emit('update:value', { condition: flatCondition.value, spec: record.spec });
    handleModalClose();
  }
</script>
<style lang="less">
  .device-profile-alarm-condition {
    cursor: pointer;
    padding: 4px;
  }

  .condition-modal {
    .modal-area {
      margin-bottom: 8px;
      border-color: @border-color-base;
    }
  }

  .preview {
    .he {
      font-weight: 600;
      color: @primary-color;
      margin: 0 10px;
    }

    .key-key {
      border: 1px solid darken(@border-color-base, 20%);
      border-radius: 4px;
      padding: 1px 6px;
      color: @primary-color;
      font-weight: 500;
    }

    .predicate-value {
      color: #f50;
      border: 1px solid darken(@border-color-base, 20%);
      border-radius: 4px;
      padding: 1px 6px;
      font-weight: 500;
    }
  }
</style>
