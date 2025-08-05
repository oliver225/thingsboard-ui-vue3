/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { JSX } from 'vue/jsx-runtime';

import type { VNodeChild } from 'vue';

import type { Authority } from '@vben/constants';
import type { Recordable, VueNode } from '@vben/types';

import type { EditRecordRow } from '../components/editable';
import type { ComponentType } from './componentType';
import type { CellFormat } from './table';
import type { ActionItem } from './tableAction';

export interface ColumnFilterItem {
  text?: string;
  value?: string;
  children?: any;
}

export declare type SortOrder = 'ascend' | 'descend';

export interface RecordProps<T> {
  text: any;
  record: T;
  index: number;
}

export interface FilterDropdownProps {
  prefixCls?: string;
  setSelectedKeys?: (selectedKeys: string[]) => void;
  selectedKeys?: string[];
  confirm?: () => void;
  clearFilters?: () => void;
  filters?: ColumnFilterItem[];
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  open?: boolean;
}

export declare type CustomRenderFunction<T> = (
  record: RecordProps<T>,
) => JSX.Element | VNodeChild;

export interface ColumnProps<T> {
  /**
   * specify how content is aligned
   * @default 'left'
   * @type string
   */
  align?: 'center' | 'left' | 'right';

  /**
   * ellipsize cell content, not working with sorter and filters for now.
   * tableLayout would be fixed when ellipsis is true.
   * @default false
   * @type boolean
   */
  ellipsis?: boolean;

  /**
   * Span of this column's title
   * @type number
   */
  colSpan?: number;

  /**
   * Display field of the data record, could be set like a.b.c
   * @type string
   */
  dataIndex?: string;

  /**
   * Default filtered values
   * @type string[]
   */
  defaultFilteredValue?: string[];

  /**
   * Default order of sorted values: 'ascend' 'descend' null
   * @type string
   */
  defaultSortOrder?: SortOrder;

  /**
   * Customized filter overlay
   * @type any (slot)
   */
  filterDropdown?:
    | ((props: FilterDropdownProps) => JSX.Element | VNodeChild)
    | JSX.Element
    | VNodeChild;

  /**
   * Whether filterDropdown is open
   * @type boolean
   */
  filterDropdownOpen?: boolean;

  /**
   * Whether the dataSource is filtered
   * @default false
   * @type boolean
   */
  filtered?: boolean;

  /**
   * Controlled filtered value, filter icon will highlight
   * @type string[]
   */
  filteredValue?: string[];

  /**
   * Customized filter icon
   * @default false
   * @type any
   */
  filterIcon?: boolean | JSX.Element | VNodeChild;

  /**
   * Whether multiple filters can be selected
   * @default true
   * @type boolean
   */
  filterMultiple?: boolean;

  /**
   * Filter menu config
   * @type object[]
   */
  filters?: ColumnFilterItem[];

  /**
   * Set column to be fixed: true(same as left) 'left' 'right'
   * @default false
   * @type boolean | string
   */
  fixed?: 'left' | 'right' | boolean;

  /**
   * Unique key of this column, you can ignore this prop if you've set a unique dataIndex
   * @type string
   */
  key?: string;

  /**
   * Renderer of the table cell. The return value should be a VNode, or an object for colSpan/rowSpan config
   * @type Function | ScopedSlot
   */
  customRender?: CustomRenderFunction<T> | JSX.Element | VNodeChild;

  /**
   * Sort function for local sort, see Array.sort's compareFunction. If you need sort buttons only, set to true
   * @type boolean | Function
   */
  sorter?: boolean | Function;

  /**
   * Order of sorted values: 'ascend' 'descend' false
   * @type boolean | string
   */
  sortOrder?: boolean | SortOrder;

  /**
   * supported sort way, could be 'ascend', 'descend'
   * @default ['ascend', 'descend']
   * @type string[]
   */
  sortDirections?: SortOrder[];

  /**
   * Title of this column
   * @type any (string | slot)
   */
  title?: JSX.Element | VNodeChild;

  /**
   * Width of this column
   * @type string | number
   */
  width?: number | string;

  /**
   * Set props on per cell
   * @type Function
   */
  customCell?: (record: T, rowIndex: number) => object;

  /**
   * Set props on per header cell
   * @type object
   */
  customHeaderCell?: (column: ColumnProps<T>) => object;

  /**
   * Callback executed when the confirm filter button is clicked, Use as a filter event when using template or jsx
   * @type Function
   */
  onFilter?: (value: any, record: T) => boolean;

  /**
   * Callback executed when filterDropdownOpen is changed, Use as a filterDropdownOpen event when using template or jsx
   * @type Function
   */
  onFilterDropdownOpenChange?: (open: boolean) => void;

  /**
   * When using columns, you can setting this property to configure the properties that support the slot,
   * such as slots: { filterIcon: 'XXX'}
   * @type object
   */
  slots?: Recordable<string>;
}

// @ts-ignore
export interface BasicColumn extends ColumnProps<Recordable> {
  dataIndex_?: string;
  children?: BasicColumn[];
  filters?: {
    children?:
      | ((() => unknown[]) &
          (() => unknown[]) &
          ((props: Record<string, unknown>) => unknown[]))
      | unknown[];
    text: string;
    value: string;
  }[];

  //
  flag?: 'ACTION' | 'CHECKBOX' | 'DEFAULT' | 'DRAG' | 'INDEX' | 'RADIO';
  customTitle?: VueNode;

  // Antdv 3.0 中，不推荐使用 slots 所以新增 slot 指定插槽名称
  slot?: string;

  // Whether to hide the column by default, it can be displayed in the column configuration
  defaultHidden?: boolean;

  // Help text for table column header
  helpMessage?: string | string[];

  format?: CellFormat;

  // Editable
  edit?: boolean;
  editRow?: boolean;
  editable?: boolean;
  editAutoCancel?: boolean;
  editComponent?: ComponentType;
  editComponentProps?:
    | ((opt: {
        column: BasicColumn;
        index: number;
        record: EditRecordRow | Recordable;
        text: any;
      }) => Recordable)
    | any;
  // 自定义修改后显示的内容
  editRender?: (opt: {
    attrs?: object;
    column: BasicColumn;
    index: number;
    record: Recordable;
    text: boolean | number | Recordable | string;
  }) => JSX.Element | VNodeChild;
  editRule?: ((text: any, record: Recordable) => Promise<void>) | boolean;
  // editValueMap?: (value: any) => string;
  onEditRow?: () => void;

  // 默认值
  editDefaultValue?: any;
  editDefaultLabel?: any;

  // 权限编码控制是否显示
  auth?: Authority | Authority[] | string | string[];
  // 业务控制是否显示
  ifShow?: ((column: BasicColumn) => boolean) | boolean;

  // 数据的标签显示，举例 dataIndex 是 userCode，dataLabel 是 userName
  dataLabel?: string;

  // 没有找到字典标签的时候显示的默认值
  defaultValue?: string;

  // 列表操作列选项
  actions?: (record: Recordable) => ActionItem[];
  dropDownActions?: (record: Recordable) => ActionItem[];
}
