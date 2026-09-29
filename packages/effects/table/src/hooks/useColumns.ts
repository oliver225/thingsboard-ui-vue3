import type { ComputedRef, Ref } from 'vue';

import type { PaginationProps } from '../types/pagination';
import type { Recordable } from '../types/shared';
import type {
  BasicColumn,
  BasicTableProps,
  CellFormat,
  GetColumnsParams,
} from '../types/table';

import { h, ref, toRaw, unref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { i18n } from '@vben/locales';
import {
  cloneDeep,
  formatDate as formatToDate,
  isBoolean,
  isEqual,
  isFunction,
  isObject,
  isString,
} from '@vben/utils';

import { useDebounceFn } from '@vueuse/core';

import { renderEditCell } from '../components/editable';
import { DEFAULT_ALIGN, getTableColumnFlags, PAGE_SIZE } from '../const';
import { useDict } from '../dictionary';
import { deepMerge, isArray, isMap } from '../helpers';
import { usePermission } from './useTablePermission';

function handleItem(
  item: BasicColumn,
  ellipsis: boolean,
  columnResizable: boolean,
  dictTypes: Set<string>,
  align: BasicTableProps['align'] = DEFAULT_ALIGN,
) {
  const { key, dataIndex, children } = item;
  item.align = item.align || align;
  if (ellipsis) {
    if (!key) {
      item.key = dataIndex as any;
    }
    if (!isBoolean(item.ellipsis)) {
      Object.assign(item, {
        ellipsis,
      });
    }
  }
  if (columnResizable && item.resizable === undefined) {
    item.resizable = true;
  }
  if (dataIndex && isString(dataIndex) && dataIndex.includes('.')) {
    item.dataIndex = dataIndex.split('.');
    item.dataIndex_ = dataIndex;
  } else if (isArray(dataIndex)) {
    item.dataIndex_ = dataIndex.join('.');
  } else {
    item.dataIndex_ = dataIndex?.toString() || '';
  }
  if (children && children.length > 0) {
    handleChildren(children, ellipsis, columnResizable, dictTypes, align);
  }
  if (item.filterDictType) {
    const { getDictList } = useDict();
    dictTypes.add(item.filterDictType);
    const filterList = getDictList(item.filterDictType);
    item.filters = filterList.map((item) => {
      return { text: item.name, value: item.value };
    });
  }
  if (item.dictType) {
    dictTypes.add(item.dictType);
    // if (!item.slots?.customRender) {
    //   if (!item.slots) {
    //     item.slots = {};
    //   }
    //   item.slots.customRender = 'dictLabelColumn';
    // }
    if (!item.slot) {
      item.slot = 'dictLabelColumn';
    }
  }
}

function handleChildren(
  children: BasicColumn[] | undefined,
  ellipsis: boolean,
  columnResizable: boolean,
  dictTypes: Set<string>,
  align: BasicTableProps['align'] = DEFAULT_ALIGN,
) {
  if (!children) return;
  children.forEach((item) => {
    const { children } = item;
    handleItem(item, ellipsis, columnResizable, dictTypes, align);
    handleChildren(children, ellipsis, columnResizable, dictTypes, align);
  });
}

function handleDragColumn(
  propsRef: ComputedRef<BasicTableProps>,
  columns: BasicColumn[],
) {
  const { canRowDrag, dragColumnProps, isTreeTable } = unref(propsRef);

  if (unref(isTreeTable)) {
    return;
  }

  let pushDragColumns = canRowDrag;

  columns.forEach(() => {
    const dragIndex = columns.findIndex(
      (column) => column.flag === getTableColumnFlags(propsRef.value).drag,
    );
    if (canRowDrag) {
      pushDragColumns = dragIndex === -1;
    } else if (!canRowDrag && dragIndex !== -1) {
      columns.splice(dragIndex, 1);
    }
  });

  if (!pushDragColumns) return;

  columns.unshift({
    flag: getTableColumnFlags(propsRef.value).drag,
    title: '',
    width: 40,
    align: 'center',
    fixed: 'left',
    customRender: () => {
      return h(IconifyIcon, {
        icon: 'ant-design:drag-outlined',
        class: 'cursor-move',
        onMouseenter: (event: any) => {
          event.target.closest('tr').draggable = true;
        },
        onMouseleave: (event: any) => {
          event.target.closest('tr').draggable = false;
        },
      });
    },
    ...dragColumnProps,
  });
}

function handleIndexColumn(
  propsRef: ComputedRef<BasicTableProps>,
  getPaginationRef: ComputedRef<boolean | PaginationProps>,
  columns: BasicColumn[],
) {
  const { t } = i18n.global;

  const { showIndexColumn, indexColumnProps, isTreeTable } = unref(propsRef);

  if (unref(isTreeTable)) {
    return;
  }

  let pushIndexColumns = showIndexColumn;

  columns.forEach(() => {
    const indIndex = columns.findIndex(
      (column) => column.flag === getTableColumnFlags(propsRef.value).index,
    );
    if (showIndexColumn) {
      pushIndexColumns = indIndex === -1;
    } else if (!showIndexColumn && indIndex !== -1) {
      columns.splice(indIndex, 1);
    }
  });

  if (!pushIndexColumns) return;

  // const isFixedLeft = columns.some((item) => item.fixed === 'left');

  columns.unshift({
    flag: getTableColumnFlags(propsRef.value).index,
    title: t('table.index'),
    width: 50,
    align: 'center',
    fixed: 'left',
    customRender: ({ index }) => {
      const getPagination = unref(getPaginationRef);
      if (isBoolean(getPagination)) {
        return `${index + 1}`;
      }
      const {
        current = 1,
        pageSize = getPagination.defaultPageSize ?? PAGE_SIZE,
      } = getPagination;
      return (Math.max(1, current) - 1) * pageSize + index + 1;
    },
    ...indexColumnProps,
  });
}

function handleActionColumn(
  propsRef: ComputedRef<BasicTableProps>,
  columns: BasicColumn[],
) {
  const { actionColumn } = unref(propsRef);
  if (!actionColumn) return;

  const { t } = i18n.global;
  columns.push({
    key: '__tableActions',
    dataIndex: 'actions',
    title: t('table.actions'),
    fixed: 'right',
    slot: 'tableActions',
    align: actionColumn.align ?? 'center',
    width: actionColumn.width ?? 240,
    flag: getTableColumnFlags(propsRef.value).action,
  });
}

function isIfShow(column: BasicColumn): boolean {
  const ifShow = column.ifShow;

  let isIfShow = true;

  if (isBoolean(ifShow)) {
    isIfShow = ifShow;
  }
  if (isFunction(ifShow)) {
    isIfShow = ifShow(column);
  }
  return isIfShow;
}

export function useColumns(
  propsRef: ComputedRef<BasicTableProps>,
  getPaginationRef: ComputedRef<boolean | PaginationProps>,
) {
  const { hasPermission } = usePermission();

  let cacheColumns: BasicColumn[] = unref(propsRef).columns;
  let currentColumns: BasicColumn[] = cacheColumns;

  const getColumnsRef: Ref<BasicColumn[]> = ref([]);
  const getViewColumns: Ref<BasicColumn[]> = ref([]);

  const dictTypesRef: Ref<Set<string>> = ref([] as unknown as Set<string>);
  const updateColumnsDebounceFn = useDebounceFn(updateColumnsRef, 100);

  watch(propsRef, () => updateColumnsDebounceFn());

  function updateColumnsRef() {
    // 保留原始列对象，重新生成操作列，使清除 actionColumn 时也能移除该列。
    const columns = (currentColumns ?? []).filter(
      (column) => column.flag !== getTableColumnFlags(propsRef.value).action,
    );

    handleDragColumn(propsRef, columns);
    handleIndexColumn(propsRef, getPaginationRef, columns);
    handleActionColumn(propsRef, columns);

    const { ellipsis, columnResizable } = unref(propsRef);

    dictTypesRef.value = new Set<string>();
    columns.forEach((item) => {
      // const { customRender, slots } = item;
      handleItem(
        item,
        // Reflect.has(item, 'ellipsis') ? !!item.ellipsis : !!ellipsis && !customRender && !slots,
        Reflect.has(item, 'ellipsis')
          ? !!item.ellipsis
          : !!ellipsis && item.dataIndex !== 'actions', // 自定义渲染列应和非自定义的省略条件一样
        !!columnResizable,
        dictTypesRef.value,
        propsRef.value.align,
      );
    });
    // console.log('column', columns);
    getColumnsRef.value = columns;
    updateViewColumns();
  }

  function updateViewColumns() {
    const viewColumns = sortFixedColumn(unref(getColumnsRef));
    const columns = cloneDeep(viewColumns);
    function buildColumns(columns: BasicColumn[]) {
      return columns
        .filter((column) => {
          return hasPermission(column.auth) && isIfShow(column);
        })
        .map((column, index) => {
          if (column.children) {
            buildColumns(column.children);
          }
          // const { slots, dataIndex, customRender, format, edit, editRow, flag } = column;
          const { customRender, format, edit, editRow, flag } = column;

          // if (!slots || !slots?.title) {
          //  //column.slots = { title: `header-${dataIndex}`, ...(slots || {}) };
          // column.customTitle = column.title as any;
          // Reflect.deleteProperty(column, 'title');
          // }
          const isDefaultAction =
            flag !== undefined &&
            [
              getTableColumnFlags(propsRef.value).action,
              getTableColumnFlags(propsRef.value).index,
            ].includes(flag);
          if (!customRender && format && !edit && !isDefaultAction) {
            column.customRender = ({ text, record, index }) => {
              return formatCell(text, format, record, index, column);
            };
          }

          // edit table
          if ((edit || editRow) && !isDefaultAction) {
            column.customRender = renderEditCell(column);
          }

          // 兼容 customRender 调用
          // customRender 通过 #bodyCell 插槽渲染（替代已废弃的 column.render）
          // if (column.customRender) {
          //   column.render = (value: any, record: Recordable, index: number): VueNode => {
          //     return column.customRender?.({ value, text: value, record, index, renderIndex: index, column });
          //   };
          // }

          column.onHeaderCell = (data: any) =>
            ({
              column: data,
              onResize: (_event: MouseEvent, { size }: any) => {
                // column.width = size.width;
                // data.width = size.width;
                getViewColumns.value = getViewColumns.value.map(
                  (col, colIndex) =>
                    colIndex === index ? { ...col, width: size.width } : col,
                );
              },
            }) as any;

          return column;
        });
    }
    getViewColumns.value = buildColumns(columns) as unknown as BasicColumn[];
  }

  watch(
    () => unref(propsRef).columns,
    (columns) => {
      currentColumns = columns;
      updateColumnsRef();
      cacheColumns = columns?.filter((item) => !item.flag) ?? [];
    },
    { immediate: true }, // 不使用 useTable 的时候，需要主动初始化
  );

  // function setCacheColumnsByField(dataIndex: string | undefined, value: Partial<BasicColumn>) {
  //   if (!dataIndex || !value) {
  //     return;
  //   }
  //   cacheColumns.forEach((item) => {
  //     if (item.dataIndex_ === dataIndex) {
  //       Object.assign(item, value);
  //       return;
  //     }
  //   });
  // }

  /**
   * set columns
   * @param columnList key｜column
   */
  function setColumns(
    columnList: (string | string[])[] | Partial<BasicColumn>[],
  ) {
    const columns = cloneDeep(columnList);
    if (!isArray(columns)) return;

    if (columns.length <= 0) {
      currentColumns = [];
      updateColumnsRef();
      return;
    }

    const firstColumn = columns[0];
    const cacheKeys = cacheColumns.map((item) => item.dataIndex_);

    if (!isString(firstColumn) && !isArray(firstColumn)) {
      currentColumns = columns as BasicColumn[];
    } else {
      const columnKeys = (columns as (string | string[])[]).map((m) =>
        m.toString(),
      );
      const newColumns: BasicColumn[] = [];
      cacheColumns.forEach((item) => {
        const column = {
          ...item,
          defaultHidden: !columnKeys.includes(
            item.dataIndex_ || (item.key as string),
          ),
        };
        currentColumns.forEach((item) => {
          if (column.dataIndex_ === item.dataIndex_ && item.fixed) {
            column.fixed = item.fixed;
          }
        });
        newColumns.push(column);
      });
      // Sort according to another array
      if (!isEqual(cacheKeys, columns)) {
        newColumns.sort((prev, next) => {
          return (
            columnKeys.indexOf(prev.dataIndex_ as string) -
            columnKeys.indexOf(next.dataIndex_ as string)
          );
        });
      }
      currentColumns = newColumns;
    }
    updateColumnsRef();
  }

  function updateColumn(data: Partial<BasicColumn> | Partial<BasicColumn>[]) {
    let updateData: Partial<BasicColumn>[] = [];
    if (isObject(data)) {
      updateData.push(data as BasicColumn);
    }
    if (isArray(data)) {
      updateData = [...data];
    }
    const hasDataIndex = updateData.every(
      (item) => Reflect.has(item, 'dataIndex') && item.dataIndex,
    );
    if (!hasDataIndex) {
      console.error('必须包含 dataIndex 字段。');
      return;
    }

    currentColumns = currentColumns.map((column) => {
      const update = updateData.find(
        (item) => String(item.dataIndex) === String(column.dataIndex_),
      );
      return update ? deepMerge(column, update) : column;
    });
    updateColumnsRef();
  }

  function getColumns(opt?: GetColumnsParams) {
    const { ignoreIndex, ignoreAction, sort } = opt || {};
    let columns = toRaw(unref(getColumnsRef));
    if (ignoreIndex) {
      columns = columns.filter(
        (item) => item.flag !== getTableColumnFlags(propsRef.value).index,
      );
    }
    if (ignoreAction) {
      columns = columns.filter(
        (item) => item.flag !== getTableColumnFlags(propsRef.value).action,
      );
    }

    if (sort) {
      columns = sortFixedColumn(columns);
    }

    return columns;
  }
  function getCacheColumns() {
    return cacheColumns;
  }

  return {
    getColumnsRef,
    getCacheColumns,
    getColumns,
    setColumns,
    updateColumn,
    getViewColumns,
    // setCacheColumnsByField,
    dictTypesRef,
  };
}

function sortFixedColumn(columns: BasicColumn[]) {
  const fixedLeftColumns: BasicColumn[] = [];
  const fixedRightColumns: BasicColumn[] = [];
  const defColumns: BasicColumn[] = [];
  for (const column of columns) {
    if (column.fixed === 'left') {
      fixedLeftColumns.push(column);
      continue;
    }
    if (column.fixed === 'right') {
      fixedRightColumns.push(column);
      continue;
    }
    defColumns.push(column);
  }
  return [...fixedLeftColumns, ...defColumns, ...fixedRightColumns].filter(
    (item) => !item.defaultHidden,
  );
}

// format cell
export function formatCell(
  text: string,
  format: CellFormat,
  record: Recordable,
  index: number,
  column: BasicColumn,
) {
  if (!format) {
    return text;
  }

  // custom function
  if (isFunction(format)) {
    return format(text, record, index, column);
  }

  try {
    // date type
    const DATE_FORMAT_PREFIX = 'date|';
    if (isString(format) && format.startsWith(DATE_FORMAT_PREFIX) && text) {
      const dateFormat = format.replace(DATE_FORMAT_PREFIX, '');

      if (!dateFormat) {
        return text;
      }
      return formatToDate(text, dateFormat);
    }

    // Map
    if (isMap(format)) {
      return format.get(text);
    }
  } catch {
    return text;
  }
}
