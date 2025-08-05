import type { ComputedRef, Ref } from 'vue';

import type { Nullable, Recordable } from '@vben/types';

import type { TableActionType } from '../types/table';
import type { BasicTableProps } from '../types/tableProps';

import { inject, provide } from 'vue';

const key = Symbol('basic-table');

type Instance = TableActionType & {
  getBindValues: ComputedRef<Recordable>;
  wrapRef: Ref<Nullable<HTMLElement>>;
};

export type TableInstance = Omit<Instance, 'getBindValues'> & {
  getBindValues: ComputedRef<BasicTableProps>;
};

export function createTableContext(instance: Instance) {
  provide(key, instance);
}

export function useTableContext(): TableInstance {
  return inject(key) as TableInstance;
}
