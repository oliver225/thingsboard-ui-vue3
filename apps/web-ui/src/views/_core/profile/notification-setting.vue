<script lang="ts" setup>
/**
 * 用户通知设置(类型 × 投递方式 矩阵)
 * GET/POST /api/notification/settings/user
 * 逻辑参考旧项目 account/notifictionSetting.vue;页面结构与 password-setting.vue 一致,
 * 使用 Vben 组件(VbenButton / VbenScrollbar);矩阵的三态勾选保留 antdv Checkbox。
 * content 高度超出时由 VbenScrollbar 提供滚动条。
 */
import type { NotificationPref } from '#/api/tb/notification';

import { computed, onMounted, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Checkbox, message } from 'antdv-next';

import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
} from '#/api/tb/notification';
import { notificationTypeLabel } from '#/enums';

defineOptions({ name: 'AccountNotificationSetting' });

const DELIVERY_METHODS = ['WEB', 'EMAIL', 'SMS'] as const;
type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

const loading = ref(false);
const saving = ref(false);
const prefs = ref<Record<string, NotificationPref>>({});

const methodLabel: Record<DeliveryMethod, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WEB: 'Web',
};

const prefList = computed(() => Object.values(prefs.value));

/** 列(投递方式)整列状态 */
const columnStatus = computed(() => {
  const result = {} as Record<
    DeliveryMethod,
    { checked: boolean; indeterminate: boolean }
  >;
  DELIVERY_METHODS.forEach((m) => {
    const values = prefList.value.map((p) => !!p.enabledDeliveryMethods?.[m]);
    const checked = values.length > 0 && values.every(Boolean);
    result[m] = { checked, indeterminate: !checked && values.some(Boolean) };
  });
  return result;
});

const allChecked = computed(
  () => prefList.value.length > 0 && prefList.value.every((p) => p.enabled),
);
const allIndeterminate = computed(
  () => !allChecked.value && prefList.value.some((p) => p.enabled),
);

function rowIndeterminate(pref: NotificationPref) {
  const values = DELIVERY_METHODS.map((m) => !!pref.enabledDeliveryMethods[m]);
  return pref.enabled && values.some(Boolean) && !values.every(Boolean);
}

function onToggleAll(checked: boolean) {
  prefList.value.forEach((p) => {
    p.enabled = checked;
    DELIVERY_METHODS.forEach((m) => (p.enabledDeliveryMethods[m] = checked));
  });
}

function onToggleColumn(method: DeliveryMethod, checked: boolean) {
  prefList.value.forEach((p) => {
    if (checked) {
      p.enabled = true;
      p.enabledDeliveryMethods[method] = true;
    } else {
      p.enabledDeliveryMethods[method] = false;
      if (DELIVERY_METHODS.every((m) => !p.enabledDeliveryMethods[m])) {
        p.enabled = false;
      }
    }
  });
}

function onRowToggle(pref: NotificationPref, checked: boolean) {
  if (checked) {
    if (DELIVERY_METHODS.every((m) => !pref.enabledDeliveryMethods[m])) {
      DELIVERY_METHODS.forEach((m) => (pref.enabledDeliveryMethods[m] = true));
    }
  } else {
    DELIVERY_METHODS.forEach((m) => (pref.enabledDeliveryMethods[m] = false));
  }
}

function onMethodToggle(pref: NotificationPref) {
  pref.enabled = DELIVERY_METHODS.some((m) => pref.enabledDeliveryMethods[m]);
}

async function load() {
  loading.value = true;
  try {
    const data = await getUserNotificationSettings();
    const normalized: Record<string, NotificationPref> = {};
    Object.entries(data.prefs ?? {}).forEach(([type, raw]) => {
      const methods: Record<string, boolean> = {
        ...raw.enabledDeliveryMethods,
      };
      DELIVERY_METHODS.forEach((m) => {
        methods[m] = methods[m] ?? false;
      });
      normalized[type] = {
        enabled: !!raw.enabled,
        enabledDeliveryMethods: methods,
      };
    });
    prefs.value = normalized;
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const out: Record<string, NotificationPref> = {};
    Object.entries(prefs.value).forEach(([type, pref]) => {
      const methods = {} as Record<string, boolean>;
      DELIVERY_METHODS.forEach((m) => {
        methods[m] = !!pref.enabledDeliveryMethods[m];
      });
      out[type] = { enabled: !!pref.enabled, enabledDeliveryMethods: methods };
    });
    await saveUserNotificationSettings({ prefs: out });
    message.success($t('tb.common.saveSuccess'));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <div class="flex flex-none items-center justify-between">
      <h3 class="text-lg font-bold text-foreground">
        {{ $t('tb.notification.settingTitle') }}
      </h3>
      <VbenButton variant="link" :disabled="loading" @click="load">
        {{ $t('tb.notification.resetAll') }}
      </VbenButton>
    </div>

    <!-- content 超出高度时显示滚动条 -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="prefList.length > 0"
        class="overflow-hidden rounded border border-border"
      >
        <!-- 表头 -->
        <div class="flex border-b border-border bg-accent font-medium">
          <div class="flex w-2/5 items-center px-4 py-2">
            <Checkbox
              :checked="allChecked"
              :indeterminate="allIndeterminate"
              @change="(e: any) => onToggleAll(e.target.checked)"
            >
              {{ $t('tb.notification.colType') }}
            </Checkbox>
          </div>
          <div
            v-for="m in DELIVERY_METHODS"
            :key="`h-${m}`"
            class="flex w-1/5 items-center px-4 py-2"
          >
            <Checkbox
              :checked="columnStatus[m].checked"
              :indeterminate="columnStatus[m].indeterminate"
              @change="(e: any) => onToggleColumn(m, e.target.checked)"
            >
              {{ methodLabel[m] }}
            </Checkbox>
          </div>
        </div>

        <!-- 行 -->
        <div
          v-for="(pref, type) in prefs"
          :key="type"
          class="flex border-b border-border last:border-b-0"
        >
          <div class="flex w-2/5 items-center px-4 py-2">
            <Checkbox
              v-model:checked="pref.enabled"
              :indeterminate="rowIndeterminate(pref)"
              @change="(e: any) => onRowToggle(pref, e.target.checked)"
            >
              {{ notificationTypeLabel(type) }}
            </Checkbox>
          </div>
          <div
            v-for="m in DELIVERY_METHODS"
            :key="`${type}-${m}`"
            class="flex w-1/5 items-center px-4 py-2"
          >
            <Checkbox
              v-model:checked="pref.enabledDeliveryMethods[m]"
              :disabled="!pref.enabled"
              @change="() => onMethodToggle(pref)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flex-none text-right">
      <VbenButton type="submit" :loading="saving" @click="handleSave">
        {{ $t('tb.common.save') }}
      </VbenButton>
    </div>
  </div>
</template>
