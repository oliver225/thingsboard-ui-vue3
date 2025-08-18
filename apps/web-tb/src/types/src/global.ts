import type { JSX } from 'vue/jsx-runtime';

import type { VNodeChild, PropType as VuePropType } from 'vue';

declare global {
  type PropType<T> = VuePropType<T>;
  type VueNode = JSX.Element | VNodeChild;

  interface Fn<T = any, R = T> {
    (...arg: T[]): R;
  }

  interface PromiseFn<T = any, R = T> {
    (...arg: T[]): Promise<R>;
  }

  type LabelValueOptions = {
    [key: string]: boolean | number | string;
    label: string;
    value: any;
  }[];

  interface EntityId<T> {
    entityType?: T;
    id: string;
  }
}
