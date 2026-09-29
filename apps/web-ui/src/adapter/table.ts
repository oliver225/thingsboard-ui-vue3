import type { PageLink } from '#/types/tb';

import { setupVbenTable } from '@vben/table';

import { $t } from '#/locales';

interface TableRequestParams {
  [key: string]: unknown;
  pageNo?: number;
  pageSize?: number;
  orderBy?: string;
  searchText?: string;
  textSearch?: string;
}

// Global defaults. A page's useTable options override these values.
setupVbenTable({
  rowKey: 'id',
  autoRowKey: 'key',
  align: 'center',
  size: 'small',
  // 默认跟随全局字号减 2px；设置数字（如 14）可固定表格字号。
  fontSize: undefined,
  columnFlags: { index: 'INDEX', drag: 'DRAG', action: 'ACTION' },
  fetchSetting: {
    pageField: 'pageNo',
    sizeField: 'pageSize',
    listField: 'data',
    totalField: 'totalElements',
  },
  defSort: { orderBy: 'createdTime desc' },
  filterFn: (filters) => filters,
  showTableSetting: true,
  tableSetting: { size: true, setting: true },
  canResize: true,
  isCanResizeParent: true,
  defaultRowSelection: { type: 'checkbox' },
  showIndexColumn: true,
  indexColumnProps: { width: 60 },
  bordered: true,
  striped: true,
  useSearchForm: false,
  pagination: {
    pageSize: 20,
    pageSizeOptions: ['10', '20', '50', '100'],
    showQuickJumper: true,
  },
  beforeFetch: (params: TableRequestParams): PageLink => {
    const {
      pageNo,
      pageSize,
      orderBy,
      searchText,
      textSearch: query,
      ...filters
    } = params;
    const [sortProperty, direction] = orderBy?.trim().split(/\s+/) ?? [];
    const textSearch = (searchText ?? query)?.trim();
    return {
      ...filters,
      page: Math.max(0, (pageNo ?? 1) - 1),
      pageSize: pageSize ?? 20,
      ...(sortProperty
        ? {
            sortProperty,
            sortOrder: direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
          }
        : {}),
      ...(textSearch ? { textSearch } : {}),
    };
  },
  batchMessages: {
    title: () => $t('tb.common.messages.batchDelete.title'),
    confirmText: () => $t('tb.common.delete'),
    cancelText: () => $t('tb.common.cancel'),
    selected: (count) =>
      $t('tb.common.messages.batchDelete.selected', { count }),
    confirm: (entity, count) =>
      $t('tb.common.messages.batchDelete.confirm', { entity, count }),
    success: (entity, count) =>
      $t('tb.common.messages.batchDelete.success', { entity, count }),
    partialFailure: (entity, deleted, failed) =>
      $t('tb.common.messages.batchDelete.partialFailure', {
        entity,
        deleted,
        failed,
      }),
  },
  sortFn: ({ order, columnKey }) => {
    if (order && columnKey) {
      return { orderBy: `${columnKey} ${order.replace('end', '')}` };
    }
  },
});

export { BasicTable, TableAction, useBasicTable, useTable } from '@vben/table';
export type {
  ActionColumn,
  ActionItem,
  ActionProps,
  BasicColumn,
  BasicTableProps,
  TableConfig,
} from '@vben/table';
