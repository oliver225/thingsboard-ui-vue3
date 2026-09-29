import type { ComputedRef } from 'vue';

import type { PaginationProps } from '../types/pagination';
import type { BasicTableProps } from '../types/table';

import { computed, ref, unref, watch } from 'vue';

import { i18n } from '@vben/locales';
import { isBoolean, isEqual } from '@vben/utils';

import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../const';

// interface ItemRender {
//   page: number;
//   type: 'page' | 'prev' | 'next';
//   originalElement: any;
// }

// function itemRender({ page, type, originalElement }: ItemRender) {
//   if (type === 'prev') {
//     return page === 0 ? null : <LeftOutlined />;
//   } else if (type === 'next') {
//     return page === 1 ? null : <RightOutlined />;
//   }
//   return originalElement;
// }

export function usePagination(refProps: ComputedRef<BasicTableProps>) {
  const { t } = i18n.global;

  const configRef = ref<PaginationProps>({});
  const show = ref(true);

  watch(
    () => unref(refProps).pagination,
    (pagination, previous) => {
      if (!pagination || isBoolean(pagination)) return;

      const previousConfig = previous && !isBoolean(previous) ? previous : {};
      const overrides = { ...unref(configRef) };
      // Only changed options replace runtime state. Density and other table
      // updates must preserve the user's current page and selected page size.
      for (const key of Object.keys(pagination) as (keyof PaginationProps)[]) {
        if (!isEqual(pagination[key], previousConfig[key])) {
          Reflect.deleteProperty(overrides, key);
        }
      }
      configRef.value = overrides;
    },
    { flush: 'sync' },
  );

  const getPaginationInfo = computed((): boolean | PaginationProps => {
    const { pagination } = unref(refProps);

    if (!unref(show) || (isBoolean(pagination) && !pagination)) {
      return false;
    }

    return {
      current: 1,
      // pageSize: PAGE_SIZE, // 注释掉，否则 pagination: {defaultPageSize: 10 } 不生效
      size: 'small',
      defaultPageSize: PAGE_SIZE,
      showTotal: (total) => t('table.total', { total }),
      showSizeChanger: true,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      showQuickJumper: true,
      // itemRender: itemRender,
      ...(isBoolean(pagination) ? {} : pagination),
      ...unref(configRef),
    };
  });

  function setPagination(info: Partial<PaginationProps>) {
    configRef.value = {
      ...unref(configRef),
      ...info,
    };
  }

  function getPagination() {
    return unref(getPaginationInfo);
  }

  function getShowPagination() {
    return unref(show);
  }

  function setShowPagination(flag: boolean) {
    show.value = flag;
  }

  return {
    getPagination,
    getPaginationInfo,
    setShowPagination,
    getShowPagination,
    setPagination,
  };
}
