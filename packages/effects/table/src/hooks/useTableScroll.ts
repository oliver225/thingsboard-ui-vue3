import type { ComputedRef, Ref } from 'vue';

import type { ComponentRef, Recordable } from '../types/shared';
import type {
  BasicColumn,
  BasicTableProps,
  TableRowSelection,
} from '../types/table';

import {
  computed,
  nextTick,
  onActivated,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue';

import {
  useDebounceFn,
  useEventListener,
  useResizeObserver,
  useScroll,
} from '@vueuse/core';

export function useTableScroll(
  propsRef: ComputedRef<BasicTableProps>,
  tableRef: Ref<ComponentRef>,
  columnsRef: Ref<BasicColumn[]>,
  rowSelectionRef: ComputedRef<null | TableRowSelection>,
  getDataSourceRef: Ref<Recordable[]>,
  wrapRef: Ref<HTMLElement | null>,
) {
  const tableHeightRef = ref<number | string | undefined>(167);

  const getCanResize = computed(() => {
    const { canResize, scroll } = unref(propsRef);
    return canResize && !(scroll || {}).y;
  });

  const tableScrollRef = ref();
  const { y: tableScrollRefY } = useScroll(tableScrollRef);

  function calcTableHeight() {
    const tableEl = unref(tableRef)?.$el as HTMLElement | undefined;
    const wrapper = unref(wrapRef);
    if (!tableEl || !wrapper) return;

    const bodyEl = tableEl.querySelector<HTMLElement>(
      '.ant-table-body, .ant-table-content',
    );
    if (!bodyEl || !unref(getCanResize)) return;
    tableScrollRef.value = bodyEl;

    const {
      resizeHeightOffset = 0,
      maxHeight,
      minHeight,
      isCanResizeParent,
    } = unref(propsRef);
    const pageContent = wrapper.closest<HTMLElement>(
      '[data-layout-region="page-content"]',
    );
    const boundary = isCanResizeParent ? wrapper : pageContent;
    const boundaryStyle = boundary ? getComputedStyle(boundary) : undefined;
    const bottom = boundary
      ? boundary.getBoundingClientRect().bottom -
        Number.parseFloat(boundaryStyle?.paddingBottom || '0') -
        Number.parseFloat(boundaryStyle?.borderBottomWidth || '0')
      : document.documentElement.clientHeight;

    // Measure all space outside the scrolling body, including the header,
    // footer, pagination margins, and card padding, instead of guessing offsets.
    const tableRect = tableEl.getBoundingClientRect();
    const bodyRect = bodyEl.getBoundingClientRect();
    const chromeHeight = tableRect.height - bodyRect.height;
    const available = Math.max(
      0,
      Math.floor(bottom - tableRect.top - chromeHeight - resizeHeightOffset),
    );
    let height = available;
    if (minHeight) height = Math.max(height, minHeight);
    if (maxHeight) height = Math.min(height, maxHeight);
    // A small viewport must scroll inside the table, never expand the card.
    height = Math.min(height, available);
    tableHeightRef.value = height;
    bodyEl.style.height = `${height}px`;
    bodyEl.scrollTop = tableScrollRefY.value;

    tableEl.classList.toggle(
      'hide-scrollbar-y',
      bodyEl.scrollHeight <= bodyEl.clientHeight,
    );
    tableEl.classList.toggle(
      'hide-scrollbar-x',
      bodyEl.scrollWidth <= bodyEl.clientWidth,
    );
  }
  function redoHeight() {
    nextTick(() => {
      calcTableHeight();
    }).then();
  }

  watch(
    () => [unref(getCanResize), unref(getDataSourceRef)?.length],
    () => {
      calcTableHeight();
    },
    { flush: 'post' },
  );

  // Query controls and illustration slots can change height without resizing the card.
  useResizeObserver(
    () =>
      wrapRef.value?.querySelector<HTMLElement>(
        '.tb-basic-table-header-container',
      ),
    useDebounceFn(calcTableHeight, 50),
  );

  const tableWidthRef = ref(0);

  function calcTableWidth() {
    const tableEl = unref(tableRef)?.$el as HTMLElement | undefined;
    const container = tableEl?.querySelector<HTMLElement>(
      '.ant-table-container',
    );
    tableWidthRef.value = container?.clientWidth ?? 0;
  }

  useResizeObserver(
    wrapRef,
    useDebounceFn(() => {
      calcTableWidth();
      calcTableHeight();
    }, 100),
  );
  watch(() => [propsRef.value.size, propsRef.value.fontSize], redoHeight, {
    flush: 'post',
  });

  function measureTable() {
    calcTableHeight();
    calcTableWidth();
  }
  onMounted(measureTable);
  onActivated(measureTable);

  useEventListener(window, 'resize', useDebounceFn(measureTable, 200));

  const getScrollRef: ComputedRef<any> = computed(() => {
    const selection = unref(rowSelectionRef);
    let width = selection
      ? Number.parseFloat(String(selection.columnWidth ?? 32))
      : 0;
    const columns = unref(columnsRef).filter((item) => !item.defaultHidden);
    columns.forEach((item) => {
      const columnWidth = Number.parseFloat(
        String(item.width ?? item.minWidth ?? 0),
      );
      if (Number.isFinite(columnWidth)) width += columnWidth;
    });
    const tableWidth = tableWidthRef.value;
    const { canResize, scroll } = unref(propsRef);
    return {
      x: tableWidth > 0 && width > tableWidth ? width : undefined,
      y: canResize ? unref(tableHeightRef) : undefined,
      scrollToFirstRowOnChange: true,
      ...scroll,
      // Empty tables have no body rows to measure the fixed header's colgroup.
      // Keep header and placeholder in one table to avoid a stretched scrollbar column.
      ...(unref(getDataSourceRef).length === 0 ? { y: undefined } : {}),
    };
  });

  return { getScrollRef, redoHeight };
}
