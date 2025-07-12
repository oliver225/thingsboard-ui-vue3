import type { Ref } from 'vue';

import type { Nullable } from '@vben-core/typings';

interface ComponentElRef<T extends HTMLElement = HTMLDivElement> {
  $el: T;
}

type ComponentRef<T extends HTMLElement = HTMLDivElement> =
  | ComponentElRef<T>
  | HTMLElement
  | null
  | Ref<Nullable<HTMLElement>, Nullable<HTMLElement>>;

export type { ComponentElRef, ComponentRef };
