import type { ComputedRef, Ref } from 'vue';

import type { Nullable, Recordable } from '../types/shared';
import type { BasicTableProps, TableActionType } from '../types/table';

import { getCurrentInstance, inject, provide } from 'vue';

const key = Symbol('basic-table');

type Instance = TableActionType & {
  wrapRef: Ref<Nullable<HTMLElement>>;
  getProps: ComputedRef<Recordable>;
  getBindValues: ComputedRef<Recordable>;
};

export type TableInstance = Omit<Instance, 'getBindValues' | 'getProps'> & {
  getProps: ComputedRef<BasicTableProps>;
  getBindValues: ComputedRef<Recordable>;
};

// Module-level cache for use outside of setup context (e.g., in render callbacks)
let cachedInstance: Instance | null = null;

export function createTableContext(instance: Instance) {
  cachedInstance = instance;
  provide(key, instance);
}

export function useTableContext(): TableInstance {
  // When called inside setup() or functional component, use inject()
  if (getCurrentInstance()) {
    return inject(key) as TableInstance;
  }
  // When called outside setup context (e.g., in render callbacks),
  // fall back to the module-level cached instance to avoid the warning:
  // "inject() can only be used inside setup() or functional components"
  return cachedInstance as TableInstance;
}
