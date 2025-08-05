/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author Vben、ThinkGem
 */
import type { ComputedRef, Ref } from 'vue';

import type { AnyNormalFunction, EmitType, Recordable } from '@vben/types';

import type { BasicTableProps } from '../types/tableProps';

import { computed, ref, toRaw, unref } from 'vue';

import { isEmpty, isFunction } from '@vben/utils';

import { ROW_KEY } from '../const';

export function useTableExpand(
  propsRef: ComputedRef<BasicTableProps>,
  tableData: Ref<Recordable[]>,
  getFormData: AnyNormalFunction,
  emit: EmitType,
  setLoading: AnyNormalFunction,
) {
  const expandedRowKeys = ref<string[]>([]);
  const currentLevel = ref(0);

  const getChildrenColumnName = computed(() => {
    const { childrenColumnName } = unref(propsRef);
    return childrenColumnName || 'children';
  });

  const getAutoCreateKey = computed(() => {
    return unref(propsRef).autoCreateKey && !unref(propsRef).rowKey;
  });

  const getRowKey = computed(() => {
    const { rowKey } = unref(propsRef);
    return unref(getAutoCreateKey) ? ROW_KEY : rowKey;
  });

  const getExpandOption = computed(() => {
    const { isTreeTable } = unref(propsRef);
    if (!isTreeTable) return {};

    return {
      expandedRowKeys: unref(expandedRowKeys),
      onExpandedRowsChange: (keys: string[]) => {
        expandedRowKeys.value = keys;
        emit('expanded-rows-change', keys);
      },
    };
  });

  function expandAll() {
    setLoading(true);
    setTimeout(async () => {
      try {
        const keys = getAllKeys();
        expandedRowKeys.value = keys;
      } finally {
        setLoading(false);
      }
    });
  }

  function expandRows(keys: string[]) {
    // use row ID expands the specified table row
    const { isTreeTable } = unref(propsRef);
    if (!isTreeTable) return;
    expandedRowKeys.value = [...expandedRowKeys.value, ...keys];
  }

  function getAllKeys(data?: Recordable[]) {
    const keys: string[] = [];
    toRaw(data || unref(tableData)).forEach((item) => {
      keys.push(item[unref(getRowKey) as string]);
      const children = item[unref(getChildrenColumnName)];
      if (children?.length) {
        keys.push(...getAllKeys(children));
      }
    });
    return keys;
  }

  async function expandOneLevel(data?: Recordable[], treeLevel = 0) {
    const rowKey = unref(getRowKey) as string;
    for (const record of toRaw(data || tableData.value)) {
      await expandCollapse(record, true);
      expandedRowKeys.value.push(record[rowKey]);
      if (treeLevel < currentLevel.value) {
        const children = record[unref(getChildrenColumnName)];
        if (children?.length > 0) {
          await expandOneLevel(children, treeLevel + 1);
        }
      }
    }
  }

  function collapseAll() {
    expandedRowKeys.value = [];
    currentLevel.value = 0;
  }

  async function expandCollapse(
    record: Recordable,
    onlyLoadData = false,
    forceLoad = false,
  ) {
    const treeLeaf = record.treeLeaf && record.treeLeaf === '1';
    if (
      (!treeLeaf && isEmpty(record[unref(getChildrenColumnName)])) ||
      forceLoad
    ) {
      record.isLoading = true;
      const { api, pagination } = unref(propsRef);
      if (!api || !isFunction(api)) return;
      const rowKey = unref(getRowKey) as string;
      let list = await api({
        parentCode: record[rowKey] as string,
        status: forceLoad ? '' : getFormData()?.status,
      });
      if (pagination && list.list) {
        list = list.list;
      }
      if (list && list.length > 0) {
        record.childList = list;
        record.treeLeaf = '0';
      } else {
        record.childList = [];
        record.treeLeaf = '1';
      }
      record.isLoading = false;
    }
    if (!onlyLoadData) {
      let expanded = true;
      const rowKey = unref(getRowKey) as string;
      for (const index in expandedRowKeys.value) {
        if (record[rowKey] === expandedRowKeys.value[index]) {
          expandedRowKeys.value.splice(index as unknown as number, 1);
          expanded = false;
          break;
        }
      }
      if (forceLoad) {
        expanded = true;
      }
      if (expanded) {
        expandedRowKeys.value.push(record[unref(getRowKey) as string]);
      }
      return expanded;
    }
  }

  return {
    getExpandOption,
    expandAll,
    expandRows,
    collapseAll,
    expandCollapse,
  };
}
