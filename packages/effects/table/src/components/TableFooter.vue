<script lang="ts" setup name="BasicTableFooter">
import type { PropType } from 'vue';

import type { Fn, Recordable } from '../types/shared';
import type { BasicColumn } from '../types/table';

import { computed, toRaw, unref } from 'vue';

import { cloneDeep, isFunction } from '@vben/utils';

import { Table } from 'antdv-next';

import { getTableColumnFlags } from '../const';
import { useTableContext } from '../hooks/useTableContext';

const props = defineProps({
  summaryFunc: {
    default: undefined,
    type: Function as PropType<Fn>,
  },
  summaryData: {
    default: undefined,
    type: Array as PropType<Recordable[]>,
  },
  scroll: {
    default: undefined,
    type: Object as PropType<Recordable>,
  },
  rowKey: { type: String, default: 'key' },
});
const SUMMARY_ROW_KEY = '_row';
const SUMMARY_INDEX_KEY = '_index';

const table = useTableContext();

const getDataSource = computed((): Recordable[] => {
  const { summaryFunc, summaryData } = props;
  if (summaryData?.length) {
    summaryData.forEach((item, i) => (item[props.rowKey] = `${i}`));
    return summaryData;
  }
  if (!isFunction(summaryFunc)) {
    return [];
  }
  let dataSource = toRaw(unref(table.getDataSource()));
  dataSource = summaryFunc(dataSource);
  dataSource.forEach((item, i) => {
    item[props.rowKey] = `${i}`;
  });
  return dataSource;
});

const getColumns = computed(() => {
  const dataSource = unref(getDataSource);
  const columns: BasicColumn[] = cloneDeep(table.getColumns());
  const indexColumn = columns.find(
    (item) => item.flag === getTableColumnFlags(table.getProps.value).index,
  );
  const hasRowSummary = dataSource.some((item) =>
    Reflect.has(item, SUMMARY_ROW_KEY),
  );
  const hasIndexSummary = dataSource.some((item) =>
    Reflect.has(item, SUMMARY_INDEX_KEY),
  );

  if (indexColumn) {
    if (hasIndexSummary) {
      indexColumn.customRender = ({ record }) => record[SUMMARY_INDEX_KEY];
      indexColumn.ellipsis = false;
    } else {
      Reflect.deleteProperty(indexColumn, 'customRender');
    }
  }

  if (table.getRowSelection() && hasRowSummary) {
    const isFixed = columns.some((col) => col.fixed === 'left');
    columns.unshift({
      width: 60,
      title: 'selection',
      key: 'selectionKey',
      align: 'center',
      ...(isFixed ? { fixed: 'left' } : {}),
      customRender: ({ record }) => record[SUMMARY_ROW_KEY],
    });
  }
  return columns as any;
});
</script>
<template>
  <Table
    v-if="summaryFunc || summaryData"
    :show-header="false"
    :bordered="false"
    :pagination="false"
    :data-source="getDataSource"
    :row-key="(r) => r[rowKey]"
    :columns="getColumns"
    table-layout="fixed"
    :scroll="scroll"
  />
</template>
