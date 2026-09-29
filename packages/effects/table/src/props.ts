import type { Component, PropType } from 'vue';

import type { FormProps } from './types/form';
import type { PaginationProps } from './types/pagination';
import type { Fn, Recordable } from './types/shared';
import type {
  BasicColumn,
  BasicTableProps,
  FetchSetting,
  SizeType,
  SorterResult,
  TableCustomRecord,
  TableRowSelection,
  TableSetting,
} from './types/table';

import {
  ACTION_COLUMN_FLAG,
  DEFAULT_ALIGN,
  DEFAULT_FILTER_FN,
  DEFAULT_SIZE,
  DEFAULT_SORT_FN,
  DRAG_COLUMN_FLAG,
  FETCH_SETTING,
  INDEX_COLUMN_FLAG,
  PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  ROW_KEY,
} from './const';

const propDefinitions = {
  batch: { type: Object as PropType<BasicTableProps['batch']> },
  batchMessages: { type: Object as PropType<BasicTableProps['batchMessages']> },
  selectionActions: {
    type: Array as PropType<BasicTableProps['selectionActions']>,
  },
  selectionLocked: { type: Boolean, default: false },
  fontSize: { type: Number, default: undefined },
  align: {
    type: String as PropType<BasicTableProps['align']>,
    default: DEFAULT_ALIGN,
  },
  autoRowKey: { type: String, default: ROW_KEY },
  columnFlags: {
    type: Object as PropType<BasicTableProps['columnFlags']>,
    default: () => ({
      index: INDEX_COLUMN_FLAG,
      drag: DRAG_COLUMN_FLAG,
      action: ACTION_COLUMN_FLAG,
    }),
  },
  isTreeTable: { type: Boolean, default: false },
  clickToRowSelect: { type: Boolean, default: true },
  childrenColumnName: { type: String, default: 'childList' },
  tableSetting: { type: Object as PropType<TableSetting> },
  inset: { type: Boolean, default: undefined },
  sortFn: {
    type: Function as PropType<(sortInfo: SorterResult) => any>,
    default: DEFAULT_SORT_FN,
  },
  filterFn: {
    type: Function as PropType<(data: Partial<Recordable<string[]>>) => any>,
    default: DEFAULT_FILTER_FN,
  },
  showTableSetting: { type: Boolean, default: undefined },
  tableSettingStore: { type: Boolean, default: true },
  tableSettingStoreKey: { type: String, default: undefined },
  autoCreateKey: { type: Boolean, default: true },
  striped: { type: Boolean, default: true },
  showSummary: { type: Boolean, default: undefined },
  summaryFunc: {
    type: [Function, Array] as PropType<(...arg: any[]) => any[]>,
    default: null,
  },
  summaryData: {
    type: Array as PropType<Recordable[]>,
    default: null,
  },
  indentSize: { type: Number, default: 24 },
  canRowDrag: { type: Boolean, default: false },
  api: {
    type: Function as PropType<(...arg: any[]) => Promise<any>>,
    default: null,
  },
  beforeFetch: {
    type: Function as PropType<Fn>,
    default: null,
  },
  afterFetch: {
    type: Function as PropType<Fn>,
    default: null,
  },
  handleSearchInfoFn: {
    type: Function as PropType<Fn>,
    default: null,
  },
  fetchSetting: {
    type: Object as PropType<Partial<FetchSetting>>,
    default: () => {
      return FETCH_SETTING;
    },
  },
  // 立即请求接口
  immediate: { type: Boolean, default: true },
  emptyDataIsShowTable: { type: Boolean, default: true },
  // 额外的请求参数
  searchInfo: {
    type: Object as PropType<Recordable>,
    default: null,
  },
  // 默认的排序参数
  defSort: {
    type: Object as PropType<Recordable>,
    default: null,
  },
  // 使用搜索表单
  useSearchForm: { type: Boolean, default: undefined },
  // 是否显示搜索表单
  showSearchForm: { type: Boolean, default: true },
  // 表单配置
  formConfig: {
    type: Object as PropType<Partial<FormProps>>,
    default: null,
  },
  columns: {
    type: [Array] as PropType<BasicColumn[]>,
    default: () => [],
  },
  showIndexColumn: { type: Boolean, default: true },
  indexColumnProps: {
    type: Object as PropType<BasicColumn>,
    default: null,
  },
  actionColumn: {
    type: Object as PropType<BasicTableProps['actionColumn']>,
    default: null,
  },
  ellipsis: { type: Boolean, default: true },
  columnResizable: { type: Boolean, default: true },
  isCanResizeParent: { type: Boolean, default: true },
  canResize: { type: Boolean, default: false },
  resizeHeightOffset: { type: Number, default: 0 },
  rowSelection: {
    type: Object as PropType<null | TableRowSelection>,
    default: null,
  },
  defaultRowSelection: {
    type: Object as PropType<null | TableRowSelection>,
    default: () => ({ type: 'checkbox' }),
  },
  clearSelectedOnReload: { type: Boolean, default: true },
  showSelectionBar: { type: Boolean, default: false },
  title: {
    type: [String, Function] as PropType<
      ((data: Recordable) => string) | string
    >,
    default: null,
  },
  titleIcon: {
    type: [String, Object, Function] as PropType<Component | string>,
    default: undefined,
  },
  titleIllustration: { type: String, default: '' },
  titleIllustrationAlt: { type: String, default: '' },
  titleHelpMessage: {
    type: [String, Array] as PropType<string | string[]>,
  },
  maxHeight: { type: Number, default: undefined },
  minHeight: { type: Number, default: 200 },
  dataSource: {
    type: Array as PropType<Recordable[]>,
    default: null,
  },
  rowKey: {
    type: [String, Function] as PropType<
      ((record: Recordable) => string) | string
    >,
    default: 'id',
  },
  bordered: { type: Boolean, default: true },
  pagination: {
    type: [Object, Boolean] as PropType<boolean | PaginationProps>,
    default: () => ({
      defaultPageSize: PAGE_SIZE,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
  },
  loading: { type: Boolean, default: undefined },
  rowClassName: {
    type: Function as PropType<
      (record: TableCustomRecord<any>, index: number) => string
    >,
  },
  scroll: {
    type: Object as PropType<{ x: number | true; y: number }>,
    default: null,
  },
  beforeEditSubmit: {
    type: Function as PropType<
      (data: {
        record: Recordable;
        index: number;
        key: number | string;
        value: any;
      }) => Promise<any>
    >,
  },
  showHeader: { type: Boolean, default: true },
  size: {
    type: String as PropType<SizeType>,
    default: DEFAULT_SIZE,
  },
};

/** Vue defaults must not overwrite configured application defaults. */
export const basicProps = Object.fromEntries(
  Object.entries(propDefinitions).map(([key, definition]) => [
    key,
    { ...definition, default: undefined },
  ]),
) as {
  [K in keyof typeof propDefinitions]: Omit<
    (typeof propDefinitions)[K],
    'default'
  > & { default: undefined };
};

export function getDefaultTableProps(): Partial<BasicTableProps> {
  return Object.fromEntries(
    Object.entries(propDefinitions).map(([key, definition]) => {
      const value = 'default' in definition ? definition.default : undefined;
      return [
        key,
        typeof value === 'function' && definition.type !== Function
          ? (value as () => unknown)()
          : value,
      ];
    }),
  ) as Partial<BasicTableProps>;
}
