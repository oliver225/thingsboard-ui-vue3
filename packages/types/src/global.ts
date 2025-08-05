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

type LabelValueOptions = {
  [key: string]: boolean | number | string;
  label: string;
  value: any;
}[];

type TargetContext = '_blank' | '_self';

interface ComponentElRef<T extends HTMLElement = HTMLDivElement> {
  $el: T;
}

export type { ComponentElRef, ComponentRef, LabelValueOptions, TargetContext };
