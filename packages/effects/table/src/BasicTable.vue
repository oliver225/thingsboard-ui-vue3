<script lang="ts" setup name="BasicTable">
import type { TableActionProps } from '@vben-core/shadcn-ui';

import type { TableRecordable } from './types/record';
import type { ComponentRef, Recordable } from './types/shared';
import type {
  BasicTableProps,
  ColumnChangeParam,
  InnerHandlers,
  SizeType,
  TableActionType,
} from './types/table';

import {
  computed,
  ref,
  shallowRef,
  toRaw,
  unref,
  useAttrs,
  useSlots,
  watch,
} from 'vue';

import { isFunction, isString } from '@vben/utils';

import { VbenTableAction } from '@vben-core/shadcn-ui';

import { useDebounceFn } from '@vueuse/core';
import { Table } from 'antdv-next';
import { omit } from 'es-toolkit/compat';

import expandIcon from './components/ExpandIcon';
import HeaderCell from './components/HeaderCell.vue';
import ResizableTitle from './components/ResizableTitle.vue';
import TableHeader from './components/TableHeader.vue';
import TableSelectionBar from './components/TableSelectionBar.vue';
import { getTableConfig, mergeTableConfig } from './config';
import { DictLabel } from './dictionary';
import { isArray } from './helpers';
import { useColumns } from './hooks/useColumns';
import { useCustomRow } from './hooks/useCustomRow';
import { useDataSource } from './hooks/useDataSource';
import { useLoading } from './hooks/useLoading';
import { usePagination } from './hooks/usePagination';
import { useRowSelection } from './hooks/useRowSelection';
import { useTableScrollTo } from './hooks/useScrollTo';
import { createTableContext } from './hooks/useTableContext';
import { useTableExpand } from './hooks/useTableExpand';
import { useTableFooter } from './hooks/useTableFooter';
import { useTableFormState } from './hooks/useTableFormState';
import { usePermission } from './hooks/useTablePermission';
import { useTableScroll } from './hooks/useTableScroll';
import { useTableStyle } from './hooks/useTableStyle';
import { basicProps, getDefaultTableProps } from './props';

// defineOptions({ inheritAttrs: false });

const props = defineProps(basicProps);
const emit = defineEmits([
  'fetch-success',
  'fetch-error',
  'selection-change',
  'register',
  'row-click',
  'row-db-click',
  'row-contextmenu',
  'row-mouseenter',
  'row-mouseleave',
  'row-dragstart',
  'row-dragover',
  'row-drop',
  'edit-end',
  'edit-cancel',
  'edit-row-end',
  'edit-change',
  'expanded-rows-change',
  'change',
  'expand',
  'columnsChange',
]);
const attrs = useAttrs();
const slots = useSlots();
const { hasPermission } = usePermission();

const tableRef = shallowRef<ComponentRef>(null);
const tableData = ref<TableRecordable[]>([]);

const wrapRef = shallowRef<HTMLElement | null>(null);

const innerPropsRef = ref<Partial<BasicTableProps>>();

const formActions = useTableFormState();

const getProps = computed(() => {
  return {
    ...mergeTableConfig(
      getDefaultTableProps(),
      getTableConfig(),
      props,
      unref(innerPropsRef),
    ),
    useSearchForm: false,
  } as BasicTableProps;
});

watch(
  () => getProps.value.formConfig,
  (config) => {
    if (config) formActions.setProps(config);
  },
  { immediate: true, deep: true },
);

const { getLoading, setLoading } = useLoading(getProps);
const {
  getPaginationInfo,
  getPagination,
  setPagination,
  setShowPagination,
  getShowPagination,
} = usePagination(getProps);

const {
  getRowSelection,
  getRowSelectionRef,
  getSelectRows,
  clearSelectedRowKeys,
  getSelectRowKeys,
  deleteSelectRowByKey,
  setSelectedRowKeys,
} = useRowSelection(getProps, tableData, emit);

const getDefaultRowSelection = () => {
  const { rowSelection, defaultRowSelection } = unref(getProps);
  return rowSelection || defaultRowSelection || null;
};

const { getExpandOption, expandAll, collapseAll, expandRows, expandCollapse } =
  useTableExpand(
    getProps,
    tableData,
    formActions.getFieldsValue,
    emit,
    setLoading,
  );

const {
  getViewColumns,
  getColumns,
  // setCacheColumnsByField,
  setColumns,
  updateColumn,
  getCacheColumns,
  dictTypesRef,
} = useColumns(getProps, getPaginationInfo);

const {
  handleTableChange: onTableChange,
  getDataSourceRef,
  getDataSource,
  getDelDataSource,
  getRawDataSource,
  setTableData,
  updateTableDataRecord,
  deleteTableDataRecord,
  insertTableDataRecord,
  findTableDataRecord,
  getRowKey,
  getAutoCreateKey,
  updateTableData,
  reload,
} = useDataSource(
  getProps,
  dictTypesRef,
  {
    tableData,
    getPaginationInfo,
    setLoading,
    setPagination,
    getFieldsValue: formActions.getFieldsValue,
    clearSelectedRowKeys,
    collapseAll,
    expandCollapse,
  },
  emit,
);

function handleTableChange(
  pagination: any,
  filters: any,
  sorter: any,
  extra: any,
) {
  onTableChange(pagination, filters, sorter);
  emit('change', pagination, filters, sorter, extra);
  // 解决通过useTable注册onChange时不起作用的问题
  const { onChange } = unref(getProps);
  onChange &&
    isFunction(onChange) &&
    onChange(pagination, filters, sorter, extra);
}

function handleTableExpand(expanded: any, record: any) {
  emit('expand', expanded, record);
  // 解决通过useTable注册onExpand时不起作用的问题
  const { onExpand } = unref(getProps);
  onExpand && isFunction(onExpand) && onExpand(expanded, record);
}

const { getScrollRef, redoHeight } = useTableScroll(
  getProps,
  tableRef,
  getViewColumns,
  getRowSelectionRef,
  getDataSourceRef,
  wrapRef,
);

const { scrollTo } = useTableScrollTo(tableRef, getDataSourceRef);

const { customRow } = useCustomRow(getProps, {
  setSelectedRowKeys,
  getSelectRowKeys,
  clearSelectedRowKeys,
  getAutoCreateKey,
  getDataSourceRef,
  tableRef,
  emit,
});

const { getRowClassName } = useTableStyle(getProps, 'tb-basic-table');

const handlers: InnerHandlers = {
  onColumnsChange: (data: ColumnChangeParam[]) => {
    emit('columnsChange', data);
    // support useTable
    unref(getProps).onColumnsChange?.(data);
  },
};

const getHeaderProps = computed(() => {
  const {
    title,
    titleIcon,
    showTableSetting,
    titleHelpMessage,
    titleIllustration,
    titleIllustrationAlt,
    tableSetting,
    showSelectionBar,
  } = unref(getProps);
  const hideTitle =
    !title &&
    !slots.tableTitle &&
    !slots.toolbar &&
    !getProps.value.selectionActions?.length &&
    !slots.headerTop &&
    !slots.query &&
    !slots.titleIllustration &&
    !titleIllustration &&
    !showTableSetting;
  if (hideTitle && !isString(title)) {
    return { class: 'hidden' };
  }
  return {
    title,
    titleIcon,
    titleHelpMessage,
    titleIllustration,
    titleIllustrationAlt,
    showTableSetting,
    tableSetting,
    onColumnsChange: handlers.onColumnsChange,
    class: 'tb-basic-table-header-container',
    showSelectionBar,
    clearSelectedRowKeys,
    count: getSelectRowKeys().length,
  } as Recordable;
});

const { getFooterProps } = useTableFooter(
  getProps,
  getScrollRef,
  tableRef,
  getDataSourceRef,
);

const getBindValues = computed(() => {
  let propsData: Recordable = {
    size: 'small',
    showSorterTooltip: false,
    tableLayout: 'fixed',
    bordered: true,
    ...unref(attrs),
    ...unref(getProps),
    onRow: customRow,
    scroll: unref(getScrollRef),
    loading: unref(getLoading),
    rowClassName: unref(getRowClassName),
    rowSelection: unref(getRowSelectionRef),
    rowKey: unref(getRowKey),
    columns: toRaw(unref(getViewColumns)),
    pagination: toRaw(unref(getPaginationInfo)),
    dataSource: unref(getDataSourceRef),
    footer: unref(getFooterProps),
    ...unref(getExpandOption),
    onExpand: handleTableExpand,
    components: {
      header: { cell: ResizableTitle },
    },
  };
  if (propsData.isTreeTable || slots.expandIcon) {
    propsData.expandIcon = expandIcon(
      expandCollapse,
      handleTableExpand,
      !!slots.expandedRowRender,
    );
  }
  return omit(propsData, [
    'class',
    'onChange',
    'title',
    'titleIcon',
    'align',
    'autoRowKey',
    'columnFlags',
    'fontSize',
    'actionColumn',
    'batch',
    'batchMessages',
    'selectionActions',
    'selectionLocked',
  ]);
});

function resolveActionProps(
  record: TableRecordable,
  index: number,
): TableActionProps {
  const { actionColumn } = unref(getProps);
  const actionProps = actionColumn?.actionProps;
  const resolved =
    typeof actionProps === 'function'
      ? actionProps(record, index)
      : actionProps;
  const alignMap = {
    center: 'center',
    left: 'start',
    right: 'end',
  } as const;
  return {
    ...resolved,
    align: resolved?.align ?? alignMap[actionColumn?.align ?? 'center'],
    hasPermission: resolved?.hasPermission ?? hasPermission,
  };
}

const getWrapperClass = computed(() => {
  const values = unref(getProps);
  return [
    'tb-basic-table',
    unref(attrs).class,
    {
      'tb-basic-table-header-hidden': getHeaderProps.value.class === 'hidden',
      'tb-basic-table-form-container': values.useSearchForm,
      'tb-basic-table--inset': values.inset,
    },
  ];
});

const getWrapperStyle = computed(() => ({
  '--table-font-size':
    getProps.value.fontSize === undefined
      ? 'calc(var(--font-size-base, 16px) - 2px)'
      : `${getProps.value.fontSize}px`,
}));

const getEmptyDataIsShowTable = computed(() => {
  const { emptyDataIsShowTable, useSearchForm } = unref(getProps);
  if (emptyDataIsShowTable || !useSearchForm) {
    return true;
  }
  return unref(getDataSourceRef).length > 0;
});

function setProps(props: Partial<BasicTableProps>) {
  const nextProps = { ...props };
  if (
    Object.hasOwn(nextProps, 'actionColumn') &&
    nextProps.actionColumn === undefined
  ) {
    nextProps.actionColumn = null;
  }
  innerPropsRef.value = mergeTableConfig(unref(innerPropsRef), nextProps);
}

function getColumnValue(data: any) {
  const dataIndex = data.column.dataIndex;
  if (isArray(dataIndex)) {
    let value = data.record;
    for (const key of dataIndex) value = value[key];
    return value;
  }
  return data.record[dataIndex];
}

function getSlotData(rawData: Recordable) {
  let data = rawData || {};
  if (!data.record) data.record = {};
  if (!data.record.dataMap) data.record.dataMap = {};
  return data;
}

function getCustomRenderFn(data: any) {
  const { column, text, record, index } = data;
  if (!column?.customRender) return;
  return () =>
    column.customRender({
      value: text,
      text,
      record,
      index,
      renderIndex: index,
      column,
    });
}

const redoTableHeight = useDebounceFn(redoHeight, 20);

watch(
  () => unref(getProps).useSearchForm,
  () => {
    redoTableHeight();
  },
  { immediate: true },
);

function getSize() {
  return unref(getProps).size as SizeType;
}

function getTableRef() {
  return tableRef;
}

const tableAction: Partial<TableActionType> = {
  reload,
  setProps,
  setLoading,
  getTableRef,
  redoHeight,
  scrollTo,
  getSize,
  emit,

  getColumns,
  getCacheColumns,
  setColumns,
  updateColumn,
  // setCacheColumnsByField,

  getPagination,
  setPagination,
  getShowPagination,
  setShowPagination,

  getDataSource,
  getDelDataSource,
  getRawDataSource,

  setTableData,
  updateTableData,
  updateTableDataRecord,
  deleteTableDataRecord,
  insertTableDataRecord,
  findTableDataRecord,

  getRowSelection,
  getDefaultRowSelection,
  getSelectRows,
  getSelectRowKeys,
  setSelectedRowKeys,
  deleteSelectRowByKey,
  clearSelectedRowKeys,

  expandAll,
  expandRows,
  collapseAll,
  expandCollapse,
};

createTableContext({
  ...(tableAction as TableActionType),
  wrapRef,
  getProps,
  getBindValues,
});
emit('register', tableAction, formActions);

defineExpose(tableAction);
</script>
<template>
  <div ref="wrapRef" :class="getWrapperClass" :style="getWrapperStyle">
    <TableHeader v-bind="getHeaderProps" :show-selection-bar="false">
      <template #tableTitle v-if="$slots.tableTitle">
        <slot name="tableTitle"></slot>
      </template>
      <template #query v-if="$slots.query">
        <slot name="query"></slot>
      </template>
      <template #titleIllustration="data" v-if="$slots.titleIllustration">
        <slot name="titleIllustration" v-bind="data"></slot>
      </template>
      <template
        #toolbar
        v-if="$slots.toolbar || getProps.selectionActions?.length"
      >
        <TableSelectionBar
          v-if="getProps.selectionActions?.length && getHeaderProps.count"
          inline
          :count="getHeaderProps.count"
          :clear-selected-row-keys="clearSelectedRowKeys"
          :actions="getProps.selectionActions"
          :selection="{
            keys: getSelectRowKeys(),
            rows: getSelectRows(),
            count: getHeaderProps.count,
          }"
          :locked="getProps.selectionLocked"
          :selected-text="getProps.batchMessages?.selected"
        />
        <slot v-if="$slots.toolbar" name="toolbar"></slot>
      </template>
      <template #headerTop v-if="$slots.headerTop">
        <slot name="headerTop"></slot>
      </template>
    </TableHeader>
    <slot v-if="$slots.tableTop" name="tableTop"></slot>
    <div v-if="getProps.showSelectionBar" class="m-3 mt-0">
      <TableSelectionBar
        :clear-selected-row-keys="getHeaderProps.clearSelectedRowKeys!"
        :count="getHeaderProps.count"
      />
    </div>
    <Table
      ref="tableRef"
      v-bind="getBindValues"
      v-show="getEmptyDataIsShowTable"
      @change="handleTableChange"
    >
      <template #[item]="data" v-for="item in Object.keys($slots)" :key="item">
        <slot :name="item" v-bind="data || {}"></slot>
      </template>
      <template #headerCell="{ column }">
        <HeaderCell :column="column as any" />
      </template>
      <template #bodyCell="data: any">
        <template v-if="!data.column.customRender">
          <div
            v-if="data.column.slot === 'tableActions'"
            @click.stop
            @dblclick.stop
          >
            <slot
              name="tableActions"
              :record="data.record"
              :index="data.index"
              :action-props="resolveActionProps(data.record, data.index)"
            >
              <VbenTableAction
                v-bind="resolveActionProps(data.record, data.index)"
              />
            </slot>
          </div>
          <DictLabel
            v-else-if="data.column.slot === 'dictLabelColumn'"
            :dict-type="data.column.dictType"
            :dict-value="getColumnValue(data)"
            :default-value="data.column.defaultValue"
          />
          <slot
            v-else-if="data.column.slot"
            :name="data.column.slot"
            v-bind="getSlotData(data)"
          ></slot>
        </template>
        <template v-else>
          <slot name="bodyCell" v-bind="getSlotData(data)">
            <component :is="getCustomRenderFn(data)" />
          </slot>
        </template>
      </template>
    </Table>
  </div>
</template>
<style lang="less">
.tb-basic-table {
  min-width: 0;
  max-width: 100%;
  background-color: hsl(var(--card));
  border-radius: var(--radius);

  a,
  .ant-btn-link {
    color: hsl(var(--primary));
  }

  .ant-table-wrapper {
    padding: 0 14px 6px;
    background-color: hsl(var(--card));
    border-radius: var(--radius);

    .ant-table {
      &.ant-table-bordered .ant-table-container {
        border-bottom-left-radius: var(--radius) !important;
        border-bottom-right-radius: var(--radius) !important;
        border: 1px solid hsl(var(--border)) !important;
      }

      .ant-table-thead > tr > th {
        font-weight: 700;
      }

      .ant-table-title {
        min-height: 40px;
        padding: 6px 0 8px !important;
        border: none !important;
      }

      //&.ant-table-bordered > .ant-table-container {
      //  & > .ant-table-header > table,
      //  & > .ant-table-content > table {
      //    border-top: 0 !important;
      //
      //    & > thead > tr > th:last-child {
      //      border-right: 0 !important;
      //    }
      //  }
      //}

      .ant-table-column-sorter {
        margin: 0 -4px 0 -1px;
      }

      .ant-table-filter-column {
        .ant-table-column-sorter {
          margin: 0 -2px 0 -1px;
        }

        .ant-table-filter-trigger {
          margin-right: -8px;
          margin-left: 0;
        }
      }

      .ant-table-cell-ellipsis {
        &.ant-table-cell-fix-left-last,
        &.ant-table-cell-fix-right-first {
          overflow: hidden;
        }
      }

      td.ant-table-cell-fix-left,
      td.ant-table-cell-fix-right {
        .tb-basic-arrow {
          vertical-align: middle;
        }

        .ant-table-cell-content {
          margin-left: 3px;
          display: inline-block;
          vertical-align: middle;
        }
      }
    }

    .tb-basic-table-row__striped {
      td,
      td.ant-table-cell-fix-left,
      td.ant-table-cell-fix-right {
        background-color: color-mix(
          in srgb,
          hsl(var(--muted)) 40%,
          hsl(var(--card))
        );

        .ant-table-cell-content {
          width: auto;
        }
      }
    }

    .ant-table-tbody > tr {
      &:hover > td.ant-table-cell-row-hover {
        // 固定列需要不透明背景，避免横向滚动时透出下方单元格。
        background-color: color-mix(
          in srgb,
          hsl(var(--primary)) 8%,
          hsl(var(--card))
        );
      }

      &.ant-table-row-selected,
      &.ant-table-row-selected:hover {
        td,
        td.ant-table-cell-fix-left,
        td.ant-table-cell-fix-right {
          background-color: color-mix(
            in srgb,
            hsl(var(--primary)) 12%,
            hsl(var(--card))
          );
        }
      }
    }

    .ant-pagination.ant-table-pagination {
      transition: all 0.3s;
      margin: 10px 0 0;
      display: flex;

      &.ant-pagination-mini {
        .ant-pagination-prev,
        .ant-pagination-next {
          line-height: 23px;
        }
        //.ant-pagination-item {
        //  line-height: 20px;
        //}

        .ant-pagination-options-quick-jumper {
          input {
            width: 42px;
          }
        }

        .ant-select {
          margin-left: 5px;

          .ant-select-arrow {
            right: 8px;
          }

          .ant-select-selection-item {
            padding-right: 18px;
          }
        }
      }
    }

    .ant-table-placeholder {
      .ant-empty-normal {
        margin: 10px;
      }
    }

    //.ant-table-row-expand-icon {
    //  margin-left: 7px;
    //}

    tr.dragover {
      &-top td {
        border-top: 2px solid rgb(22 119 255 / 30%) !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      }

      &-bottom td {
        border-bottom: 2px solid rgb(22 119 255 / 30%) !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }
    }
  }

  &-header-container {
    color: color-mix(in srgb, hsl(var(--foreground)) 75%, transparent);
    padding: 5px 2px 5px 7px;
    border-radius: var(--radius);
    min-height: 44px;
  }

  &-form-container {
    // padding: 15px 15px 0 15px;

    .ant-form {
      padding: 12px 10px 6px;
      background-color: hsl(var(--card));
      // border-radius: var(--radius);
      border-top: 1px solid hsl(var(--border)) !important;
      margin-bottom: 0;
    }
  }

  &-header-hidden {
    .ant-form {
      padding-top: 0;
      border-top: 0 !important;
    }
  }

  .ant-tag {
    margin-right: 0;
  }

  // .ant-table {
  //   width: 100%;
  //   overflow-x: hidden;

  //   &-title {
  //     display: flex;
  //     padding: 8px 6px;
  //     border-bottom: none;
  //     justify-content: space-between;
  //     align-items: center;
  //   }

  //   &-tbody > tr > td.ant-table-column-sort {
  //     background-color: hsl(var(--muted) / 0.4);
  //   }

  //   //.ant-table-tbody > tr.ant-table-row-selected td {
  //   //background-color: color-mix(in srgb, hsl(var(--primary)) 8%, transparent) !important;
  //   //}
  // }

  // 选择列为 0 的时候，不显示选择列
  .ant-table-selection-column {
    overflow: hidden;
  }

  .ant-table-footer {
    padding: 0;

    .ant-table-wrapper {
      padding: 0;
    }

    table {
      border: none !important;
    }

    .ant-table-body {
      overflow-x: hidden !important;
      //  overflow-y: scroll !important;
    }

    td {
      padding: 12px 8px;
    }
  }

  &--inset {
    .ant-table-wrapper {
      padding: 0;
    }

    .ant-table-placeholder {
      padding: 10px;

      .ant-empty-normal {
        margin: 0;

        .ant-empty-image {
          display: flex;
        }

        .ant-empty-description {
          padding: 0;
          margin: 0;
        }
      }
    }

    .ant-table-wrapper .ant-table {
      &.ant-table-bordered {
        &.ant-table-small {
          > .ant-table-container {
            > .ant-table-content,
            > .ant-table-body {
              > table > tbody > tr > td {
                > .ant-table-expanded-row-fixed {
                  margin: -15px -9px;
                }
              }
            }
          }
        }
      }
    }

    textarea.ant-input {
      min-height: 32px;
      height: 32px;

      &-sm {
        min-height: 24px;
        height: 24px;
      }
    }
  }
}

html.dark {
  .tb-basic-table {
    //a,
    //.ant-btn-link {
    //  color: #42a4e0;
    //}

    .ant-table {
      &-tbody > tr > td.ant-table-column-sort {
        background-color: #1e1e1e;
      }

      .ant-table-tbody > tr {
        &:hover > td.ant-table-cell-row-hover {
          background-color: #262626;
        }

        &.ant-table-row-selected,
        &.ant-table-row-selected:hover {
          td,
          td.ant-table-cell-fix-left,
          td.ant-table-cell-fix-right {
            background-color: #2c2c2c;
          }
        }
      }
    }

    &-header-container {
      color: rgb(255 255 255 / 75%);
    }

    &-header-hidden {
      .ant-form {
        border-top: 0 !important;
      }
    }
  }
}
</style>
