import type { ComputedRef, Ref } from 'vue';

import type { EmitType, Recordable } from '../types/shared';
import type { BasicTableProps, TableRowSelection } from '../types/table';

import { computed, nextTick, ref, toRaw, toValue, unref, watch } from 'vue';

import { isFunction, isString, traverseTreeValues } from '@vben/utils';

import { omit } from 'es-toolkit/compat';

import { getTableRowKey } from '../const';

export function useRowSelection(
  propsRef: ComputedRef<BasicTableProps>,
  tableData: Ref<Recordable[]>,
  emit: EmitType,
) {
  const selectedRowKeysRef = ref<number[] | string[]>([]);
  const selectedRowRef = ref<Recordable[]>([]);

  const getRowSelectionRef = computed((): null | TableRowSelection => {
    const { rowSelection, batch, selectionLocked } = unref(propsRef);
    if (!rowSelection) {
      return null;
    }

    return {
      selectedRowKeys: unref(selectedRowKeysRef),
      preserveSelectedRowKeys: true, // 由 clearSelectedOnReload 选项控制是否保留选择项
      onChange: (selectedRowKeys: number[] | string[]) => {
        if (selectionLocked || toValue(batch?.enabled) === false) return;
        setSelectedRowKeys(selectedRowKeys);
      },
      ...omit(rowSelection, ['onChange']),
      getCheckboxProps: (record: Recordable) => {
        const checkboxProps = rowSelection.getCheckboxProps?.(record);
        return {
          ...checkboxProps,
          disabled: !!(
            checkboxProps?.disabled ||
            selectionLocked ||
            toValue(batch?.enabled) === false ||
            batch?.canSelect?.(record) === false
          ),
        };
      },
    };
  });

  watch(
    () => unref(propsRef).rowSelection,
    (selection) => {
      if (!selection) clearSelectedRowKeys();
    },
  );

  watch(
    () => unref(propsRef).rowSelection?.selectedRowKeys,
    (v: any | string[]) => {
      setSelectedRowKeys(v || []);
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
        emit('selection-change', {
          keys: getSelectRowKeys(),
          rows: getSelectRows(),
        });
      });
    },
    { deep: true },
  );

  const getAutoCreateKey = computed(() => {
    return unref(propsRef).autoCreateKey && !unref(propsRef).rowKey;
  });

  const getRowKey = computed(() => {
    const { rowKey } = unref(propsRef);
    return unref(getAutoCreateKey) ? getTableRowKey(propsRef.value) : rowKey;
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
    const allSelectedRows = traverseTreeValues(
      [...toRaw(unref(tableData)), ...toRaw(unref(selectedRowRef))],
      (item) => item,
      {
        childProps: propsRef.value.childrenColumnName ?? 'children',
      },
    );
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
    return unref(getRowSelectionRef);
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
