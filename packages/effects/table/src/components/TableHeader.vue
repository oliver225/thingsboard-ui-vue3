<script lang="ts" setup name="BasicTableHeader">
import type { Component, PropType } from 'vue';

import type { Recordable } from '../types/shared';
import type {
  ColumnChangeParam,
  TableActionType,
  TableSetting as TableSettingOptions,
} from '../types/table';

import { VbenIcon } from '@vben-core/shadcn-ui';

import TableSelectionBar from '../components/TableSelectionBar.vue';
import TableSettingComponent from './settings/index.vue';
import TableTitle from './TableTitle.vue';

const props = defineProps({
  title: {
    default: undefined,
    type: [Function, String] as PropType<
      ((data: Recordable) => string) | string
    >,
  },
  titleIcon: {
    type: [String, Object, Function] as PropType<Component | string>,
    default: undefined,
  },
  titleIllustration: { type: String, default: '' },
  titleIllustrationAlt: { type: String, default: '' },
  tableSetting: {
    default: undefined,
    type: Object as PropType<TableSettingOptions>,
  },
  showTableSetting: {
    type: Boolean,
  },
  titleHelpMessage: {
    type: [String, Array] as PropType<string | string[]>,
    default: '',
  },
  showSelectionBar: {
    type: Boolean,
    default: false,
  },
  clearSelectedRowKeys: {
    default: undefined,
    type: Function as PropType<TableActionType['clearSelectedRowKeys']>,
  },
  count: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['columnsChange']);

const TableSetting = TableSettingComponent;

function handleColumnChange(data: ColumnChangeParam[]) {
  emit('columnsChange', data);
}
</script>
<template>
  <div class="tb-basic-table-header">
    <div v-if="$slots.headerTop" style="margin: 5px">
      <slot name="headerTop"></slot>
    </div>
    <div
      v-if="
        title ||
        $slots.tableTitle ||
        titleIllustration ||
        $slots.titleIllustration
      "
      class="tb-basic-table-header__hero"
    >
      <div
        v-if="title || $slots.tableTitle"
        class="tb-basic-table-header__title"
      >
        <VbenIcon
          v-if="titleIcon"
          :icon="titleIcon"
          class="size-[1.1em] shrink-0"
          aria-hidden="true"
        />
        <slot name="tableTitle" v-if="$slots.tableTitle"></slot>
        <TableTitle
          :help-message="titleHelpMessage"
          :title="title"
          v-if="!$slots.tableTitle && title"
        />
      </div>
      <div
        v-if="titleIllustration || $slots.titleIllustration"
        class="tb-basic-table-header__illustration"
      >
        <slot
          name="titleIllustration"
          :src="titleIllustration"
          :alt="titleIllustrationAlt"
        >
          <img
            :src="titleIllustration"
            :alt="titleIllustrationAlt"
            draggable="false"
          />
        </slot>
      </div>
    </div>
    <div
      v-if="$slots.query || $slots.toolbar || showTableSetting"
      class="tb-basic-table-header__controls"
    >
      <div v-if="$slots.query" class="tb-basic-table-header__query">
        <slot name="query"></slot>
      </div>
      <div
        v-if="$slots.toolbar || showTableSetting"
        class="tb-basic-table-header__toolbar"
      >
        <slot name="toolbar"></slot>
        <TableSetting
          :setting="tableSetting"
          v-if="showTableSetting"
          @columns-change="handleColumnChange"
        />
      </div>
    </div>
    <div v-if="showSelectionBar" class="m-1 mt-2">
      <TableSelectionBar
        :clear-selected-row-keys="props.clearSelectedRowKeys!"
        :count="props.count"
      />
    </div>
  </div>
</template>
<style lang="less">
.tb-basic-table-header {
  width: 100%;

  &__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 48px;
    padding: 8px 12px 8px 2px;
    margin: 0 8px;
  }

  &__illustration {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
    width: 112px;
    height: 56px;

    > img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 8px 12px 8px 2px;
    margin: 0 6px;
  }

  &__query {
    display: flex;
    flex: 1 1 280px;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 1 auto;
    min-width: 0;
    color: hsl(var(--foreground));
    font-size: calc(var(--font-size-base, 16px) * 1.2);
    font-weight: 700;
    line-height: 1.2;
    overflow-wrap: anywhere;

    > .anticon {
      color: inherit;
    }

    > .ant-tabs {
      & .ant-tabs-tab {
        padding: 4px 0;
        margin-left: 5px;

        & + .ant-tabs-tab {
          margin: 0 0 0 15px;
        }

        .ant-tabs-tab-btn {
          .anticon {
            margin-left: 3px;
            margin-right: 8px;
          }
        }

        .ant-tabs-tab-btn,
        .ant-tabs-tab-btn .anticon {
          color: color-mix(in srgb, hsl(var(--foreground)) 60%, transparent);
          font-size: calc(var(--font-size-base) * 1.1429);
          text-shadow: none;
        }

        &.ant-tabs-tab-active {
          .ant-tabs-tab-btn,
          .ant-tabs-tab-btn .anticon {
            color: color-mix(in srgb, hsl(var(--primary)) 90%, transparent);
          }
        }
      }
    }

    > .ant-tabs-top,
    > .ant-tabs-bottom {
      & > .ant-tabs-nav,
      & > div > .ant-tabs-nav {
        margin: 0;
      }
    }

    > .ant-tabs-top {
      // margin-bottom: -15px;
      & > .ant-tabs-nav {
        &::before {
          border-bottom: 0;
        }
      }
    }

    > .ant-tabs-card .ant-tabs-nav {
      margin: 0;

      &-list {
        .ant-tabs-tab {
          padding: 5px 8px;
          border-bottom: 0;
          color: hsl(var(--muted-foreground));

          .anticon {
            color: hsl(var(--muted-foreground));
          }

          &-active {
            .anticon {
              color: hsl(var(--primary));
            }
          }
        }
      }
    }
  }

  &__toolbar {
    min-width: 0;
    max-width: 100%;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;

    gap: 8px;
  }

  @media (max-width: 639px) {
    &__hero {
      padding-inline: 12px;
    }

    &__illustration {
      width: 88px;
      height: 44px;
    }
  }
}
</style>
