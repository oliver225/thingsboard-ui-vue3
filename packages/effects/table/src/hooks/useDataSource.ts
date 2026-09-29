import type { ComputedRef, Ref } from 'vue';

import type { PaginationProps } from '../types/pagination';
import type { FormRecordable, TableRecordable } from '../types/record';
import type { EmitType, Recordable } from '../types/shared';
import type {
  BasicTableProps,
  FetchParams,
  SorterResult,
} from '../types/table';

import {
  computed,
  onMounted,
  reactive,
  ref,
  unref,
  watch,
  watchEffect,
} from 'vue';

import { cloneDeep, get, isBoolean, isFunction } from '@vben/utils';

import { useTimeoutFn } from '@vueuse/core';
import { merge } from 'es-toolkit/compat';

import { FETCH_SETTING, getTableRowKey, PAGE_SIZE } from '../const';
import { useDict } from '../dictionary';
import { isArray } from '../helpers';

interface ActionType {
  getPaginationInfo: ComputedRef<boolean | PaginationProps>;
  setPagination: (info: Partial<PaginationProps>) => void;
  setLoading: (loading: boolean) => void;
  getFieldsValue: () => FormRecordable;
  clearSelectedRowKeys: () => void;
  tableData: Ref<TableRecordable[]>;
  collapseAll: () => void;
  expandCollapse: (
    record: TableRecordable,
    onlyLoadData: boolean,
    forceLoad: boolean,
  ) => Promise<any>;
}

interface SearchState {
  sortInfo: Recordable;
  filterInfo: Record<string, string[]>;
}
export function useDataSource(
  propsRef: ComputedRef<BasicTableProps>,
  dictTypesRef: Ref<Set<string>>,
  {
    getPaginationInfo,
    setPagination,
    setLoading,
    getFieldsValue,
    clearSelectedRowKeys,
    tableData,
    collapseAll,
    expandCollapse,
  }: ActionType,
  emit: EmitType,
) {
  const searchState = reactive<SearchState>({
    sortInfo: {},
    filterInfo: {},
  });
  const dataSourceRef: Ref<TableRecordable[]> = ref([]);
  const delDataSourceRef: Ref<TableRecordable[]> = ref([]);
  const rawDataSourceRef: Ref<TableRecordable> = ref({});
  const getDataSourceRef: Ref<TableRecordable[]> = ref([]);
  const { initDict } = useDict();

  watchEffect(() => {
    tableData.value = unref(dataSourceRef);
  });

  watch(
    () => unref(propsRef).dataSource,
    () => {
      const { dataSource, api } = unref(propsRef);
      !api && dataSource && (dataSourceRef.value = dataSource);
    },
    {
      immediate: true,
    },
  );

  async function handleTableChange(
    pagination: PaginationProps,
    filters: Partial<Recordable<string[]>>,
    sorter: SorterResult,
  ) {
    const { clearSelectedOnReload, sortFn, filterFn } = unref(propsRef);
    if (clearSelectedOnReload) {
      clearSelectedRowKeys();
    }
    setPagination(pagination);

    const params: Recordable = {};
    if (sorter && isFunction(sortFn)) {
      const sortInfo = sortFn(sorter);
      searchState.sortInfo = sortInfo;
      params.sortInfo = sortInfo;
    }

    if (filters && isFunction(filterFn)) {
      const filterInfo = filterFn(filters);
      searchState.filterInfo = filterInfo;
      params.filterInfo = filterInfo;
    }
    await fetch(params);
  }

  function setTableKey(items: any[]) {
    if (!items || !Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item[getTableRowKey(propsRef.value)]) {
        item[getTableRowKey(propsRef.value)] = crypto.randomUUID();
      }
      if (item.children && item.children.length > 0) {
        setTableKey(item.children);
      }
    });
  }

  const getAutoCreateKey = computed(() => {
    return unref(propsRef).autoCreateKey && !unref(propsRef).rowKey;
  });

  const getRowKey = computed(() => {
    const { rowKey } = unref(propsRef);
    return unref(getAutoCreateKey) ? getTableRowKey(propsRef.value) : rowKey;
  });

  watch(
    () => dataSourceRef.value,
    async (value, oldValue) => {
      if (value === oldValue) return;
      const dataSource = unref(dataSourceRef);
      if (!dataSource || dataSource.length === 0) {
        getDataSourceRef.value = unref(dataSourceRef);
        return;
      }
      if (unref(getAutoCreateKey)) {
        const firstItem = dataSource[0];
        const lastItem = dataSource[dataSource.length - 1];
        if (
          firstItem &&
          lastItem &&
          (!firstItem[getTableRowKey(propsRef.value)] ||
            !lastItem[getTableRowKey(propsRef.value)])
        ) {
          const data = cloneDeep(unref(dataSourceRef));
          data.forEach((item) => {
            if (!item[getTableRowKey(propsRef.value)]) {
              item[getTableRowKey(propsRef.value)] = crypto.randomUUID();
            }
            if (item.children && item.children.length > 0) {
              setTableKey(item.children);
            }
          });
          dataSourceRef.value = data;
        }
      }
      await initDict(dictTypesRef.value);
      // console.log('datasource', dictTypesRef.value);
      getDataSourceRef.value = unref(dataSourceRef);
    },
    {
      deep: true,
      immediate: true,
    },
  );

  async function updateTableData(index: number, key: string, value: any) {
    const record = dataSourceRef.value[index];
    if (record) {
      record[key] = value;
    }
    return dataSourceRef.value[index];
  }

  function updateTableDataRecord(
    rowKey: number | string,
    record: Recordable,
  ): Recordable | undefined {
    const row = findTableDataRecord(rowKey);
    if (row) {
      for (const field in record) {
        row[field] = record[field];
      }
      return row;
    }
  }

  function deleteTableDataRecord(
    record: Recordable | Recordable[],
  ): Recordable | undefined {
    if (!dataSourceRef.value || dataSourceRef.value.length === 0) return;

    function deleteRecord(dataSource: Recordable[]) {
      const rowKeyName = unref(getRowKey);
      if (!rowKeyName) return;

      const records = Array.isArray(record) ? record : [record];
      const recordIndex = records
        .map((item) =>
          typeof rowKeyName === 'function'
            ? dataSource.findIndex(
                (source) => rowKeyName(source) === rowKeyName(item),
              )
            : dataSource.findIndex(
                (source) => source[rowKeyName] === item[rowKeyName],
              ),
        )
        .filter((index) => index >= 0)
        .toSorted((a, b) => b - a); // 从大到小排序

      for (const index of recordIndex) {
        const deletedRecord = dataSource[index];
        if (!deletedRecord) continue;
        unref(delDataSourceRef).push(deletedRecord);
        dataSource.splice(index, 1);
      }

      if (unref(propsRef).isTreeTable) {
        const childrenName = unref(propsRef).childrenColumnName || 'children';
        dataSource.forEach((child) => {
          if (child[childrenName] && isArray(child[childrenName])) {
            deleteRecord(child[childrenName]);
          }
        });
      }
    }
    deleteRecord(unref(dataSourceRef));

    setPagination({ total: unref(dataSourceRef).length });
    return unref(dataSourceRef);
  }

  function insertTableDataRecord(
    record: Recordable,
    index?: number,
  ): Recordable | undefined {
    // if (!dataSourceRef.value || dataSourceRef.value.length == 0) return;
    index = index ?? dataSourceRef.value?.length;
    unref(dataSourceRef).splice(
      index,
      0,
      ...(Array.isArray(record) ? record : [record]),
    );
    return unref(dataSourceRef);
  }

  function findTableDataRecord(rowKey: number | string) {
    if (!dataSourceRef.value || dataSourceRef.value.length === 0) return;

    const rowKeyName = unref(getRowKey);
    if (!rowKeyName) return;

    const { childrenColumnName = 'children' } = unref(propsRef);

    const findRow = (array: any[]) => {
      let ret: Recordable | undefined;
      array.some(function iter(r) {
        if (typeof rowKeyName === 'function') {
          if ((rowKeyName(r, undefined) as string) === rowKey) {
            ret = r;
            return true;
          }
        } else {
          if (Reflect.has(r, rowKeyName) && r[rowKeyName] === rowKey) {
            ret = r;
            return true;
          }
        }
        return r[childrenColumnName] && r[childrenColumnName].some(iter);
      });
      return ret;
    };

    // const row = dataSourceRef.value.find(r => {
    //   if (typeof rowKeyName === 'function') {
    //     return (rowKeyName(r) as string) === rowKey
    //   } else {
    //     return Reflect.has(r, rowKeyName) && r[rowKeyName] === rowKey
    //   }
    // })
    return findRow(dataSourceRef.value);
  }

  let fetchVersion = 0;
  async function fetch(opt?: FetchParams): Promise<any> {
    const {
      api,
      searchInfo,
      defSort,
      fetchSetting,
      beforeFetch,
      afterFetch,
      useSearchForm,
      pagination,
      isTreeTable,
    } = unref(propsRef);

    if (!api || !isFunction(api)) return;
    const version = ++fetchVersion;
    try {
      setLoading(true);
      const { pageField, sizeField, listField, totalField } = Object.assign(
        {},
        FETCH_SETTING,
        fetchSetting,
      );
      let pageParams: Recordable = {};

      const {
        current = 1,
        pageSize: pageSizeVal,
        defaultPageSize,
      } = unref(getPaginationInfo) as PaginationProps;
      const pageSize = pageSizeVal || defaultPageSize || PAGE_SIZE;

      if (
        (isBoolean(pagination) && !pagination) ||
        isBoolean(getPaginationInfo)
      ) {
        pageParams = {};
      } else {
        pageParams[pageField] = (opt && opt.page) || current;
        pageParams[sizeField] = pageSize;
      }

      const { sortInfo = {}, filterInfo } = searchState;

      let params: Recordable = merge(
        pageParams,
        useSearchForm ? getFieldsValue() : {},
        searchInfo,
        opt?.searchInfo ?? {},
        defSort,
        sortInfo,
        filterInfo,
        opt?.sortInfo ?? {},
        opt?.filterInfo ?? {},
      );

      collapseAll(); // 如果是树表，刷新后折叠

      if (beforeFetch && isFunction(beforeFetch)) {
        params = (await beforeFetch(params)) || params;
      }

      if (version !== fetchVersion) return;
      const res = await api(params);
      if (version !== fetchVersion) return;
      rawDataSourceRef.value = res;

      const isArrayResult = Array.isArray(res);

      let resultItems: Recordable[] = isArrayResult ? res : get(res, listField);
      const resultTotal: number = isArrayResult
        ? res.length
        : get(res, totalField);

      // 假如数据变少，导致总页数变少并小于当前选中页码，通过getPaginationRef获取到的页码是不正确的，需获取正确的页码再次执行
      if (Number.isFinite(resultTotal)) {
        const currentTotalPage = Math.max(1, Math.ceil(resultTotal / pageSize));
        if (Number(pageParams[pageField] || current) > currentTotalPage) {
          setPagination({
            current: currentTotalPage,
          });
          return await fetch({ ...opt, page: currentTotalPage });
        }
      }

      const firstItem = resultItems[0];
      if (isTreeTable && firstItem) {
        const { childrenColumnName = 'children' } = unref(propsRef);
        if (!firstItem[childrenColumnName]) {
          firstItem[childrenColumnName] = [];
        }
      }

      if (afterFetch && isFunction(afterFetch)) {
        resultItems = (await afterFetch(resultItems)) || resultItems;
      }
      if (version !== fetchVersion) return;
      dataSourceRef.value = resultItems;
      setPagination({
        total: resultTotal || 0,
      });
      if (opt && opt.page) {
        setPagination({
          current: opt.page || 1,
        });
      }
      emit('fetch-success', {
        items: unref(resultItems),
        total: resultTotal,
      });
      window.dispatchEvent(new Event('resize'));
      return resultItems;
    } catch (error) {
      if (version !== fetchVersion) return;
      emit('fetch-error', error);
      dataSourceRef.value = [];
      setPagination({
        total: 0,
      });
    } finally {
      if (version === fetchVersion) setLoading(false);
    }
  }

  function setTableData<T = Recordable[]>(values: T[]) {
    dataSourceRef.value = values as Recordable[];
    delDataSourceRef.value = [];
  }

  function getDataSource<T = Recordable>() {
    return getDataSourceRef.value as T[];
  }

  function getDelDataSource<T = Recordable>() {
    return delDataSourceRef.value as T[];
  }

  function getRawDataSource<T = Recordable>() {
    return rawDataSourceRef.value as T;
  }

  async function reload(opt?: FetchParams) {
    const { clearSelectedOnReload } = unref(propsRef);
    if (clearSelectedOnReload) {
      clearSelectedRowKeys();
    }
    // 如果是树表，则刷新上一个父节点和要转移到目标的父节点下的数据 v5.6.0+
    if (
      unref(propsRef).isTreeTable &&
      opt?.record &&
      opt?.record.parentCode &&
      String(opt.record.parentCode) !== '0'
    ) {
      // 刷新移动前的父节点 v5.6.0+
      if (
        opt?.record.oldParentCode &&
        String(opt.record.oldParentCode) !== '0'
      ) {
        const row = findTableDataRecord(opt?.record.oldParentCode);
        if (row) await expandCollapse(row, false, true);
      } else {
        await fetch(opt);
      }
      // 刷新移动后的父节点 v5.6.0+
      if (String(opt.record.oldParentCode) !== String(opt.record.parentCode)) {
        const row = findTableDataRecord(opt?.record.parentCode);
        if (row) await expandCollapse(row, false, true);
      }
    }
    // 旧版兼容，建议使用 record 参数替换 v5.6.0 之前
    else if (opt?.parentCode && String(opt.parentCode) !== '0') {
      const row = findTableDataRecord(opt.parentCode);
      if (row) await expandCollapse(row, false, true);
    }
    // 重载表格数据
    else {
      await fetch(opt);
    }
  }

  onMounted(() => {
    useTimeoutFn(() => {
      unref(propsRef).immediate && fetch();
    }, 16);
  });

  return {
    getDataSourceRef,
    getDataSource,
    getDelDataSource,
    getRawDataSource,
    getRowKey,
    getAutoCreateKey,
    setTableData,
    updateTableData,
    updateTableDataRecord,
    deleteTableDataRecord,
    insertTableDataRecord,
    findTableDataRecord,
    handleTableChange,
    fetch,
    reload,
  };
}
