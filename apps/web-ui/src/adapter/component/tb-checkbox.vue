<script lang="ts" setup>
import { computed, useId } from 'vue';

import { VbenTooltip } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Checkbox } from '@vben-core/shadcn-ui';

export interface TbCheckboxProps {
  checked?: boolean;
  description?: string;
  disabled?: boolean;
  help?: string;
  id?: string;
  title?: string;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<TbCheckboxProps>();
const emit = defineEmits<{ 'update:checked': [checked: boolean] }>();
const generatedId = useId();
const controlId = computed(() => props.id || generatedId);

/** 空白和说明区域转交给原生控件，保持与直接点击复选框一致的双向绑定行为。 */
function handleRowClick(event: MouseEvent) {
  if (props.disabled) return;

  const target = event.target;
  // 标签和内部控件已有点击行为；帮助按钮、插槽链接等保留自己的操作。
  if (
    !(target instanceof Element) ||
    target.closest(
      'a, button, input, label, select, textarea, [contenteditable], [role="button"]',
    )
  ) {
    return;
  }

  const control = (
    event.currentTarget as HTMLElement
  ).querySelector<HTMLButtonElement>('[role="checkbox"]');
  if (!control || control.disabled) return;

  control.focus();
  control.click();
}
</script>

<template>
  <!-- 有标题时统一为设置行；表格内不传标题，保留紧凑复选框。 -->
  <div
    class="tb-checkbox"
    @click="handleRowClick"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled || undefined"
    :class="[
      $attrs.class,
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      title || $slots.title
        ? 'tb-checkbox-row flex w-full min-w-0 items-start gap-3 rounded-md px-4 py-3'
        : 'inline-flex items-center',
    ]"
  >
    <!-- 表单的 id、校验属性和事件传给实际复选框，保持 checked 双向绑定。 -->
    <Checkbox
      v-bind="{ ...$attrs, class: undefined }"
      :id="controlId"
      :model-value="checked ?? false"
      :disabled="disabled"
      :aria-describedby="
        [
          $attrs['aria-describedby'],
          description || $slots.description
            ? `${controlId}-description`
            : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined
      "
      class="shrink-0"
      :class="{ 'mt-0.5': title || $slots.title }"
      @update:model-value="emit('update:checked', $event === true)"
    />
    <div v-if="title || $slots.title" class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <label
          :for="controlId"
          class="text-sm font-medium leading-5"
          :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
        >
          <slot name="title">{{ title }}</slot>
        </label>
        <VbenTooltip v-if="help" side="top">
          <template #trigger>
            <button
              type="button"
              tabindex="0"
              :aria-label="title"
              class="text-muted-foreground hover:text-primary focus-visible:ring-ring inline-flex rounded-sm outline-none focus-visible:ring-2"
            >
              <IconifyIcon icon="lucide:circle-help" class="size-4" />
            </button>
          </template>
          {{ help }}
        </VbenTooltip>
      </div>
      <div
        v-if="description || $slots.description"
        :id="`${controlId}-description`"
        class="text-muted-foreground mt-1 text-xs leading-5"
      >
        <slot name="description">{{ description }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 未选中：浅灰底和中性边框，移出后恢复此状态。 */
.tb-checkbox-row {
  background-color: hsl(var(--muted) / 40%);
  border: 1px solid hsl(var(--border) / 80%);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

/* 未选中悬停：加深浅灰底，主题色边框提示整行可点击。 */
.tb-checkbox-row[data-state='unchecked']:not([data-disabled]):hover {
  background-color: hsl(var(--muted) / 75%);
  border-color: hsl(var(--primary) / 35%);
}

/* 选中：持续保留淡主题色，移出后仍能辨认当前状态。 */
.tb-checkbox-row[data-state='checked'] {
  background-color: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary) / 30%);
}

/* 选中悬停：轻微加深，避免与未选中状态混淆。 */
.tb-checkbox-row[data-state='checked']:not([data-disabled]):hover {
  background-color: hsl(var(--primary) / 12%);
  border-color: hsl(var(--primary) / 50%);
}

/* 按下反馈仅改变颜色，不移动布局。 */
.tb-checkbox-row[data-state]:not([data-disabled]):active {
  background-color: hsl(var(--primary) / 16%);
  border-color: hsl(var(--primary) / 65%);
}

/* 仅键盘焦点显示外环，鼠标点击后移出不会残留聚焦边框。 */
.tb-checkbox-row:not([data-disabled]):has(:focus-visible) {
  border-color: hsl(var(--primary) / 60%);
  box-shadow: 0 0 0 2px hsl(var(--primary) / 15%);
}

/* 禁用时保留选中状态的颜色，但降低整体强调程度。 */
.tb-checkbox-row[data-disabled] {
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .tb-checkbox-row {
    transition: none;
  }
}
</style>
