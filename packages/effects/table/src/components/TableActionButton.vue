<script setup lang="ts">
import type { ActionItem } from '../types/tableAction';

import { computed, h, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { confirm } from '@vben-core/popup-ui';
import {
  VbenIconButton,
  VbenRenderContent,
  VbenTooltip,
} from '@vben-core/shadcn-ui';

import { omit } from 'es-toolkit/compat';

import { getActionColor, getActionStatus } from './action-color';

const props = defineProps<{ action: ActionItem }>();
const emit = defineEmits<{ confirmOpenChange: [open: boolean] }>();
const confirmationOpen = ref(false);
const tooltipContent = computed(() => {
  const { tooltip, title, label } = props.action;
  const content =
    (typeof tooltip === 'string' ? tooltip : tooltip?.title) ?? title ?? label;
  if (typeof content === 'boolean') return undefined;
  return typeof content === 'number' ? String(content) : content || undefined;
});
const tooltipProps = computed(() => {
  const tooltip = props.action.tooltip;
  const options = typeof tooltip === 'object' ? tooltip : undefined;
  const placement = options?.placement ?? 'top';
  const side =
    (['bottom', 'left', 'right', 'top'] as const).find((side) =>
      placement.startsWith(side),
    ) ?? 'top';
  return {
    side,
    open:
      confirmationOpen.value || !tooltipContent.value ? false : options?.open,
    delayDuration:
      options?.mouseEnterDelay === undefined
        ? 0
        : options.mouseEnterDelay * 1000,
  };
});
const buttonProps = computed(() => {
  const action = props.action;
  const tooltipTitle = tooltipContent.value;
  return {
    ...omit(action, [
      'auth',
      'color',
      'danger',
      'divider',
      'htmlType',
      'icon',
      'iconSize',
      'ifShow',
      'label',
      'loading',
      'onClick',
      'popConfirm',
      'shape',
      'size',
      'title',
      'tooltip',
      'type',
      'variant',
    ]),
    type: action.htmlType ?? 'button',
    variant: 'ghost' as const,
    loading: !!action.loading,
    'aria-label':
      action.title ??
      action.label ??
      (typeof tooltipTitle === 'string' ? tooltipTitle : undefined),
    onClick: handleClick,
  };
});
const buttonStyle = computed(() => ({
  '--table-action-color': getActionColor(
    props.action.color,
    props.action.danger,
  ),
}));

async function handleClick(event?: MouseEvent) {
  const action = props.action;
  if (action.disabled || action.loading || confirmationOpen.value) return;
  const confirmation = action.popConfirm;
  if (!confirmation) return action.onClick?.(event);

  const submitting = ref(false);
  const errorMessage = ref('');
  const status = getActionStatus(action.color, action.danger);
  const danger = status === 'error';
  const customIcon = confirmation.icon;
  let completed = false;
  confirmationOpen.value = true;
  emit('confirmOpenChange', true);

  try {
    await confirm({
      centered: true,
      title: action.title || action.label || $t('common.confirm'),
      containerClass: 'tb-table-action-confirm',
      icon: customIcon
        ? () =>
            h(IconifyIcon, {
              icon: customIcon,
              size: 24,
              class: 'shrink-0',
              style: { color: getActionColor(action.color, action.danger) },
            })
        : status,
      confirmButtonProps: {
        danger,
        variant: danger ? 'destructive' : 'default',
        class: 'tb-table-action-confirm__submit',
        style: {
          '--table-action-color': getActionColor(action.color, action.danger),
        },
      },
      confirmText: confirmation.okText || $t('common.confirm'),
      cancelText: confirmation.cancelText || $t('common.cancel'),
      content: [confirmation.title, confirmation.description]
        .filter(Boolean)
        .join('\n'),
      footer: () =>
        errorMessage.value
          ? h(
              'p',
              {
                role: 'alert',
                class: 'text-destructive min-w-0 flex-1 text-sm',
              },
              errorMessage.value,
            )
          : null,
      async beforeClose({ isConfirm }) {
        if (submitting.value) return false;
        if (completed || !isConfirm) return true;
        if (props.action.disabled || props.action.loading) return false;
        submitting.value = true;
        errorMessage.value = '';
        try {
          await (confirmation.confirm ?? action.onClick)?.(event);
          completed = true;
          return true;
        } catch (error) {
          errorMessage.value =
            error instanceof Error ? error.message : String(error);
          return false;
        } finally {
          submitting.value = false;
        }
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'dialog cancelled') {
      if (!completed) await confirmation.cancel?.();
    } else {
      throw error;
    }
  } finally {
    confirmationOpen.value = false;
    emit('confirmOpenChange', false);
  }
}
</script>

<template>
  <span class="tb-table-action-trigger">
    <VbenTooltip v-bind="tooltipProps">
      <template #trigger>
        <VbenIconButton
          v-bind="buttonProps"
          class="tb-table-action-button"
          :style="buttonStyle"
          :tabindex="0"
        >
          <IconifyIcon v-if="action.icon" :icon="action.icon" class="size-4" />
          <span v-if="action.label">{{ action.label }}</span>
        </VbenIconButton>
      </template>
      <VbenRenderContent :content="tooltipContent" />
    </VbenTooltip>
  </span>
</template>

<style lang="less">
.tb-table-action-confirm {
  font-family: var(--font-family);
  font-size: var(--font-size-base, 16px);

  button.tb-table-action-confirm__submit:not(:disabled) {
    color: hsl(var(--primary-foreground));
    border-color: var(--table-action-color);
    background: var(--table-action-color);

    &:hover {
      border-color: color-mix(in srgb, var(--table-action-color) 85%, white);
      background: color-mix(in srgb, var(--table-action-color) 85%, white);
    }
  }
}

.tb-table-action-trigger {
  display: inline-flex;
  align-items: center;
}

button.tb-table-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 36px;
  width: auto;
  padding: 0px 8px;
  font-size: var(--font-size-base, 16px);
  border-radius: var(--radius);

  &:not(:disabled) {
    color: var(--table-action-color);

    &:hover {
      color: var(--table-action-color);
      background: color-mix(
        in srgb,
        var(--table-action-color) 10%,
        transparent
      );
    }
  }

  > svg {
    flex-shrink: 0;
  }
}
</style>
