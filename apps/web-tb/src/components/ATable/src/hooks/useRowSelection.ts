/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ComputedRef, Ref } from 'vue';

import type { EmitType, Recordable } from '@vben/types';

import type { TableRowSelection } from '../types/table';
import type { BasicTableProps } from '../types/tableProps';

import { computed, nextTick, ref, unref, watch } from 'vue';

import { isFunction, isString, omit } from '@vben/utils';

import { ROW_KEY } from '../const';

export function useRowSelection(
  propsRef: ComputedRef<BasicTableProps>,
  tableData: Ref<Recordable[]>,
  emit: EmitType,
) {
  const selectedRowKeysRef = ref<number[] | string[]>([]);
  const selectedRowRef = ref<Recordable[]>([]);

  const getRowSelectionRef = computed((): null | TableRowSelection => {
    const { rowSelection } = unref(propsRef);
    if (!rowSelection) {
      return null;
    }

    return {
      selectedRowKeys: unref(selectedRowKeysRef),
      preserveSelectedRowKeys: true, // 由 clearSelectedOnReload 选项控制是否保留选择项
      onChange: (selectedRowKeys: number[] | string[], selectedRows: any[]) => {
        setSelectedRowKeys(selectedRowKeys);
        if (rowSelection && rowSelection.onChange) {
          rowSelection.onChange(selectedRowKeys, selectedRows);
        }
      },
      ...omit(rowSelection, ['onChange']),
    };
  });

  watch(
    () => unref(propsRef).rowSelection?.selectedRowKeys,
    (v: any | string[]) => {
      setSelectedRowKeys(v);
    },
  );

  watch(
    () => unref(selectedRowKeysRef),
    () => {
      nextTick(() => {
        const { rowSelection } = unref(propsRef);
        if (rowSelection) {
          const { onChange } = rowSelection;
          if (onChange && isFunction(onChange)) {
            onChange(getSelectRowKeys(), getSelectRows());
          }
        }
        // 有数据时，再调用选择变更事件
        if (unref(tableData).length > 0) {
          emit('selection-change', {
            keys: getSelectRowKeys(),
            rows: getSelectRows(),
          });
        }
      });
    },
    { deep: true },
  );

  const getAutoCreateKey = computed(() => {
    return unref(propsRef).autoCreateKey && !unref(propsRef).rowKey;
  });

  const getRowKey = computed(() => {
    const { rowKey } = unref(propsRef);
    return unref(getAutoCreateKey) ? ROW_KEY : rowKey;
  });

  function getKey(record: Recordable) {
    const rowKey = unref(getRowKey);

    if (isString(rowKey)) {
      return record[rowKey];
    }

    if (isFunction(rowKey)) {
      return rowKey(record, null);
    }
    return null;
  }

  function setSelectedRowKeys(rowKeys: number[] | string[]) {
    selectedRowKeysRef.value = rowKeys;
    const allSelectedRows = rowKeys;
    const trueSelectedRows: any[] = [];
    rowKeys.forEach((key: number | string) => {
      const found = allSelectedRows.find((item) => getKey(item) === key);
      found && trueSelectedRows.push(found);
    });
    selectedRowRef.value = trueSelectedRows;
  }

  function setSelectedRows(rows: Recordable[]) {
    selectedRowRef.value = rows;
  }

  function clearSelectedRowKeys() {
    selectedRowRef.value = [];
    selectedRowKeysRef.value = [];
  }

  function deleteSelectRowByKey(key: string) {
    const selectedRowKeys = unref(selectedRowKeysRef);
    const index = selectedRowKeys.indexOf(key as never);
    if (index !== -1) {
      unref(selectedRowKeysRef).splice(index, 1);
    }
  }

  function getSelectRowKeys() {
    return unref(selectedRowKeysRef);
  }

  function getSelectRows<T = Recordable>() {
    // const ret = toRaw(unref(selectedRowRef)).map((item) => toRaw(item));
    return unref(selectedRowRef) as T[];
  }

  function getRowSelection() {
    return unref(getRowSelectionRef)!;
  }

  return {
    getRowSelection,
    getRowSelectionRef,
    getSelectRows,
    getSelectRowKeys,
    setSelectedRowKeys,
    clearSelectedRowKeys,
    deleteSelectRowByKey,
    setSelectedRows,
  };
}
