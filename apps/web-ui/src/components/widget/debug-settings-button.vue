<script setup lang="ts">
import type { EntityDebugSettings } from '#/types/tb';

import { computed, ref, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenPopover, VbenTableAction } from '@vben-core/shadcn-ui';

import { useNow } from '@vueuse/core';

import TbSwitch from '#/adapter/component/tb-switch.vue';
import { useSystemStore } from '#/store';

export interface DebugSettingsButtonProps {
  modelValue?: EntityDebugSettings;
  disabled?: boolean;
  iconOnly?: boolean;
  /** 显示为普通文字按钮；未设置时显示调试状态。 */
  label?: string;
  debugType?: 'calculatedField' | 'ruleChain';
  entityLabel?: string;
}

const props = defineProps<DebugSettingsButtonProps>();
const emit = defineEmits<{
  'update:modelValue': [value: EntityDebugSettings];
}>();
const systemStore = useSystemStore();
const now = useNow({ interval: 1000 });
const open = ref(false);
const draft = ref<EntityDebugSettings>({});

const settings = computed(() => props.modelValue ?? {});
const isDisabled = computed(() => props.disabled || !systemStore.systemParams);
const maxDuration = computed(
  () => (systemStore.systemParams?.maxDebugModeDurationMinutes ?? 0) * 60_000,
);
const active = computed(() => isDebugAllActive(settings.value));
const allActive = computed(() => isDebugAllActive(draft.value));
const canReset = computed(() => allActive.value && !draft.value.allEnabled);
const hasChanges = computed(
  () =>
    !!draft.value.failuresEnabled !== !!settings.value.failuresEnabled ||
    !!draft.value.allEnabled !== !!settings.value.allEnabled ||
    (draft.value.allEnabledUntil ?? 0) !==
      (settings.value.allEnabledUntil ?? 0),
);
const panelDuration = computed(() =>
  formatDuration(
    canReset.value
      ? (draft.value.allEnabledUntil ?? 0) - now.value.getTime()
      : maxDuration.value,
    canReset.value,
  ),
);
const buttonLabel = computed(() => {
  if (active.value) {
    return formatDuration(
      settings.value.allEnabled
        ? maxDuration.value
        : (settings.value.allEnabledUntil ?? 0) - now.value.getTime(),
      !settings.value.allEnabled,
    );
  }
  return settings.value.failuresEnabled
    ? $t('tb.components.debugSettings.options.failures')
    : $t('tb.components.debugSettings.options.disabled');
});
const triggerLabel = computed(
  () =>
    props.label ||
    `${$t('tb.components.debugSettings.menu')}：${buttonLabel.value}`,
);
const buttonClass = computed(() =>
  props.label
    ? 'gap-2'
    : [
        'h-10 min-w-36 gap-2 rounded-full px-4',
        active.value || settings.value.failuresEnabled
          ? 'border-primary text-primary'
          : 'text-muted-foreground',
      ],
);
const limitHint = computed(() => {
  const limits =
    props.debugType === 'ruleChain'
      ? systemStore.systemParams?.ruleChainDebugPerTenantLimitsConfiguration
      : systemStore.systemParams
          ?.calculatedFieldDebugPerTenantLimitsConfiguration;
  const [messages, seconds] = (limits ?? '').split(':').map(Number);
  if (
    !messages ||
    !seconds ||
    !Number.isFinite(messages) ||
    !Number.isFinite(seconds)
  )
    return '';
  return $t('tb.components.debugSettings.messages.limitHint', {
    count: messages,
    time: formatDuration(seconds * 1000),
    entity:
      props.entityLabel || $t('tb.components.debugSettings.fields.entity'),
  });
});

function isDebugAllActive(value: EntityDebugSettings) {
  return (
    !!value.allEnabled || (value.allEnabledUntil ?? 0) > now.value.getTime()
  );
}

function formatDuration(duration: number, remaining = false) {
  const seconds = Math.max(0, Math.floor(duration / 1000));
  const time =
    seconds >= 60
      ? $t('tb.components.debugSettings.options.minutes', {
          count: Math.floor(seconds / 60),
        })
      : $t('tb.components.debugSettings.options.seconds', { count: seconds });
  return remaining
    ? $t('tb.components.debugSettings.options.remaining', { time })
    : time;
}

function onOpenChange(value: boolean) {
  if (value && isDisabled.value) return;
  if (value) draft.value = { ...settings.value };
  open.value = value;
}

function onAllChange(enabled: boolean) {
  // 已生效的倒计时保持原到期时间，开启新调试或重置时才续期。
  draft.value.allEnabled =
    enabled && (!!settings.value.allEnabled || !active.value);
  draft.value.allEnabledUntil =
    enabled && !draft.value.allEnabled
      ? (settings.value.allEnabledUntil ?? 0)
      : 0;
}

function onReset() {
  draft.value.allEnabled = true;
  draft.value.allEnabledUntil = 0;
}

function onApply() {
  if (isDisabled.value || !hasChanges.value) return;
  emit('update:modelValue', {
    failuresEnabled: !!draft.value.failuresEnabled,
    allEnabled: !!draft.value.allEnabled,
    allEnabledUntil: canReset.value ? (draft.value.allEnabledUntil ?? 0) : 0,
  });
  open.value = false;
}

watch(isDisabled, (disabled) => {
  if (disabled) open.value = false;
});
</script>

<template>
  <VbenPopover
    :open="open"
    :content-props="{ align: 'end', sideOffset: 8 }"
    content-class="w-96 max-w-[calc(100vw-2rem)] p-4"
    @update:open="onOpenChange"
  >
    <template #trigger>
      <VbenTableAction
        v-if="iconOnly"
        class="[&_button>span]:sr-only"
        :actions="[
          {
            key: 'debugSettings',
            icon: 'lucide:bug',
            text: triggerLabel,
            tooltip: $t('tb.components.debugSettings.menu'),
            disabled: isDisabled,
          },
        ]"
      />
      <VbenButton
        v-else
        type="button"
        variant="outline"
        :class="buttonClass"
        :disabled="isDisabled"
        :aria-label="triggerLabel"
        :aria-expanded="open"
      >
        <IconifyIcon icon="lucide:bug" class="size-4" aria-hidden="true" />
        {{ label || buttonLabel }}
      </VbenButton>
    </template>
    <div class="flex flex-col gap-3" @click.stop>
      <div class="text-base font-semibold">
        {{ $t('tb.components.debugSettings.menu') }}
      </div>
      <p v-if="limitHint" class="text-muted-foreground text-xs leading-5">
        {{ limitHint }}
      </p>
      <TbSwitch
        :checked="!!draft.failuresEnabled"
        :title="$t('tb.components.debugSettings.options.onFailure')"
        :description="$t('tb.components.debugSettings.messages.failureHint')"
        @update:checked="draft.failuresEnabled = $event"
      />
      <div class="flex flex-col gap-1">
        <TbSwitch
          :checked="allActive"
          :title="
            $t('tb.components.debugSettings.options.allMessages', {
              time: panelDuration,
            })
          "
          :description="$t('tb.components.debugSettings.messages.allHint')"
          @update:checked="onAllChange"
        />
        <VbenButton
          v-if="canReset"
          type="button"
          variant="ghost"
          size="sm"
          class="self-end gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
          @click="onReset"
        >
          <IconifyIcon
            icon="lucide:timer-reset"
            class="size-3.5"
            aria-hidden="true"
          />
          {{ $t('tb.components.debugSettings.actions.reset') }}
        </VbenButton>
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <VbenButton type="button" variant="ghost" @click="open = false">
          {{ $t('tb.components.debugSettings.actions.cancel') }}
        </VbenButton>
        <VbenButton
          type="button"
          :disabled="isDisabled || !hasChanges"
          @click="onApply"
        >
          {{ $t('tb.components.debugSettings.actions.apply') }}
        </VbenButton>
      </div>
    </div>
  </VbenPopover>
</template>
