import type { MaybeRef } from 'vue';

import { unref } from 'vue';

import { merge } from 'es-toolkit/compat';

/** Preserve the mutating merge behavior for reactive column definitions. */
export function deepMerge<T = any>(source: any = {}, updates: any = {}): T {
  return merge(source, updates);
}

export function getDynamicProps<T, U>(props: T): Partial<U> {
  return Object.fromEntries(
    Object.entries(props as object).map(([key, value]) => [
      key,
      unref(value as MaybeRef<unknown>),
    ]),
  ) as Partial<U>;
}

export function getPopupContainer(node?: HTMLElement): HTMLElement {
  return node?.parentElement ?? document.body;
}

export const isArray = Array.isArray;
export const isDef = <T>(value: T | undefined): value is T =>
  value !== undefined;
export const isMap = (value: unknown): value is Map<unknown, unknown> =>
  value instanceof Map;
export const isNullAndUnDef = (value: unknown): value is null | undefined =>
  value === null || value === undefined;
