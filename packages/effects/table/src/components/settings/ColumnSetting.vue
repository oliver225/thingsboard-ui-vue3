<script lang="ts" setup name="ColumnSetting">
import type { BasicColumn, ColumnChangeParam } from '../../types/table';

import {
  computed,
  isVNode,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  toRefs,
  unref,
  useAttrs,
  watch,
  watchEffect,
} from 'vue';

import { useSortable } from '@vben/hooks';
import { IconifyIcon, Settings } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep, isFunction } from '@vben/utils';

import {
  VbenIconButton,
  VbenScrollbar,
  VbenTooltip,
} from '@vben-core/shadcn-ui';

import { DragOutlined } from '@antdv-next/icons';
import {
  Button as AButton,
  Checkbox,
  CheckboxGroup,
  Divider,
  Popover,
  Tooltip,
} from 'antdv-next';
import { omit } from 'es-toolkit/compat';

import {
  getPopupContainer as getParentContainer,
  isNullAndUnDef,
} from '../../helpers';
import { useTableContext } from '../../hooks/useTableContext';

interface State {
  isInit?: boolean;
  checkAll: boolean;
  checkIndex: boolean;
  checkSelect: boolean;
  checkOptions: Options[];
  checkedList: string[];
  fixedList: any[];
}

interface Options extends BasicColumn {
  label: string;
  value: string;
  fixed?: 'end' | 'left' | 'right' | 'start' | boolean;
}

const emit = defineEmits(['columnsChange']);
const attrs = useAttrs();

const table = useTableContext();

const initialSelection = table.getDefaultRowSelection();
const defaultRowSelection = initialSelection
  ? omit(initialSelection, 'selectedRowKeys')
  : undefined;
const columnListRef = shallowRef<InstanceType<typeof CheckboxGroup>>();
const cacheCheckIndex = ref<boolean>(true);
const cacheCheckSelect = ref<boolean>(false);
const cacheCheckList = ref<string[]>([]);
const cacheCheckOptions = ref<Options[]>([]);

let isInitSortable = false;
let sortable: undefined | { destroy: () => void };
onBeforeUnmount(() => sortable?.destroy());

const state = reactive<State>({
  checkAll: true,
  checkIndex: true,
  checkSelect: false,
  checkOptions: [],
  checkedList: [],
  fixedList: [],
});

const { checkAll, checkIndex, checkSelect, checkOptions, checkedList } =
  toRefs(state);

watchEffect(() => {
  setTimeout(() => {
    // const columns = table.getColumns(); // 去掉长度判断，如果初始化状态没有列，就不会显示设置列
    if (/* columns.length && */ !state.isInit) {
      init();
    }
  }, 500); // 晚加载一点，防止 useTable 设置 showIndexColumn: false 时，存储的 序号 未生效
});

watch(
  [
    () => unref(table?.getProps)?.showIndexColumn,
    () => unref(table?.getProps)?.rowSelection,
  ],
  () => {
    const values = unref(table?.getProps) || {};
    state.checkIndex = !!values?.showIndexColumn;
    state.checkSelect = !!values?.rowSelection;
  },
  { immediate: true },
);

const isTreeTable = computed(() => unref(table?.getProps)?.isTreeTable);

function getColumns() {
  const ret: Options[] = [];
  table
    .getColumns({ ignoreIndex: true, ignoreAction: true })
    .forEach((item) => {
      ret.push({
        label: item.title as string /* || (item.customTitle as string)*/,
        value: (item.dataIndex_ || item.title) as string,
        ...item,
      });
    });
  return ret;
}

function init() {
  const values = unref(table?.getProps) || {};
  cacheCheckIndex.value = !!values.showIndexColumn;
  cacheCheckSelect.value = !!values.rowSelection;

  const columns = getColumns();

  const checkList = table
    .getColumns({ ignoreIndex: true, ignoreAction: true })
    .map((item) => {
      if (item.defaultHidden) {
        return '';
      }
      return item.dataIndex_ || item.title;
    })
    .filter(Boolean) as string[];

  if (state.checkOptions.length === 0) {
    state.checkOptions = columns;
    cacheCheckOptions.value = columns;
    cacheCheckList.value = checkList;
  } else {
    // const fixedColumns = columns.filter((item) =>
    //   Reflect.has(item, 'fixed')
    // ) as BasicColumn[];
    state.checkOptions.forEach((item: BasicColumn) => {
      const findItem = columns.find(
        (col: BasicColumn) => col.dataIndex_ === item.dataIndex_,
      );
      if (findItem) {
        item.fixed = findItem.fixed;
      }
    });
  }
  state.checkedList = checkList;
  state.fixedList = [];
  state.isInit = true;
}

function onCheckAllChange(e: any) {
  const list = state.checkOptions.map((item) => item.value);
  if (e.target.checked) {
    state.checkedList = list;
    setColumns(list);
  } else {
    state.checkedList = [];
    setColumns([]);
  }
}

const indeterminate = computed(() => {
  const len = state.checkOptions.length;
  const checkedLen = state.checkedList.length;
  if (checkedLen === len) return undefined;
  return checkedLen >= 0 && checkedLen < len;
});

function onChange(checkedListInput: any | string[]) {
  const len = state.checkOptions.length;
  state.checkAll = checkedListInput.length === len && len > 0;
  const sortList = state.checkOptions.map((item) => item.value);
  if (Array.isArray(checkedListInput)) {
    checkedListInput.sort((prev: string, next: string) => {
      return sortList.indexOf(prev) - sortList.indexOf(next);
    });
  }
  setColumns(checkedListInput);
}

function reset() {
  state.checkAll = true;
  table.setProps({
    showIndexColumn: unref(cacheCheckIndex),
    rowSelection: unref(cacheCheckSelect) ? defaultRowSelection : null,
  });
  state.checkOptions = cloneDeep(unref(cacheCheckOptions));
  state.checkedList = cloneDeep(unref(cacheCheckList));
  state.fixedList = [];
  setColumns(table.getCacheColumns(), true);
}

function handleOpenChange() {
  if (isInitSortable) return;
  nextTick(async () => {
    const columnListEl = unref(columnListRef);
    if (!columnListEl) return;
    const el = columnListEl.$el as any;
    if (!el) return;
    const { initializeSortable } = useSortable(el, {
      animation: 500,
      delay: 400,
      delayOnTouchOnly: true,
      handle: '.table-column-drag-icon ',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (
          isNullAndUnDef(oldIndex) ||
          isNullAndUnDef(newIndex) ||
          oldIndex === newIndex
        ) {
          return;
        }
        const columns = cloneDeep(state.checkOptions);

        const movedColumn = columns[oldIndex];
        if (!movedColumn) return;
        if (oldIndex > newIndex) {
          columns.splice(newIndex, 0, movedColumn);
          columns.splice(oldIndex + 1, 1);
        } else {
          columns.splice(newIndex + 1, 0, movedColumn);
          columns.splice(oldIndex, 1);
        }

        state.checkOptions = columns;

        setColumns(
          columns
            .map((col: Options) => col.value)
            .filter((value: string) => state.checkedList.includes(value)),
        );
      },
    });
    sortable = await initializeSortable();
    isInitSortable = true;
  });
}

function handleIndexCheckChange(e: any) {
  table.setProps({
    showIndexColumn: e.target.checked,
  });
}

function handleSelectCheckChange(e: any) {
  table.setProps({
    rowSelection: e.target.checked ? defaultRowSelection : null,
  });
}

function handleColumnFixed(option: Options, fixed?: 'left' | 'right') {
  if (!state.checkedList.includes(option.value)) return;
  const item = getColumns().find(
    (column) => column.dataIndex_ === option.value,
  );
  if (!item) return;
  option.fixed = item.fixed === fixed ? false : fixed;

  const columns = getColumns() as BasicColumn[];
  const isFixed = item.fixed === fixed ? false : fixed;
  const column = columns.find((col) => col.dataIndex_ === item.dataIndex_);
  if (column) {
    column.fixed = isFixed;
  }
  item.fixed = isFixed;

  if (isFixed && !item.width) {
    item.width = 100;
  }

  const fixedIndex = state.fixedList.findIndex(
    (col) => col.dataIndex_ === item.dataIndex_,
  );
  if (fixedIndex === -1) {
    state.fixedList.push(item);
  } else {
    state.fixedList[fixedIndex] = item;
  }

  setColumns(columns);
}

function setColumns(columns: BasicColumn[] | string[], _resetVal = false) {
  table.setColumns(columns);

  const data: ColumnChangeParam[] = state.checkOptions.map((col) => {
    const open = columns.some(
      (c: BasicColumn | string) =>
        c === col.value ||
        (typeof c !== 'string' &&
          c.dataIndex_ === col.value &&
          !c.defaultHidden),
    );
    return { dataIndex_: col.value, fixed: col.fixed, open };
  });
  emit('columnsChange', data);
}

function getPopupContainer() {
  return isFunction(attrs.getPopupContainer)
    ? attrs.getPopupContainer()
    : getParentContainer();
}
</script>
<template>
  <VbenTooltip side="top">
    {{ $t('table.settingColumn') }}
    <template #trigger>
      <VbenIconButton
        class="hover:animate-[shrink_0.3s_ease-in-out] rounded-md"
      >
        <Popover
          placement="bottomLeft"
          trigger="click"
          @open-change="handleOpenChange"
          :classes="{ container: 'tb-basic-column-setting__cloumn-list' }"
          :get-popup-container="getPopupContainer"
        >
          <template #title>
            <div class="tb-basic-column-setting__popover-title">
              <Checkbox
                :indeterminate="indeterminate"
                v-model:checked="checkAll"
                @change="onCheckAllChange"
              >
                {{ $t('table.settingColumnShow') }}
              </Checkbox>

              <Checkbox
                v-model:checked="checkIndex"
                @change="handleIndexCheckChange"
                v-if="!isTreeTable"
              >
                {{ $t('table.settingIndexColumnShow') }}
              </Checkbox>

              <Checkbox
                v-model:checked="checkSelect"
                @change="handleSelectCheckChange"
                :disabled="!defaultRowSelection"
              >
                {{ $t('table.settingSelectColumnShow') }}
              </Checkbox>

              <AButton size="small" type="link" @click="reset">
                {{ $t('common.reset') }}
              </AButton>
            </div>
          </template>
          <template #content>
            <VbenScrollbar class="scrollbar">
              <CheckboxGroup
                v-model:value="checkedList"
                @change="onChange"
                ref="columnListRef"
              >
                <template v-for="item in checkOptions" :key="item.value">
                  <div
                    class="tb-basic-column-setting__check-item"
                    v-if="!('ifShow' in item && !item.ifShow)"
                  >
                    <DragOutlined class="table-column-drag-icon" />
                    <Checkbox :value="item.value">
                      <template v-if="Array.isArray(item.label)">
                        <component
                          v-for="(node, i) in item.label"
                          :is="node"
                          :key="i"
                        />
                      </template>
                      <template v-else-if="isVNode(item.label)">
                        <component :is="item.label" />
                      </template>
                      <template v-else>
                        {{ item.label }}
                      </template>
                    </Checkbox>
                    <Tooltip
                      placement="left"
                      :mouse-leave-delay="0.4"
                      :get-popup-container="getPopupContainer"
                    >
                      <template #title>
                        {{ $t('table.settingFixedLeft') }}
                      </template>
                      <IconifyIcon
                        icon="line-md:arrow-align-left"
                        class="tb-basic-column-setting__fixed-left"
                        :class="[
                          {
                            active: item.fixed === 'left',
                            disabled: !checkedList.includes(item.value),
                          },
                        ]"
                        @click="handleColumnFixed(item, 'left')"
                      />
                    </Tooltip>
                    <Divider type="vertical" />
                    <Tooltip
                      placement="right"
                      :mouse-leave-delay="0.4"
                      :get-popup-container="getPopupContainer"
                    >
                      <template #title>
                        {{ $t('table.settingFixedRight') }}
                      </template>
                      <IconifyIcon
                        icon="line-md:arrow-align-right"
                        class="tb-basic-column-setting__fixed-right"
                        :class="[
                          {
                            active: item.fixed === 'right',
                            disabled: !checkedList.includes(item.value),
                          },
                        ]"
                        @click="handleColumnFixed(item, 'right')"
                      />
                    </Tooltip>
                  </div>
                </template>
              </CheckboxGroup>
            </VbenScrollbar>
          </template>
          <Settings class="size-4 text-foreground" />
        </Popover>
      </VbenIconButton>
    </template>
  </VbenTooltip>
</template>
<style lang="less">
.table-column-drag-icon {
  margin: 0 5px;
  cursor: move;
}

.tb-basic-column-setting {
  &__popover-title {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__check-item {
    display: flex;
    align-items: center;
    min-width: 100%;
    padding: 4px 16px 8px 0;

    .ant-checkbox-wrapper {
      width: 100%;

      &:hover {
        color: hsl(var(--primary));
      }
    }
  }

  &__fixed-left,
  &__fixed-right {
    font-size: calc(var(--font-size-base) * 1.1429);
    color: color-mix(in srgb, hsl(var(--foreground)) 75%, transparent);
    cursor: pointer;

    &.active {
      color: hsl(var(--primary));
    }

    &:hover {
      transform: scale(1.1);
    }

    &.disabled {
      color: hsl(var(--muted-foreground) / 0.5);
      cursor: not-allowed;
    }
  }

  &__cloumn-list {
    svg {
      width: 1em !important;
      height: 1em !important;
    }

    .ant-popover-content {
      // max-height: 360px;
      padding-right: 0;
      padding-left: 0;
      // overflow: auto;
      box-shadow: none;
    }

    .ant-checkbox-group {
      min-width: 260px;
      // width: 100%;
      width: 300px;
      // flex-wrap: wrap;
    }

    .scrollbar {
      height: 220px;
    }
  }
}
</style>
