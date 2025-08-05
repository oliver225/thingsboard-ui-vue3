/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { TableRowSelection } from 'ant-design-vue/es/table/interface';
import type { ColumnProps } from 'ant-design-vue/lib/table';
import type { JSX } from 'vue/jsx-runtime';

import type { VNodeChild } from 'vue';

import type { Fn, Recordable } from '@vben/types';

import type { BasicColumn } from './column';
import type { PaginationProps } from './pagination';
import type {
  ColumnChangeParam,
  ExpandedRowRenderRecord,
  FetchSetting,
  SizeType,
  SorterResult,
  TableCustomRecord,
  TableSetting,
} from './table';

export interface BasicTableProps<T = any> {
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
  // 列配置
  columns: BasicColumn[];
  // 是否显示序号列
  showIndexColumn?: boolean;
  // 序号列配置
  indexColumnProps?: BasicColumn;
  actionColumn?: BasicColumn;
  // 文本超过宽度是否显示。。。
  ellipsis?: boolean;
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
  expandedRowRender?: (
    record?: ExpandedRowRenderRecord<T>,
  ) => JSX.Element | VNodeChild;

  /**
   * Customize row expand Icon.
   * @type Function | VNodeChild
   */

  expandIcon?: Function | JSX.Element | VNodeChild;

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

  footer?: Function | JSX.Element | VNodeChild;

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
  rowSelection?: TableRowSelection;

  // 默认不展示复选框，但是通过右上角给表格设置复选框的时候加载默认参数
  defaultRowSelection?: TableRowSelection;

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
    scrollToFirstRowOnChange?: boolean;
    x?: number | true;
    y?: number;
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
  title?: ((data: Recordable) => string) | JSX.Element | string | VNodeChild;

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
  transformCellText?: Function;

  /**
   * Callback executed before editable cell submit value, not for row-editor
   *
   * The cell will not submit data while callback return false
   */
  beforeEditSubmit?: (data: {
    index: number;
    key: number | string;
    record: Recordable;
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

  onColumnsChange?: (data: ColumnChangeParam[]) => void;
}
