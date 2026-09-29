import type { ComputedRef, Ref } from 'vue';

import type { ComponentRef, Recordable } from '../types/shared';
import type { BasicTableProps } from '../types/table';

import { computed, h, shallowRef, watchPostEffect } from 'vue';

import { useEventListener } from '@vueuse/core';

import TableFooter from '../components/TableFooter.vue';

export function useTableFooter(
  propsRef: ComputedRef<BasicTableProps>,
  scrollRef: ComputedRef<any>,
  tableRef: Ref<ComponentRef>,
  getDataSourceRef: Ref<Recordable>,
) {
  const body = shallowRef<HTMLElement>();
  const getFooterProps = computed((): Recordable | undefined => {
    const { summaryFunc, showSummary, summaryData } = propsRef.value;
    return showSummary && getDataSourceRef.value?.length
      ? () =>
          h(TableFooter, { summaryFunc, summaryData, scroll: scrollRef.value })
      : undefined;
  });
  watchPostEffect(() => {
    body.value = getFooterProps.value
      ? tableRef.value?.$el?.querySelector(
          '.ant-table-body, .ant-table-content',
        )
      : undefined;
  });
  useEventListener(body, 'scroll', () => {
    const footer = tableRef.value?.$el?.querySelector(
      '.ant-table-footer .ant-table-content',
    );
    if (footer && body.value) footer.scrollLeft = body.value.scrollLeft;
  });
  return { getFooterProps };
}
