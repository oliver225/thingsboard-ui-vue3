import type { TableRowSelection as ITableRowSelection } from 'antdv-next';
import type { ColumnProps } from 'antdv-next/dist/table/Column';

import type { Component, MaybeRefOrGetter, Ref, VNodeChild } from 'vue';

import type { TableActionProps } from '@vben-core/shadcn-ui';

import type { EditRecordRow } from '../components/editable';
import type { ComponentType } from './componentType';
import type { FormProps } from './form';
import type { PaginationProps } from './pagination';
import type { TableDataIndex } from './record';
import type { ComponentRef, EmitType, Fn, Recordable } from './shared';
import type { ActionItem } from './tableAction';

export declare type SortOrder = 'ascend' | 'descend';

export interface TableSelection<T = Recordable> {
  keys: number[] | string[];
  rows: T[];
  count: number;
}

export interface TableBatchAction<T = Recordable> {
  key: string;
  label: MaybeRefOrGetter<string>;
  icon?: string;
  danger?: boolean;
  disabled?: MaybeRefOrGetter<boolean>;
  onClick: (selection: TableSelection<T>) => Promise<void> | void;
}

export interface TableBatch<T = Recordable> {
  entityName: MaybeRefOrGetter<string>;
  enabled?: MaybeRefOrGetter<boolean>;
  canSelect?: (record: T) => boolean;
  /** 确认后调用，返回失败的主键；重试时仅传入这些主键。 */
  deleteApi?: (keys: string[]) => Promise<{ failedIds: string[] }>;
  actions?: TableBatchAction<T>[];
}

/** 可通过 setupVbenTable 统一替换应用文案。 */
export interface TableBatchMessages {
  title: () => string;
  confirmText: () => string;
  cancelText: () => string;
  selected: (count: number) => string;
  confirm: (entity: string, count: number) => string;
  success: (entity: string, count: number) => string;
  partialFailure: (entity: string, deleted: number, failed: number) => string;
}

/** Native VbenTableAction props, optionally resolved for each row. */
export type ActionProps<T = Recordable> =
  | ((record: T, index: number) => TableActionProps)
  | TableActionProps;

/** 自动追加并固定在右侧的操作列。 */
export interface ActionColumn<T = Recordable> {
  /** 表头和单元格对齐，同时作为按钮容器的默认对齐。默认 center。 */
  align?: 'center' | 'left' | 'right';
  /** 列宽，默认 240。 */
  width?: BasicColumn<T>['width'];
  /** 原生按钮参数，可根据行数据生成。 */
  actionProps: ActionProps<T>;
}

export interface TableRowSelection<T = any> extends ITableRowSelection<T> {
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
    selectedRows: T[],
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
  ) => Recordable | undefined;
  deleteTableDataRecord: (
    record: Recordable | Recordable[],
  ) => Recordable | undefined;
  insertTableDataRecord: (
    record: Recordable,
    index?: number,
  ) => Recordable | undefined;
  findTableDataRecord: (rowKey: number | string) => Recordable | undefined;

  getRowSelection: () => null | TableRowSelection;
  getDefaultRowSelection: () => null | TableRowSelection;
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

export interface BasicTableProps<T = any> {
  batch?: TableBatch<T>;
  batchMessages?: TableBatchMessages;
  /** useTable 内部生成的工具栏操作。 */
  selectionActions?: TableBatchAction<T>[];
  selectionLocked?: boolean;
  /** Icon displayed before the title or tableTitle slot. */
  titleIcon?: Component | string;
  /** Decorative image at the right of the title row; the titleIllustration slot overrides it. */
  titleIllustration?: string;
  titleIllustrationAlt?: string;
  /** Table text size in pixels. Omit to follow the global font size minus 2px. */
  fontSize?: number;
  /** Default alignment; an individual column's align takes precedence. */
  align?: 'center' | 'left' | 'right';
  /** Field used for generated row keys when no rowKey is provided. */
  autoRowKey?: string;
  /** Markers identifying the generated table columns. */
  columnFlags?: { index?: string; drag?: string; action?: string };
  // 是否树表
  isTreeTable?: boolean;
  // 点击行选中
  clickToRowSelect?: boolean;
  // 自定义排序方法
  sortFn?: (sortInfo: SorterResult) => any;
  // 自定义过滤方法
  filterFn?: (data: Partial<Recordable<string[]>>) => any;
  // 取消表格的默认padding
  inset?: boolean;
  // 显示表格设置
  showTableSetting?: boolean;
  tableSettingStore?: boolean;
  tableSettingStoreKey?: string;
  tableSetting?: TableSetting;
  // 斑马纹
  striped?: boolean;
  // 是否自动生成key
  autoCreateKey?: boolean;
  // 计算合计行的方法
  summaryFunc?: (...arg: any) => Recordable[];
  // 自定义合计表格内容
  summaryData?: Recordable[];
  // 是否显示合计行
  showSummary?: boolean;
  // 是否可拖拽行
  canRowDrag?: boolean;
  // 接口请求对象
  api?: (...arg: any) => Promise<any>;
  // 请求之前处理参数
  beforeFetch?: Fn;
  // 自定义处理接口返回参数
  afterFetch?: Fn;
  // 请求子节点之前处理参数
  beforeChildFetch?: Fn;
  // 自定义处理子节点接口返回参数
  afterChildFetch?: Fn;
  // 查询条件请求之前处理
  handleSearchInfoFn?: Fn;
  // 请求接口配置
  fetchSetting?: Partial<FetchSetting>;
  // 立即请求接口
  immediate?: boolean;
  // 在开起搜索表单的时候，如果没有数据是否显示表格
  emptyDataIsShowTable?: boolean;
  // 额外的请求参数
  searchInfo?: Recordable;
  // 默认的排序参数
  defSort?: Recordable;
  // 使用搜索表单
  useSearchForm?: boolean;
  // 是否显示搜索表单
  showSearchForm?: boolean;
  // 表单配置
  formConfig?: Partial<FormProps<T>>;
  // 列配置
  columns: BasicColumn<T>[];
  // 是否显示序号列
  showIndexColumn?: boolean;
  // 序号列配置
  indexColumnProps?: BasicColumn<T>;
  // 拖拽列列配置
  dragColumnProps?: BasicColumn<T>;
  /** 提供参数时自动追加操作列；null/undefined 不显示。 */
  actionColumn?: ActionColumn<T> | null;
  // 文本超过宽度是否显示。。。
  ellipsis?: boolean;
  // 允许拖拽调整列宽
  columnResizable?: boolean;
  // 是否继承父级高度（父级高度-表单高度-padding高度）
  isCanResizeParent?: boolean;
  // 是否可以自适应高度
  canResize?: boolean;
  // 自适应高度偏移， 计算结果-偏移量
  resizeHeightOffset?: number;
  // 主键名称
  rowKey?: ((record: Recordable, defaultValue?: any) => string) | string;
  // 数据
  dataSource?: Recordable[];
  // 标题右侧提示
  titleHelpMessage?: string | string[];
  // 表格滚动最大高度
  maxHeight?: number;
  // 表格最小高度（仅 canResize 时有效）
  minHeight?: number;
  // 是否显示边框
  bordered?: boolean;
  // 分页配置
  pagination?: boolean | PaginationProps;
  // loading加载
  loading?: boolean;

  /**
   * The column contains children to display
   * @default 'children'
   * @type string | string[]
   */
  childrenColumnName?: string;

  /**
   * Override default table elements
   * @type object
   */
  components?: object;

  /**
   * Expand all rows initially
   * @default false
   * @type boolean
   */
  defaultExpandAllRows?: boolean;

  /**
   * Initial expanded row keys
   * @type string[]
   */
  defaultExpandedRowKeys?: string[];

  /**
   * Current expanded row keys
   * @type string[]
   */
  expandedRowKeys?: string[];

  /**
   * Expanded container render for each row
   * @type Function
   */
  expandedRowRender?: (record?: ExpandedRowRenderRecord<T>) => VNodeChild;

  /**
   * Customize row expand Icon.
   * @type Function | VNodeChild
   */
  expandIcon?: Fn | VNodeChild;

  /**
   * Whether to expand row by clicking anywhere in the whole row
   * @default false
   * @type boolean
   */
  expandRowByClick?: boolean;

  /**
   * The index of `expandIcon` which column will be inserted when `expandIconAsCell` is false. default 0
   */
  expandIconColumnIndex?: number;

  /**
   * Table footer renderer
   * @type Function | VNodeChild
   */
  footer?: Fn | VNodeChild;

  /**
   * Indent size in pixels of tree data
   * @default 15
   * @type number
   */
  indentSize?: number;

  /**
   * i18n text including filter, sort, empty text, etc
   * @default { filterConfirm: 'Ok', filterReset: 'Reset', emptyText: 'No Data' }
   * @type object
   */
  locale?: object;

  /**
   * Row's className
   * @type Function
   */
  rowClassName?: (record: TableCustomRecord<T>, index: number) => string;

  /**
   * Row selection config
   * @type object
   */
  rowSelection?: null | TableRowSelection;

  // 默认不展示复选框，但是通过右上角给表格设置复选框的时候加载默认参数
  defaultRowSelection?: null | TableRowSelection;

  // 重载表格数据的时候清空已选择选项
  clearSelectedOnReload?: boolean;

  // 是否在表格上方显示多选状态栏
  showSelectionBar?: boolean;

  /**
   * Set horizontal or vertical scrolling, can also be used to specify the width and height of the scroll area.
   * It is recommended to set a number for x, if you want to set it to true,
   * you need to add style .ant-table td { white-space: nowrap; }.
   * @type object
   */
  scroll?: {
    x?: number | string | true;
    y?: number;
    scrollToFirstRowOnChange?: boolean;
  };

  /**
   * Whether to show table header
   * @default true
   * @type boolean
   */
  showHeader?: boolean;

  /**
   * Size of table
   * @default 'default'
   * @type string
   */
  size?: SizeType;

  /**
   * Table title renderer
   * @type Function | ScopedSlot
   */
  title?: ((data: Recordable) => string) | string | VNodeChild;

  /**
   * Set props on per header row
   * @type Function
   */
  customHeaderRow?: (column: ColumnProps, index: number) => object;

  /**
   * Set props on per row
   * @type Function
   */
  customRow?: (record: T, index: number) => object;

  /**
   * `table-layout` attribute of table element
   * `fixed` when header/columns are fixed, or using `column.ellipsis`
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/table-layout
   * @version 1.5.0
   */
  tableLayout?: 'auto' | 'fixed' | string;

  /**
   * the render container of dropdowns in table
   * @param triggerNode
   * @version 1.5.0
   */
  getPopupContainer?: (triggerNode?: HTMLElement) => HTMLElement;

  /**
   * Data can be changed again before rendering.
   * The default configuration of general user empty data.
   * You can configured globally through [ConfigProvider](https://antdv.com/components/config-provider-cn/)
   *
   * @version 1.5.4
   */
  transformCellText?: Fn;

  /**
   * Callback executed before editable cell submit value, not for row-editor
   *
   * The cell will not submit data while callback return false
   */
  beforeEditSubmit?: (data: {
    record: Recordable;
    index: number;
    key: number | string;
    value: any;
  }) => Promise<any>;

  /**
   * Callback executed when pagination, filters or sorter is changed
   * @param pagination
   * @param filters
   * @param sorter
   * @param currentDataSource
   */
  onChange?: (pagination: any, filters: any, sorter: any, extra: any) => void;

  /**
   * Callback executed when the row expand icon is clicked
   *
   * @param expanded
   * @param record
   */
  onExpand?: (expanded: boolean, record: T) => void;

  /**
   * Callback executed when the expanded rows change
   * @param expandedRows
   */
  onExpandedRowsChange?: (expandedRows: number[] | string[]) => void;

  // 表格列更改事件
  onColumnsChange?: (data: ColumnChangeParam[]) => void;
}

export type CellFormat<T = Recordable> =
  | ((
      text: string,
      record: T,
      index: number,
      column?: BasicColumn,
    ) => number | string)
  | Map<number | string, any>
  | string;

export interface BasicColumn<T = Recordable> extends Omit<
  ColumnProps<Recordable>,
  'children' | 'customRender'
> {
  dataIndex?: TableDataIndex<T>;
  dataIndex_?: string;
  children?: BasicColumn<T>[];
  // filters?: {
  //   text: VueNode;
  //   value: string | number | boolean;
  //   children?: unknown[] | (((props: Record<string, unknown>) => unknown[]) & (() => unknown[]));
  // }[];

  // 标记为内置列
  flag?:
    | 'ACTION'
    | 'CHECKBOX'
    | 'DEFAULT'
    | 'DRAG'
    | 'INDEX'
    | 'RADIO'
    | (string & {});

  // Antdv 3.0 中，不推荐使用 slots 所以新增 slot 指定插槽名称
  slot?: string;

  // Whether to hide the column by default, it can be displayed in the column configuration
  defaultHidden?: boolean;

  // Help text for table column header
  helpMessage?: string | string[];

  // 单元格自定义渲染
  customRender?: (opt: {
    value: any;
    text: any;
    record: T;
    index: number;
    renderIndex: number;
    column: BasicColumn<T>;
  }) => any;

  // 单元格格式化
  format?: CellFormat<T>;

  // Editable
  edit?: boolean;
  editRow?: boolean;
  editable?: boolean;
  editAutoCancel?: boolean;
  editComponent?: ComponentType;
  editComponentProps?:
    | ((opt: {
        text: any;
        record: EditRecordRow | Recordable;
        column: BasicColumn<T>;
        index: number;
      }) => Recordable)
    | any;
  // 自定义修改后显示的内容
  editRender?: (opt: {
    text: boolean | number | string | T;
    record: T;
    column: BasicColumn<T>;
    index: number;
    attrs?: object;
  }) => VNodeChild;
  editRule?: ((text: any, record: T) => Promise<void>) | boolean;
  // editValueMap?: (value: any) => string;
  onEditRow?: () => void;

  // 默认值
  editDefaultValue?: any;
  editDefaultLabel?: any;

  // 权限编码控制是否显示
  auth?: string | string[];
  // 业务控制是否显示
  ifShow?: ((column: BasicColumn<T>) => boolean) | boolean;

  // 数据的标签显示，举例 dataIndex 是 userCode，dataLabel 是 userName
  dataLabel?: string;

  // 字典类型
  dictType?: string;

  // 字典类型
  filterDictType?: string;

  // 没有找到字典标签的时候显示的默认值
  defaultValue?: string;

  // 列表操作列选项
  actions?: (record: T) => ActionItem[];
  dropDownActions?: (record: T) => ActionItem[];

  // 拖拽调整列宽
  resizable?: boolean;
}

export type ColumnChangeParam = {
  dataIndex?: string;
  dataIndex_?: string;
  fixed?: 'end' | 'left' | 'right' | 'start' | boolean;
  open: boolean;
};

export interface InnerHandlers {
  onColumnsChange: (data: ColumnChangeParam[]) => void;
}

export interface InnerMethods {
  clearSelectedRowKeys: TableActionType['clearSelectedRowKeys'];
  getSelectRowKeys: TableActionType['getSelectRowKeys'];
}
