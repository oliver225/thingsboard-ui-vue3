import type { ComponentPublicInstance } from 'vue';

import type {
  AnyFunction,
  Nullable as VbenNullable,
  Recordable as VbenRecordable,
} from '@vben/types';

/** Default generic signatures, backed by the workspace utility types. */
export type Recordable<T = any> = VbenRecordable<T>;
export type Nullable<T> = VbenNullable<T>;
export type Fn<T = any, R = T> = AnyFunction<T[], R>;
export type EmitType = (event: any, ...args: any[]) => void;
export type ComponentRef =
  | (ComponentPublicInstance & Record<string, any>)
  | null;
export type ElRef<T extends HTMLElement = HTMLDivElement> = null | T;
export type ChangeEvent = Event & { target: HTMLInputElement };
