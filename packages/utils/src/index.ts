import { isObject } from 'lodash-es';

export * from './helpers';
export * from '@vben-core/shared/cache';
export * from '@vben-core/shared/color';
export * from '@vben-core/shared/utils';

export { default as clone } from 'lodash-es/clone';
export { default as cloneDeep } from 'lodash-es/cloneDeep';
export { default as object } from 'lodash-es/object';
export { default as omit } from 'lodash-es/omit';
export { default as uniqBy } from 'lodash-es/uniqBy';

export function deepMerge<T = any>(src: any = {}, target: any = {}): T {
  let key: string;
  for (key in target) {
    src[key] = isObject(src[key])
      ? deepMerge(src[key], target[key])
      : (src[key] = target[key]);
  }
  return src;
}
