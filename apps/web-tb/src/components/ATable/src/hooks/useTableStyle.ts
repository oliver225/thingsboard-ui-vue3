import type { ComputedRef } from 'vue';

import type { TableCustomRecord } from '../types/table';
import type { BasicTableProps } from '../types/tableProps';

import { unref } from 'vue';

import { isFunction } from '@vben/utils';

export function useTableStyle(
  propsRef: ComputedRef<BasicTableProps>,
  prefixCls: string,
) {
  function getRowClassName(record: TableCustomRecord, index: number) {
    const { striped, rowClassName } = unref(propsRef);
    const classNames: string[] = [];
    if (striped) {
      classNames.push(
        (index || 0) % 2 === 1 ? `${prefixCls}-row__striped` : '',
      );
    }
    if (rowClassName && isFunction(rowClassName)) {
      classNames.push(rowClassName(record, index));
    }
    return classNames.filter((cls) => !!cls).join(' ');
  }

  return { getRowClassName };
}
