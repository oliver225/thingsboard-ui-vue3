import type { WatchStopHandle } from 'vue';

import type { Nullable, Recordable } from '@vben/types';

import type { BasicColumn } from '../types/column';
import type { PaginationProps } from '../types/pagination';
import type { FetchParams, TableActionType } from '../types/table';
import type { BasicTableProps } from '../types/tableProps';

import { onUnmounted, ref, toRaw, unref, watch } from 'vue';

// import { getDynamicProps } from '/@/utils';
// import { isProdMode } from '/@/utils/env';
// import { error } from '/@/utils/log';

type Props = Partial<DynamicProps<BasicTableProps>>;

type UseTableMethod = TableActionType;

export function useTable(
  tableProps?: Props,
): [
  (instance: TableActionType, formInstance: UseTableMethod) => void,
  TableActionType,
] {
  const tableRef = ref<Nullable<TableActionType>>(null);
  const loadedRef = ref<Nullable<boolean>>(false);
  const formRef = ref<Nullable<UseTableMethod>>(null);

  let stopWatch: WatchStopHandle;

  function register(instance: TableActionType, formInstance: UseTableMethod) {
    isProdMode() &&
      onUnmounted(() => {
        tableRef.value = null;
        loadedRef.value = null;
      });

    if (unref(loadedRef) && isProdMode() && instance === unref(tableRef))
      return;

    tableRef.value = instance;
    formRef.value = formInstance;
    tableProps && instance.setProps(getDynamicProps(tableProps));
    loadedRef.value = true;

    stopWatch?.();

    stopWatch = watch(
      () => tableProps,
      () => {
        tableProps && instance.setProps(getDynamicProps(tableProps));
      },
      {
        immediate: true,
        deep: true,
      },
    );
  }

  function getTableInstance(): TableActionType {
    const table = unref(tableRef);
    if (!table) {
      console.error(
        'The table instance has not been obtained yet, please make sure the table is presented when performing the table operation!',
      );
    }
    return table as TableActionType;
  }

  const methods: TableActionType = {
    reload: async (opt?: FetchParams) => {
      return await getTableInstance().reload(opt);
    },
    setProps: (props: Partial<BasicTableProps>) => {
      getTableInstance().setProps(props);
    },
    setLoading: (loading: boolean) => {
      getTableInstance().setLoading(loading);
    },
    getTableRef: () => {
      return toRaw(getTableInstance().getTableRef());
    },
    redoHeight: () => {
      getTableInstance().redoHeight();
    },
    scrollTo: (pos: string) => {
      getTableInstance().scrollTo(pos);
    },
    getSize: () => {
      return getTableInstance().getSize();
    },
    emit: (type: string, ...args: any) => {
      return getTableInstance().emit(type, ...args);
    },

    getColumns: ({ ignoreIndex = false }: { ignoreIndex?: boolean } = {}) => {
      const columns = getTableInstance().getColumns({ ignoreIndex }) || [];
      return toRaw(columns);
    },
    getCacheColumns: () => {
      return toRaw(getTableInstance().getCacheColumns());
    },
    setColumns: (columns: BasicColumn[] | string[]) => {
      getTableInstance().setColumns(columns);
    },
    updateColumn: (column: BasicColumn | BasicColumn[]) => {
      getTableInstance().updateColumn(column);
    },

    getPagination: () => {
      return getTableInstance().getPagination();
    },
    setPagination: (info: Partial<PaginationProps>) => {
      return getTableInstance().setPagination(info);
    },
    getShowPagination: () => {
      return getTableInstance().getShowPagination();
    },
    setShowPagination: (show: boolean) => {
      getTableInstance().setShowPagination(show);
    },

    getDataSource: () => {
      return getTableInstance().getDataSource();
    },
    getDelDataSource: () => {
      return getTableInstance().getDelDataSource();
    },
    getRawDataSource: () => {
      return getTableInstance().getRawDataSource();
    },

    setTableData: (values: any[]) => {
      return getTableInstance().setTableData(values);
    },
    updateTableData: (index: number, key: string, value: any) => {
      return getTableInstance().updateTableData(index, key, value);
    },
    updateTableDataRecord: (rowKey: number | string, record: Recordable) => {
      return getTableInstance().updateTableDataRecord(rowKey, record);
    },
    deleteTableDataRecord: (record: Recordable | Recordable[]) => {
      return getTableInstance().deleteTableDataRecord(record);
    },
    insertTableDataRecord: (
      record: Recordable | Recordable[],
      index?: number,
    ) => {
      return getTableInstance().insertTableDataRecord(record, index);
    },
    findTableDataRecord: (rowKey: number | string) => {
      return getTableInstance().findTableDataRecord(rowKey);
    },

    getRowSelection: () => {
      return getTableInstance().getRowSelection();
    },
    getDefaultRowSelection: () => {
      return getTableInstance().getDefaultRowSelection();
    },
    getSelectRows: () => {
      return toRaw(getTableInstance().getSelectRows());
    },
    getSelectRowKeys: () => {
      return toRaw(getTableInstance().getSelectRowKeys());
    },
    setSelectedRowKeys: (keys: number[] | string[]) => {
      getTableInstance().setSelectedRowKeys(keys);
    },
    deleteSelectRowByKey: (key: string) => {
      getTableInstance().deleteSelectRowByKey(key);
    },
    clearSelectedRowKeys: () => {
      getTableInstance().clearSelectedRowKeys();
    },

    expandAll: () => {
      getTableInstance().expandAll();
    },
    expandRows: (keys: string[]) => {
      getTableInstance().expandRows(keys);
    },
    collapseAll: () => {
      getTableInstance().collapseAll();
    },
    expandCollapse: (record: Recordable) => {
      getTableInstance().expandCollapse(record);
    },
  };

  return [register, methods];
}
