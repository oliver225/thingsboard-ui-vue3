<script setup lang="ts">
import { computed, useId } from 'vue';

import { VbenTooltip } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cn } from '@vben/utils';

const props = withDefaults(
  defineProps<{
    /** actions 插槽相对于折叠按钮的位置。 */
    actionsPosition?: 'left' | 'right';
    collapsible?: boolean;
    contentClass?: string;
    description?: string;
    help?: string;
    size?: 'default' | 'small';
    title?: string;
  }>(),
  {
    actionsPosition: 'right',
    collapsible: false,
    contentClass: '',
    description: '',
    help: '',
    size: 'default',
    title: '',
  },
);
const open = defineModel<boolean>('open', { default: true });
const id = useId();
const headingId = `${id}-heading`;
const contentId = `${id}-content`;

// 无标题的卡片始终显示内容，不生成空标题或不可操作的折叠区域。
const hasHeading = computed(() => Boolean(props.title || props.description));
const canCollapse = computed(() => props.collapsible && hasHeading.value);
const spacing = computed(() =>
  props.size === 'small'
    ? { header: 'px-4 py-3', content: 'px-4 pb-3', top: 'pt-3' }
    : {
        header: 'p-4 md:p-6',
        content: 'px-4 pb-4 md:px-6 md:pb-6',
        top: 'pt-4 md:pt-6',
      },
);

function toggleOpen() {
  if (canCollapse.value) {
    open.value = !open.value;
  }
}
</script>

<template>
  <section
    class="form-section border-border bg-card min-w-0 rounded-xl border shadow-xs"
  >
    <div
      v-if="hasHeading || $slots.actions"
      class="form-section-header flex items-start gap-2"
      :class="spacing.header"
    >
      <h3 v-if="hasHeading" class="m-0 min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <component
            :is="canCollapse ? 'button' : 'span'"
            :id="headingId"
            :type="canCollapse ? 'button' : undefined"
            class="focus-visible:ring-ring min-w-0 rounded-md text-left leading-5 outline-none focus-visible:ring-2"
            :class="[
              title
                ? 'font-semibold'
                : 'text-muted-foreground mt-1 font-normal',
              !title && size === 'small' ? 'text-xs' : 'text-sm',
            ]"
            :aria-expanded="canCollapse ? open : undefined"
            :aria-controls="canCollapse ? contentId : undefined"
            @click="toggleOpen"
          >
            {{ title || description }}
          </component>
          <VbenTooltip v-if="help" side="top">
            <template #trigger>
              <button
                type="button"
                :aria-label="help"
                class="text-muted-foreground hover:text-primary focus-visible:ring-ring inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2"
              >
                <IconifyIcon icon="lucide:circle-help" class="size-4" />
              </button>
            </template>
            {{ help }}
          </VbenTooltip>
        </span>
        <span
          v-if="title && description"
          class="text-muted-foreground mt-1 block font-normal leading-5"
          :class="size === 'small' ? 'text-xs' : 'text-sm'"
        >
          {{ description }}
        </span>
      </h3>
      <!-- 帮助及操作区独立于折叠按钮，避免按钮嵌套及操作触发折叠。 -->
      <div
        v-if="canCollapse || $slots.actions"
        class="ml-auto flex shrink-0 items-center gap-2"
      >
        <button
          v-if="canCollapse"
          type="button"
          class="focus-visible:ring-ring inline-flex rounded-sm outline-none focus-visible:ring-2"
          :aria-labelledby="headingId"
          :aria-expanded="open"
          :aria-controls="contentId"
          @click="toggleOpen"
        >
          <IconifyIcon
            icon="lucide:chevron-down"
            class="text-muted-foreground size-5 shrink-0 transition-transform"
            :class="{ 'rotate-180': open }"
            aria-hidden="true"
          />
        </button>
        <div
          v-if="$slots.actions"
          class="flex shrink-0 items-center gap-1"
          :class="{ 'order-first': actionsPosition === 'left' }"
        >
          <slot name="actions" :open="open"></slot>
        </div>
      </div>
    </div>
    <!-- 默认始终展开；启用折叠后通过 v-model:open 控制，仅隐藏内容以保留输入和校验。 -->
    <div
      v-show="!canCollapse || open"
      :id="contentId"
      :role="hasHeading ? 'region' : undefined"
      :aria-labelledby="hasHeading ? headingId : undefined"
      class="form-section-content"
      :class="
        cn(
          spacing.content,
          !hasHeading && !$slots.actions && spacing.top,
          contentClass,
        )
      "
    >
      <slot></slot>
    </div>
  </section>
</template>
