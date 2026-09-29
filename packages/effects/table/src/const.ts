import type { BasicTableProps, SorterResult } from './types/table';

export const ROW_KEY = 'key';
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '80', '100'];
export const PAGE_SIZE = 20;
export const FETCH_SETTING = {
  pageField: 'pageNo',
  sizeField: 'pageSize',
  listField: 'list',
  totalField: 'count',
};
export const DEFAULT_SIZE = 'small';
export const DEFAULT_ALIGN = 'center';
export const INDEX_COLUMN_FLAG = 'INDEX';
export const DRAG_COLUMN_FLAG = 'DRAG';
export const ACTION_COLUMN_FLAG = 'ACTION';
export function DEFAULT_SORT_FN({ order, columnKey }: SorterResult) {
  if (order && columnKey) {
    return { orderBy: `${columnKey} ${order.replace('end', '')}` };
  }
}

export function getTableRowKey(props: Partial<BasicTableProps>) {
  return props.autoRowKey ?? ROW_KEY;
}

export function getTableColumnFlags(props: Partial<BasicTableProps>) {
  return {
    index: INDEX_COLUMN_FLAG,
    drag: DRAG_COLUMN_FLAG,
    action: ACTION_COLUMN_FLAG,
    ...props.columnFlags,
  };
}
export function DEFAULT_FILTER_FN(data: Partial<Record<string, string[]>>) {
  return data;
}
