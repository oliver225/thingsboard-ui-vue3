import type { ComputedRef, DefineComponent, Ref, WatchStopHandle } from 'vue';

import type { DynamicProps } from '../types/dynamic-props';
import type { FormActionType } from '../types/form';
import type { PaginationProps } from '../types/pagination';
import type { Nullable, Recordable } from '../types/shared';
import type {
  BasicColumn,
  BasicTableProps,
  FetchParams,
  TableActionType,
  TableSelection,
} from '../types/table';

import {
  computed,
  defineComponent,
  h,
  nextTick,
  onUnmounted,
  ref,
  toRaw,
  unref,
  watch,
} from 'vue';

import BasicTable from '../BasicTable.vue';
import { getTableConfig, mergeTableConfig } from '../config';
import { getDynamicProps } from '../helpers';
import { useTableBatch } from './useTableBatch';

type Props<T> = Partial<DynamicProps<BasicTableProps<T>>>;

export type UseTableMethod = TableActionType & {
  selection: ComputedRef<TableSelection>;
  batchPending: Readonly<Ref<boolean>>;
  getForm: () => FormActionType;
};

export function useTable<T = Recordable>(
  tableProps?: Props<T>,
): [
  (instance: TableActionType, formInstance: UseTableMethod) => void,
  UseTableMethod,
] {
  const tableRef = ref<Nullable<TableActionType>>(null);
  const loadedRef = ref<Nullable<boolean>>(false);
  const formRef = ref<Nullable<UseTableMethod>>(null);
  const selection = computed<TableSelection>(() => {
    const keys = [...(tableRef.value?.getSelectRowKeys() ?? [])] as
      | number[]
      | string[];
    return {
      keys,
      rows: [...(tableRef.value?.getSelectRows() ?? [])],
      count: keys.length,
    };
  });
  const batchPending = useTableBatch(
    tableRef,
    computed(() =>
      mergeTableConfig(
        getTableConfig(),
        tableProps ? getDynamicProps(tableProps) : undefined,
      ),
    ),
    selection,
  );

  let stopWatch: WatchStopHandle;

  function register(instance: TableActionType, formInstance: UseTableMethod) {
    import.meta.env.PROD &&
      onUnmounted(() => {
        tableRef.value = null;
        loadedRef.value = null;
      });
    if (
      unref(loadedRef) &&
      import.meta.env.PROD &&
      instance === unref(tableRef)
    )
      return;

    tableRef.value = instance;
    formRef.value = formInstance;
    tableProps && instance.setProps(getDynamicProps(tableProps));
    loadedRef.value = true;

    stopWatch?.();
    // 只同步变化的配置，避免查询或语言更新时重置用户开启的选择列。
    const stops = (Object.keys(tableProps ?? {}) as (keyof Props<T>)[]).map(
      (key) =>
        watch(
          () => unref(tableProps?.[key]),
          (value) => instance.setProps({ [key]: value }),
          { deep: true },
        ),
    );
    stopWatch = () => stops.forEach((stop) => stop());
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

  const methods: UseTableMethod = {
    selection,
    batchPending,
    reload: async (opt?: FetchParams) => {
      // v-model and change fire together; let dynamic props settle before fetching.
      await nextTick();
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

    getColumns: (options = {}) => {
      const columns = getTableInstance().getColumns(options) || [];
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

    getForm: () => {
      return unref(formRef) as unknown as FormActionType;
    },
  };

  return [register, methods];
}

export function useBasicTable<T = Recordable>(
  tableProps?: Props<T>,
): [DefineComponent, UseTableMethod] {
  const [register, methods] = useTable(tableProps);
  const Table = defineComponent({
    render() {
      return h(
        BasicTable as any,
        {
          onRegister: register,
          ...tableProps,
          ...this.$attrs,
        },
        { ...this.$slots },
      );
    },
  }) as DefineComponent;
  return [Table, methods];
}
