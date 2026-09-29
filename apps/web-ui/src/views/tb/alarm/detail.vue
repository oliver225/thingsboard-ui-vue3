<script setup lang="ts">
import type { AlarmInfo } from '#/api/tb/alarm';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { JsonViewer, useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input } from '@vben-core/shadcn-ui';

import { useNow } from '@vueuse/core';
import { message, Tag } from 'antdv-next';

import { ApiSelect } from '#/adapter/component';
import {
  ackAlarm,
  assignAlarm,
  clearAlarm,
  getAlarmInfoById,
  unassignAlarm,
} from '#/api/tb/alarm';
import { getUserInfos } from '#/api/tb/user';
import {
  alarmSeverityColor,
  alarmSeverityLabel,
  alarmStatusLabel,
  Authority,
} from '#/enums';
import { $t } from '#/locales';

import Activity from './activity.vue';

const emit = defineEmits<{ success: [] }>();
const { hasAccessByRoles } = useAccess();
const record = ref<AlarmInfo>();
const activity = ref<InstanceType<typeof Activity>>();
const expanded = ref(false);
const userSearch = ref('');
const now = useNow({ interval: 1000 });
const canEdit = computed(() =>
  hasAccessByRoles([Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]),
);
const duration = computed(() => {
  const alarm = record.value;
  if (!alarm?.startTs) return '—';
  const end = alarm.cleared ? alarm.clearTs : now.value.getTime();
  if (!end) return '—';
  const seconds = Math.max(0, Math.floor((end - alarm.startTs) / 1000));
  return $t('alarm.detail.durationValue', {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  });
});
const fields = computed(() => [
  {
    label: $t('alarm.fields.originator'),
    value: record.value?.originatorLabel || record.value?.originatorName || '—',
  },
  { label: $t('alarm.fields.severity'), severity: true },
  {
    label: $t('alarm.fields.startTime'),
    value: record.value?.startTs ? formatDateTime(record.value.startTs) : '—',
  },
  { label: $t('alarm.detail.duration'), value: duration.value },
  { label: $t('alarm.fields.type'), value: record.value?.type },
  {
    label: $t('alarm.fields.status'),
    value: record.value ? alarmStatusLabel(record.value) : '—',
  },
]);

const [Modal, modalApi] = useVbenModal<{ alarmId: string }>({
  title: $t('alarm.detail.title'),
  async onOpenChange(open) {
    if (!open) return;
    record.value = undefined;
    expanded.value = false;
    userSearch.value = '';
    await loadAlarm();
  },
});
const modalState = modalApi.useStore();

async function loadAlarm() {
  const id = modalApi.getData()?.alarmId;
  if (!id) return;
  modalApi.setState({ loading: true });
  try {
    record.value = await getAlarmInfoById(id);
  } finally {
    modalApi.setState({ loading: false });
  }
}

async function userOptions({ textSearch }: { textSearch?: string }) {
  const result = await getUserInfos({
    page: 0,
    pageSize: 50,
    sortProperty: 'email',
    sortOrder: 'ASC',
    textSearch,
  });
  const options = result.data.map((user) => ({
    label:
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    value: user.id?.id,
  }));
  const current = record.value;
  if (
    current?.assigneeId?.id &&
    !options.some((option) => option.value === current.assigneeId?.id)
  ) {
    options.unshift({
      label:
        [current.assignee?.firstName, current.assignee?.lastName]
          .filter(Boolean)
          .join(' ') ||
        current.assignee?.email ||
        '—',
      value: current.assigneeId.id,
    });
  }
  return [{ label: $t('alarm.detail.unassigned'), value: '' }, ...options];
}

async function updateAlarm(
  action: 'ack' | 'assign' | 'clear',
  userId?: string,
) {
  const id = record.value?.id?.id;
  if (!id || !canEdit.value || modalState.value.submitting) return;
  modalApi.lock();
  try {
    if (action === 'assign') {
      await (userId ? assignAlarm(id, userId) : unassignAlarm(id));
      message.success($t('alarm.detail.assignSuccess'));
    } else if (action === 'ack') {
      await ackAlarm(id);
      message.success($t('alarm.actions.ackSuccess'));
    } else {
      await clearAlarm(id);
      message.success($t('alarm.actions.clearSuccess'));
    }
    emit('success');
    await Promise.all([loadAlarm(), activity.value?.reload()]);
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    content-class="px-6 py-5"
  >
    <div v-if="record" class="space-y-5">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label
          v-for="field in fields"
          :key="field.label"
          class="flex min-w-0 flex-col gap-2"
        >
          <span class="text-sm text-muted-foreground">{{ field.label }}</span>
          <div v-if="field.severity" class="flex h-9 items-center">
            <Tag :color="alarmSeverityColor(record.severity)">{{
              alarmSeverityLabel(record.severity)
            }}</Tag>
          </div>
          <Input v-else :model-value="field.value" readonly />
        </label>
      </div>
      <div>
        <VbenButton
          variant="ghost"
          class="ml-auto flex gap-2"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          {{
            expanded ? $t('alarm.detail.showLess') : $t('alarm.detail.showMore')
          }}
          <IconifyIcon
            :icon="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="size-4"
          />
        </VbenButton>
        <div v-if="expanded" class="space-y-2 pt-2">
          <p class="text-sm text-muted-foreground">
            {{ $t('alarm.detail.additionalInfo') }}
          </p>
          <JsonViewer boxed copyable :value="record.details ?? {}" />
        </div>
      </div>
      <div class="space-y-2">
        <label class="text-sm text-muted-foreground" for="alarm-assignee">{{
          $t('alarm.fields.assignee')
        }}</label>
        <ApiSelect
          id="alarm-assignee"
          class="w-full"
          show-search
          :filter-option="false"
          :value="record.assigneeId?.id ?? ''"
          :api="userOptions"
          :params="{ textSearch: userSearch }"
          :disabled="!canEdit || modalState.submitting"
          :placeholder="$t('alarm.detail.unassigned')"
          @search="(text: string) => (userSearch = text)"
          @change="
            (value: unknown) => updateAlarm('assign', String(value ?? ''))
          "
        />
      </div>
      <Activity v-if="record.id" ref="activity" :alarm-id="record.id.id" />
    </div>
    <div
      v-else-if="!modalState.loading"
      class="flex min-h-40 flex-col items-center justify-center gap-3"
    >
      <p class="text-muted-foreground">{{ $t('alarm.detail.loadFailed') }}</p>
      <VbenButton variant="outline" @click="loadAlarm">
        {{ $t('alarm.detail.retry') }}
      </VbenButton>
    </div>
    <template #footer>
      <VbenButton
        v-if="canEdit && record && !record.acknowledged"
        variant="outline"
        :disabled="modalState.submitting"
        @click="updateAlarm('ack')"
      >
        {{ $t('alarm.actions.ack') }}
      </VbenButton>
      <VbenButton
        v-if="canEdit && record && !record.cleared"
        variant="outline"
        :disabled="modalState.submitting"
        @click="updateAlarm('clear')"
      >
        {{ $t('alarm.actions.clear') }}
      </VbenButton>
      <VbenButton :disabled="modalState.submitting" @click="modalApi.close()">
        {{ $t('alarm.detail.close') }}
      </VbenButton>
    </template>
  </Modal>
</template>
