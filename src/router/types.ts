import type { RouteRecordRaw, RouteMeta } from 'vue-router';
import { defineComponent } from 'vue';
import { Authority } from '/@/enums/authorityEnum';

export type Component<T = any> =
  | ReturnType<typeof defineComponent>
  // | (() => Promise<typeof import('*.vue')>)
  | (() => Promise<T>);

// @ts-ignore
export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta'>, Menu {
  name: string;
  meta: RouteMeta;
  component?: Component | string;
  components?: Component;
  children?: AppRouteRecordRaw[];
  props?: Recordable;
  fullPath?: string;
}

export interface MenuTag {
  type?: 'primary' | 'error' | 'warn' | 'success';
  content?: string;
  dot?: boolean;
}

export interface Menu {
  name: string;

  icon?: string;

  color?: string;

  path: string;

  target?: string;

  // path contains param, auto assignment.
  paramPath?: string;

  disabled?: boolean;

  children?: Menu[];

  orderNo?: number;

  roles?: Authority[];

  meta?: Partial<RouteMeta>;

  tag?: MenuTag;

  hideMenu?: boolean;
}

export interface MenuModule {
  orderNo?: number;
  menu: Menu;
}

// export type AppRouteModule = RouteModule | AppRouteRecordRaw;
export type AppRouteModule = AppRouteRecordRaw;
