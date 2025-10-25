<template>
  <BasicModal
    :title="t('tb.deviceProfile.alarmCondition.addFilter')"
    v-bind="$attrs"
    @ok="handleSubmit"
    @register="registerModal"
    width="70%"
  >
    <template #title>
      <span> {{ getTitle.value }} </span>
    </template>
    <Row :gutter="16">
      <Col span="8">
        <p class="ml-2">{{ t('tb.deviceProfile.alarmCondition.keyType') }}</p>
        <Select
          class="w-full"
          v-model:value="record.key.type"
          :placeholder="t('tb.deviceProfile.alarmCondition.keyTypePlaceholder')"
          :options="ALARM_CONDITION_KEY_TYPE_OPTIONS"
          @change="handleKeyTypeChange"
        />
      </Col>
      <Col span="8">
        <p class="ml-2">{{ t('tb.deviceProfile.alarmCondition.keyName') }}</p>
        <AutoComplete
          class="w-full"
          v-model:value="record.key.key"
          :placeholder="t('tb.deviceProfile.alarmCondition.keyNamePlaceholder')"
          :options="keyOptions"
        />
      </Col>
      <Col span="8">
        <p class="ml-2">{{ t('tb.deviceProfile.alarmCondition.valueType') }}</p>
        <Select
          class="w-full"
          v-model:value="record.valueType"
          :placeholder="t('tb.deviceProfile.alarmCondition.valueTypePlaceholder')"
          :options="ALARM_CONDITION_VALUE_TYPE_OPTIONS"
          @change="handleValueTypeChange"
        />
      </Col>
    </Row>
    <CollapseContainer
      v-show="showPredicate"
      :title="t('tb.deviceProfile.alarmCondition.filter')"
      class="border border-solid border-neutral-300 mt-4"
    >
      <BasicTable @register="registerTable" :dataSource="record.predicate" size="small" style="padding: 0" />
      <a-button type="primary" @click="handleAddPredicate()" size="small">
        <Icon icon="i-fluent:add-12-filled" />{{ t('tb.deviceProfile.alarmCondition.addPredicate') }}
      </a-button>
    </CollapseContainer>
  </BasicModal>
</template>
<script lang="ts" setup name="ConditionItemForm">
  import { computed, ref } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { CollapseContainer } from '/@/components/Container';
  import { Select, AutoComplete, Row, Col } from 'ant-design-vue';
  import { ConditionItem, getAttributesKeys, getTimeseriesKeys } from '/@/api/tb/deviceProfile';
  import {
    ALARM_CONDITION_KEY_TYPE_OPTIONS,
    PREDICATE_OPERATION_OPTIONS,
    PredicateOperation,
    ALARM_CONDITION_VALUE_TYPE_OPTIONS,
  } from '/@/enums/alarmEnum';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { isArray, isEmpty } from 'lodash-es';
  import dayjs from 'dayjs';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const getTitle = computed(() => ({
    value: record.value.key?.key
      ? t('tb.deviceProfile.alarmCondition.editFilter')
      : t('tb.deviceProfile.alarmCondition.newFilter'),
  }));

  const record = ref<any>({
    key: { type: 'ATTRIBUTE', key: '' },
    valueType: 'STRING',
    value: undefined,
    predicate: [],
  });

  const keyOptions = ref<Array<any>>([]);

  const tableColumns: BasicColumn[] = [
    {
      title: '',
      dataIndex: 'type',
      align: 'center',
      format: () => t('tb.deviceProfile.alarmCondition.and'),
      width: 100,
    },
    {
      title: t('tb.deviceProfile.alarmCondition.operation'),
      dataIndex: 'operation',
      align: 'center',
      editRow: true,
      editComponent: 'Select',
      editComponentProps: ({ record }) => {
        return {
          options: getOperationOptions(record),
        };
      },
      editRule: true,
      width: 180,
    },
    {
      title: t('tb.deviceProfile.alarmCondition.ignoreCase'),
      dataIndex: 'ignoreCase',
      align: 'center',
      editRow: true,
      editComponent: 'Checkbox',
      width: 100,
      ifShow: () => record.value.valueType == 'STRING',
    },
    {
      title: t('tb.deviceProfile.alarmCondition.value'),
      dataIndex: 'value.defaultValue',
      editRow: true,
      editComponent: 'Input',
      align: 'left',
      editRule: true,
      ifShow: () => record.value.valueType == 'STRING',
    },
    {
      title: t('tb.deviceProfile.alarmCondition.value'),
      dataIndex: 'value.defaultValue',
      editRow: true,
      editComponent: 'InputNumber',
      editComponentProps: {
        style: { width: '100%' },
      },
      align: 'left',
      editRule: true,
      ifShow: () => record.value.valueType == 'NUMERIC',
    },
    {
      title: t('tb.deviceProfile.alarmCondition.selectBoolean'),
      dataIndex: 'value.defaultValue',
      editRow: true,
      editComponent: 'Switch',
      editComponentProps: {
        label: t('tb.deviceProfile.alarmCondition.boolean'),
      },
      align: 'left',
      editRule: true,
      ifShow: () => record.value.valueType == 'BOOLEAN',
    },
    {
      title: t('tb.deviceProfile.alarmCondition.time'),
      dataIndex: 'value.defaultValue',
      editRow: true,
      editComponent: 'DatePicker',
      editComponentProps: {
        showTime: true,
      },
      align: 'left',
      editRule: true,
      ifShow: () => record.value.valueType == 'DATE_TIME',
    },
  ];
  const actionColumn: BasicColumn = {
    width: 80,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:close-outlined',
        title: t('tb.deviceProfile.alarmCondition.deleteFilter'),
        color: 'error',
        onClick: handleDeletePredicate.bind(this, { ...record }),
      },
    ],
  };

  const [registerTable, { deleteTableDataRecord, getDataSource }] = useTable({
    maxHeight: 160,
    bordered: false,
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: false,
    showIndexColumn: false,
    pagination: false,
    useSearchForm: false,
    canResize: true,
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });

    record.value = {
      key: { type: 'ATTRIBUTE', key: '' },
      valueType: 'STRING',
      value: undefined,
      predicate: [],
      ...data,
    } as ConditionItem;
    if (isArray(record.value.predicate)) {
      record.value.predicate = record.value.predicate.map((item) => ({
        ...item,
        id: 'rid_' + new Date().getTime(),
        editable: true,
        value: {
          defaultValue:
            record.value.valueType == 'DATE_TIME' ? dayjs(item.value.defaultValue) : item.value.defaultValue,
        },
      }));
    }

    await fetchKeyList();

    setModalProps({ loading: false });
  });

  const showPredicate = computed(
    () => !isEmpty(record.value.key.type) && !isEmpty(record.value.key.key) && !isEmpty(record.value.valueType),
  );

  async function fetchKeyList() {
    if (record.value.key.type === 'ATTRIBUTE') {
      const result = await getAttributesKeys();
      keyOptions.value = result.map((item) => ({ value: item }));
    }
    if (record.value.key.type === 'TIME_SERIES') {
      const result = await getTimeseriesKeys();
      keyOptions.value = result.map((item) => ({ value: item }));
    }
  }

  async function handleKeyTypeChange() {
    record.value.predicate.length = 0;
    record.value.key.key = '';
    await fetchKeyList();
  }

  function handleValueTypeChange() {
    record.value.predicate.length = 0;
  }

  function handleAddPredicate() {
    record.value.predicate.push({
      id: 'rid_' + new Date().getTime(),
      editable: true,
      type: record.value.valueType == 'DATE_TIME' ? 'NUMERIC' : record.value.valueType,
      operation: 'EQUAL',
      ignoreCase: false,
      value: { defaultValue: undefined },
    });
  }

  function handleDeletePredicate(record: Recordable) {
    deleteTableDataRecord(record);
  }

  function getOperationOptions(data: Recordable) {
    if (data.type == 'STRING') {
      return PREDICATE_OPERATION_OPTIONS.filter(
        (item) =>
          item.value == PredicateOperation.EQUAL ||
          item.value == PredicateOperation.NOT_EQUAL ||
          item.value == PredicateOperation.STARTS_WITH ||
          item.value == PredicateOperation.ENDS_WITH ||
          item.value == PredicateOperation.CONTAINS ||
          item.value == PredicateOperation.NOT_CONTAINS ||
          item.value == PredicateOperation.IN ||
          item.value == PredicateOperation.NOT_IN,
      );
    } else if (data.type == 'NUMERIC') {
      return PREDICATE_OPERATION_OPTIONS.filter(
        (item) =>
          item.value == PredicateOperation.EQUAL ||
          item.value == PredicateOperation.NOT_EQUAL ||
          item.value == PredicateOperation.LESS ||
          item.value == PredicateOperation.GREATER ||
          item.value == PredicateOperation.GREATER_OR_EQUAL ||
          item.value == PredicateOperation.LESS_OR_EQUAL,
      );
    } else {
      return PREDICATE_OPERATION_OPTIONS.filter(
        (item) => item.value == PredicateOperation.EQUAL || item.value == PredicateOperation.NOT_EQUAL,
      );
    }
  }

  async function handleSubmit() {
    if (isEmpty(record.value.key.key)) {
      showMessage(t('tb.deviceProfile.alarmCondition.keyNameEmpty'), 'error');
      return;
    }
    if (isEmpty(record.value.key.type)) {
      showMessage(t('tb.deviceProfile.alarmCondition.keyTypeEmpty'), 'error');
      return;
    }
    if (isEmpty(record.value.valueType)) {
      showMessage(t('tb.deviceProfile.alarmCondition.valueTypeEmpty'), 'error');
      return;
    }
    if (record.value.predicate.length < 1) {
      showMessage(t('tb.deviceProfile.alarmCondition.predicateEmpty'), 'error');
      return;
    }
    try {
      const predicateList = await getPredicateList();
      emit('success', { ...record.value, predicate: predicateList });
      closeModal();
    } catch (error: any) {
      showMessage(t('tb.deviceProfile.alarmCondition.predicateSelectError'), 'error');
      return;
    }
  }

  async function getPredicateList() {
    let predicateListValid = true;
    let predicateList = getDataSource();
    for (const predicate of predicateList) {
      if (!(await predicate.onEdit?.(false, true))) {
        predicateListValid = false;
      }
      if (record.value.valueType == 'DATE_TIME') {
        predicate.value.defaultValue = dayjs(predicate.value.defaultValue).valueOf();
      }
    }
    if (!predicateListValid) {
      throw { errorFields: [{ name: ['predicateList'] }] };
    }
    return predicateList;
  }
</script>
