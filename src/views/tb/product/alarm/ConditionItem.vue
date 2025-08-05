<template>
  <BasicModal :title="'添加键名筛选器'" v-bind="$attrs" @ok="handleSubmit" @register="registerModal" width="70%">
    <template #title>
      <span> {{ getTitle.value }} </span>
    </template>
    <Row :gutter="16">
      <Col span="8">
      <p class="ml-2">键类型</p>
      <Select class="w-full" v-model:value="record.key.type" placeholder="请选键类型"
        :options="ALARM_CONDITION_KEY_TYPE_OPTIONS" @change="handleKeyTypeChange">
      </Select>
      </Col>
      <Col span="8">
      <p class="ml-2">键名</p>
      <AutoComplete class="w-full" v-model:value="record.key.key" placeholder="请填写键名" :options="keyOptions" />
      </Col>
      <Col span="8">
      <p class="ml-2">值类型</p>
      <Select class="w-full" v-model:value="record.valueType" placeholder="请选值类型"
        :options="ALARM_CONDITION_VALUE_TYPE_OPTIONS" @change="handleValueTypeChange">
      </Select>
      </Col>
    </Row>
    <CollapseContainer v-show="showPredicate" title="筛选器" class="border border-solid border-neutral-300 mt-4">
      <BasicTable @register="registerTable" :dataSource="record.predicate" size="small" style="padding: 0;" />
      <a-button type="primary" @click="handleAddPredicate()" size="small">
        <Icon icon="i-fluent:add-12-filled" />添加
      </a-button>
    </CollapseContainer>
  </BasicModal>
</template>
<script lang="ts" setup name="ConditionItemForm">
import { computed, ref } from 'vue';
import { Icon } from '/@/components/Icon'
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
import { CollapseContainer } from '/@/components/Container'
import { Select, AutoComplete, Row, Col } from 'ant-design-vue';
import { ConditionItem, getAttributesKeys, getTimeseriesKeys } from '/@/api/tb/deviceProfile';
import { ALARM_CONDITION_KEY_TYPE_OPTIONS, PREDICATE_OPERATION_OPTIONS, PredicateOperation, ALARM_CONDITION_VALUE_TYPE_OPTIONS } from '/@/enums/alarmEnum';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { isArray, isEmpty } from 'lodash-es';
import dayjs from 'dayjs';

const emit = defineEmits(['success', 'register']);

const { t } = useI18n('tb');
const { showMessage } = useMessage();

const getTitle = computed(() => ({
  value: record.value.key?.key ? t('编辑键名筛选器') : t('新增键名筛选器'),
}));

const record = ref<any>({
  key: { type: 'ATTRIBUTE', key: '' },
  valueType: 'STRING',
  value: undefined,
  predicate: []
});

const keyOptions = ref<Array<any>>([]);


const tableColumns: BasicColumn[] = [
  {
    title: '',
    dataIndex: 'type',
    align: 'center',
    format: () => '和',
    width: 100,
  },
  {
    title: '操作',
    dataIndex: 'operation',
    align: 'center',
    editRow: true,
    editComponent: 'Select',
    editComponentProps: ({ record }) => {
      return {
        options: getOperationOptions(record)
      }
    },
    editRule: true,
    width: 180,
  },
  {
    title: '忽略大小写',
    dataIndex: 'ignoreCase',
    align: 'center',
    editRow: true,
    editComponent: 'Checkbox',
    width: 100,
    ifShow: () => record.value.valueType == 'STRING',
  },
  {
    title: '值',
    dataIndex: 'value.defaultValue',
    editRow: true,
    editComponent: 'Input',
    align: 'left',
    editRule: true,
    ifShow: () => record.value.valueType == 'STRING',
  },
  {
    title: '值',
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
    title: '选择True/False',
    dataIndex: 'value.defaultValue',
    editRow: true,
    editComponent: 'Switch',
    editComponentProps: {
      label: '真假'
    },
    align: 'left',
    editRule: true,
    ifShow: () => record.value.valueType == 'BOOLEAN',
  },
  {
    title: '时间',
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
      title: '删除筛选器',
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

  record.value = { key: { type: 'ATTRIBUTE', key: '' }, valueType: 'STRING', value: undefined, predicate: [], ...data } as ConditionItem;
  if (isArray(record.value.predicate)) {
    record.value.predicate = record.value.predicate.map((item) => ({
      ...item,
      id: 'rid_' + new Date().getTime(),
      editable: true,
      value: { defaultValue: record.value.valueType == 'DATE_TIME' ? dayjs(item.value.defaultValue) : item.value.defaultValue }
    }));
  }

  await fetchKeyList();

  setModalProps({ loading: false });
});

const showPredicate = computed(() => !isEmpty(record.value.key.type) && !isEmpty(record.value.key.key) && !isEmpty(record.value.valueType));

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
    value: { defaultValue: undefined }
  });
}

function handleDeletePredicate(record: Recordable) {
  deleteTableDataRecord(record);
}

function getOperationOptions(data: Recordable) {
  if (data.type == 'STRING') {
    return PREDICATE_OPERATION_OPTIONS.filter((item) =>
      item.value == PredicateOperation.EQUAL ||
      item.value == PredicateOperation.NOT_EQUAL ||
      item.value == PredicateOperation.STARTS_WITH ||
      item.value == PredicateOperation.ENDS_WITH ||
      item.value == PredicateOperation.CONTAINS ||
      item.value == PredicateOperation.NOT_CONTAINS ||
      item.value == PredicateOperation.IN ||
      item.value == PredicateOperation.NOT_IN
    );

  } else if (data.type == 'NUMERIC') {
    return PREDICATE_OPERATION_OPTIONS.filter((item) =>
      item.value == PredicateOperation.EQUAL ||
      item.value == PredicateOperation.NOT_EQUAL ||
      item.value == PredicateOperation.LESS ||
      item.value == PredicateOperation.GREATER ||
      item.value == PredicateOperation.GREATER_OR_EQUAL ||
      item.value == PredicateOperation.LESS_OR_EQUAL
    );
  } else {
    return PREDICATE_OPERATION_OPTIONS.filter((item) =>
      item.value == PredicateOperation.EQUAL ||
      item.value == PredicateOperation.NOT_EQUAL
    );
  }

}

async function handleSubmit() {
  if (isEmpty(record.value.key.key)) {
    showMessage(t('键名不能为空'), 'error');
    return;
  }
  if (isEmpty(record.value.key.type)) {
    showMessage(t('键类型不能为空'), 'error');
    return;
  }
  if (isEmpty(record.value.valueType)) {
    showMessage(t('值类型不能为空'), 'error');
    return;
  }
  if (record.value.predicate.length < 1) {
    showMessage(t('筛选器不能为空'), 'error');
    return;
  }
  try {
    const predicateList = await getPredicateList();
    emit('success', { ...record.value, predicate: predicateList })
    closeModal();
  } catch (error: any) {
    showMessage(t('筛选器选择错误'), 'error');
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