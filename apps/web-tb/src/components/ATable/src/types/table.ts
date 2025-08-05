import type { ColumnProps } from 'ant-design-vue/lib/table';
import type { TableRowSelection as ITableRowSelection } from 'ant-design-vue/lib/table/interface';

import type { Ref } from 'vue';

import type { EmitType, Recordable } from '@vben/types';

import type { export BasicColumn } from './column';
import type { PaginationProps } from './pagination';
import type { BasicTableProps } from './tableProps';

export declare type SortOrder = 'ascend' | 'descend';
export interface TableCurrentDataSource<T = Recordable> {
  currentDataSource: T[];
}

export interface TableRowSelection<T = any> extends ITableRowSelection {
  /**
   * Callback executed when selected rows change
   * @type Function
   */
  onChange?: (
    selectedRowKeys: any | number[] | string[],
    selectedRows: T[],
  ) => any;

  /**
   * Callback executed when select/deselect one row
   * @type Function
   */
  onSelect?: (
    record: T,
    selected: boolean,
    selectedRows: object[],
    nativeEvent: Event,
  ) => any;

  /**
   * Callback executed when select/deselect all rows
   * @type Function
   */
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => any;

  /**
   * Callback executed when row selection is inverted
   * @type Function
   */
  onSelectInvert?: (selectedRows: any | number[] | string[]) => any;
}

export interface TableCustomRecord<T> {
  record?: T;
  index?: number;
}

export interface ExpandedRowRenderRecord<T> extends TableCustomRecord<T> {
  indent?: number;
  expanded?: boolean;
}

export interface ColumnFilterItem {
  text?: string;
  value?: string;
  children?: any;
}

export interface TableCustomRecord<T = Recordable> {
  record?: T;
  index?: number;
}

export interface SorterResult {
  column: ColumnProps;
  order: SortOrder;
  field: string;
  columnKey: string;
}

export interface FetchParams {
  searchInfo?: Recordable;
  page?: number;
  sortInfo?: Recordable;
  filterInfo?: Recordable;
  parentCode?: string;
  record?: Recordable;
}

export interface GetColumnsParams {
  ignoreIndex?: boolean;
  ignoreAction?: boolean;
  sort?: boolean;
}

export type SizeType = 'default' | 'large' | 'middle' | 'small';

export interface TableActionType {
  reload: (opt?: FetchParams) => Promise<void>;
  setProps: (props: Partial<BasicTableProps>) => void;
  setLoading: (loading: boolean) => void;
  getTableRef: () => Ref<ComponentRef>;
  redoHeight: () => void;
  scrollTo: (pos: string) => void; // pos: id | "top" | "bottom"
  getSize: () => SizeType;
  emit: EmitType;

  getColumns: (opt?: GetColumnsParams) => BasicColumn[];
  getCacheColumns: () => BasicColumn[];
  // setCacheColumnsByField?: (dataIndex: string | undefined, value: BasicColumn) => void;
  setColumns: (columns: BasicColumn[] | string[]) => void;
  updateColumn: (column: BasicColumn | BasicColumn[]) => void;

  getPagination: () => boolean | PaginationProps;
  setPagination: (info: Partial<PaginationProps>) => void;
  setShowPagination: (show: boolean) => void;
  getShowPagination: () => boolean;

  getDataSource: <T = Recordable>() => T[];
  getDelDataSource: <T = Recordable>() => T[];
  getRawDataSource: <T = Recordable>() => T;

  setTableData: <T = Recordable>(values: T[]) => void;
  updateTableData: (index: number, key: string, value: any) => Recordable;
  updateTableDataRecord: (
    rowKey: number | string,
    record: Recordable,
  ) => Recordable | void;
  deleteTableDataRecord: (
    record: Recordable | Recordable[],
  ) => Recordable | void;
  insertTableDataRecord: (
    record: Recordable,
    index?: number,
  ) => Recordable | void;
  findTableDataRecord: (rowKey: number | string) => Recordable | void;

  getRowSelection: () => TableRowSelection<Recordable>;
  getDefaultRowSelection: () => TableRowSelection<Recordable>;
  getSelectRows: <T = Recordable>() => T[];
  getSelectRowKeys: () => number[] | string[];
  setSelectedRowKeys: (rowKeys: number[] | string[]) => void;
  deleteSelectRowByKey: (key: string) => void;
  clearSelectedRowKeys: () => void;

  expandAll: () => void;
  expandRows: (keys: string[]) => void;
  collapseAll: () => void;
  expandCollapse: (record: Recordable) => void;
}

export interface FetchSetting {
  // 请求接口当前页数
  pageField: string;
  // 每页显示多少条
  sizeField: string;
  // 请求结果列表字段  支持 a.b.c
  listField: string;
  // 请求结果总数字段  支持 a.b.c
  totalField: string;
}

export interface TableSetting {
  redo?: boolean;
  size?: boolean;
  setting?: boolean;
  fullScreen?: boolean;
}

export type CellFormat =
  | ((
      text: string,
      record: Recordable,
      index: number,
      column?: BasicColumn,
    ) => number | string)
  | Map<number | string, any>
  | string;

export type ColumnChangeParam = {
  dataIndex?: string;
  dataIndex_?: string;
  fixed: 'left' | 'right' | boolean | undefined;
  open: boolean;
};

export interface InnerHandlers {
  onColumnsChange: (data: ColumnChangeParam[]) => void;
}

export interface InnerMethods {
  clearSelectedRowKeys: TableActionType['clearSelectedRowKeys'];
  getSelectRowKeys: TableActionType['getSelectRowKeys'];
}
