<script setup lang="ts">
import type { NotificationPref } from '#/api/tb/notification';

import { computed, onMounted, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { Checkbox, Empty, message, Spin } from 'antdv-next';

import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
} from '#/api/tb/notification';
import { notificationTypeLabel } from '#/enums';
import { $t } from '#/locales';

const loading = ref(false);
const prefs = ref<Record<string, NotificationPref>>();
const rows = computed(() => Object.values(prefs.value ?? {}));
// Include every channel returned by the server, including mobile/custom channels.
const defaultMethods = ['WEB', 'EMAIL', 'SMS'];
const methods = computed(() => [
  ...new Set([
    ...defaultMethods,
    ...rows.value.flatMap((row) => Object.keys(row.enabledDeliveryMethods)),
  ]),
]);
const methodLabels: Record<string, string> = {
  WEB: 'Web',
  EMAIL: 'Email',
  SMS: 'SMS',
  MOBILE_APP: 'Mobile app',
  SLACK: 'Slack',
  MICROSOFT_TEAMS: 'Microsoft Teams',
};
const allChecked = computed(
  () =>
    rows.value.length > 0 &&
    rows.value.every(
      (row) =>
        row.enabled &&
        methods.value.every((method) => row.enabledDeliveryMethods[method]),
    ),
);
const allIndeterminate = computed(
  () => !allChecked.value && rows.value.some((row) => row.enabled),
);
const columnStatus = computed(() =>
  Object.fromEntries(
    methods.value.map((method) => {
      const enabled = rows.value.filter(
        (row) => row.enabled && row.enabledDeliveryMethods[method],
      ).length;
      return [
        method,
        {
          checked: rows.value.length > 0 && enabled === rows.value.length,
          indeterminate: enabled > 0 && enabled < rows.value.length,
        },
      ];
    }),
  ),
);

function handleToggleAll(checked: boolean) {
  for (const row of rows.value) handleToggleRow(row, checked);
}
function handleToggleColumn(method: string, checked: boolean) {
  for (const row of rows.value) {
    row.enabledDeliveryMethods[method] = checked;
    row.enabled =
      checked ||
      (row.enabled && Object.values(row.enabledDeliveryMethods).some(Boolean));
  }
}
function handleToggleRow(row: NotificationPref, checked: boolean) {
  row.enabled = checked;
  for (const method of methods.value)
    row.enabledDeliveryMethods[method] = checked;
}
function handleToggleMethod(
  row: NotificationPref,
  method: string,
  checked: boolean,
) {
  row.enabledDeliveryMethods[method] = checked;
  row.enabled = Object.values(row.enabledDeliveryMethods).some(Boolean);
}
function isRowIndeterminate(row: NotificationPref) {
  const count = methods.value.filter(
    (method) => row.enabledDeliveryMethods[method],
  ).length;
  return row.enabled && count > 0 && count < methods.value.length;
}
async function loadSettings() {
  if (loading.value) return;
  loading.value = true;
  prefs.value = undefined;
  try {
    const data = await getUserNotificationSettings();
    prefs.value = Object.fromEntries(
      Object.entries(data.prefs ?? {}).map(([type, row]) => [
        type,
        {
          ...row,
          enabled: !!row.enabled,
          enabledDeliveryMethods: { ...row.enabledDeliveryMethods },
        },
      ]),
    );
  } catch {
    // Prevent saving an unloaded configuration; keep the retry action visible.
  } finally {
    loading.value = false;
  }
}
async function handleSave() {
  if (!prefs.value || loading.value) return;
  loading.value = true;
  try {
    const snapshot = Object.fromEntries(
      Object.entries(prefs.value).map(([type, row]) => [
        type,
        { ...row, enabledDeliveryMethods: { ...row.enabledDeliveryMethods } },
      ]),
    );
    await saveUserNotificationSettings({ prefs: snapshot });
    message.success($t('tb.common.saveSuccess'));
  } finally {
    loading.value = false;
  }
}
onMounted(loadSettings);
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <header
      class="flex min-h-[66px] shrink-0 items-center justify-between gap-4 border-b border-border p-4 md:px-6 md:py-[18px]"
    >
      <h2
        class="m-0 text-[length:var(--font-size-base)] font-semibold leading-6"
      >
        {{ $t('account.sections.notification') }}
      </h2>
    </header>
    <div class="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-6">
      <div
        class="m-0 w-full min-w-0 max-w-[1040px] text-sm [&_.ant-form-item]:mb-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:font-medium [&_.ant-input-number]:w-full [&_.ant-select]:w-full"
      >
        <Spin :spinning="loading">
          <div v-if="!prefs && !loading" role="alert" class="text-destructive">
            {{ $t('account.messages.loadFailed') }}
            <VbenButton variant="link" @click="loadSettings">
              {{ $t('tb.common.retry') }}
            </VbenButton>
          </div>
          <Empty v-else-if="prefs && !rows.length" />
          <fieldset
            v-else
            :disabled="loading"
            class="overflow-x-auto rounded-lg border border-border"
          >
            <table class="w-full min-w-[36rem] text-sm">
              <thead class="bg-accent">
                <tr>
                  <th class="px-4 py-3 text-left">
                    <Checkbox
                      :checked="allChecked"
                      :indeterminate="allIndeterminate"
                      @change="(e) => handleToggleAll(!!e.target.checked)"
                    >
                      {{ $t('notification.fields.colType') }}
                    </Checkbox>
                  </th>
                  <th
                    v-for="method in methods"
                    :key="method"
                    class="whitespace-nowrap px-4 py-3 text-left"
                  >
                    <Checkbox
                      :checked="columnStatus[method]?.checked"
                      :indeterminate="columnStatus[method]?.indeterminate"
                      @change="
                        (e) => handleToggleColumn(method, !!e.target.checked)
                      "
                    >
                      {{ methodLabels[method] || method }}
                    </Checkbox>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, type) in prefs"
                  :key="type"
                  class="border-t border-border"
                >
                  <td class="px-4 py-3">
                    <Checkbox
                      :checked="row.enabled"
                      :indeterminate="isRowIndeterminate(row)"
                      @change="(e) => handleToggleRow(row, !!e.target.checked)"
                    >
                      {{ notificationTypeLabel(type) }}
                    </Checkbox>
                  </td>
                  <td v-for="method in methods" :key="method" class="px-4 py-3">
                    <Checkbox
                      :checked="
                        row.enabled && !!row.enabledDeliveryMethods[method]
                      "
                      :aria-label="`${notificationTypeLabel(type)} ${methodLabels[method] || method}`"
                      @change="
                        (e) =>
                          handleToggleMethod(row, method, !!e.target.checked)
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </fieldset>
        </Spin>
      </div>
    </div>
    <footer
      class="flex min-h-[68px] shrink-0 flex-wrap items-center justify-start gap-3 border-t border-border bg-card p-4 md:px-6 [&>.ant-btn]:min-w-20"
    >
      <VbenButton variant="outline" :disabled="loading" @click="loadSettings">
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        :disabled="!prefs || loading || !rows.length"
        :loading="loading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </footer>
  </section>
</template>
