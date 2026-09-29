<script setup lang="ts">
import type { AlarmCommentInfo } from '#/api/tb/alarm';
import type { PageData } from '#/types/tb';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, VbenButton, VbenLoading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { TextArea } from 'antdv-next';

import {
  deleteAlarmComment,
  getAlarmComments,
  saveAlarmComment,
} from '#/api/tb/alarm';
import { alarmSeverityLabel, Authority } from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{ alarmId: string }>();
const { hasAccessByRoles } = useAccess();
const userStore = useUserStore();
const comments = ref<PageData<AlarmCommentInfo>>();
const page = ref(0);
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const loading = ref(false);
const text = ref('');
const editing = ref<{ record: AlarmCommentInfo; text: string }>();
const canWrite = computed(() =>
  hasAccessByRoles([Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]),
);
const sortLabel = computed(() =>
  sortOrder.value === 'DESC'
    ? $t('alarm.detail.newestFirst')
    : $t('alarm.detail.oldestFirst'),
);
const systemTypes = new Set([
  'ACKED_BY_USER',
  'ASSIGNED_TO_USER',
  'CLEARED_BY_USER',
  'COMMENT_DELETED',
  'SEVERITY_CHANGED',
  'UNASSIGNED_BY_USER',
  'UNASSIGNED_FROM_DELETED_USER',
]);

function author(item: AlarmCommentInfo) {
  if (item.type === 'SYSTEM') return $t('alarm.detail.system');
  return (
    [item.firstName, item.lastName].filter(Boolean).join(' ') ||
    item.email ||
    $t('alarm.detail.deletedUser')
  );
}

function commentText(item: AlarmCommentInfo) {
  const comment = item.comment;
  if (
    item.type !== 'SYSTEM' ||
    !comment.subtype ||
    !systemTypes.has(comment.subtype)
  )
    return comment.text;
  return $t(`alarm.detail.systemComments.${comment.subtype}`, {
    ...comment,
    oldSeverity: comment.oldSeverity
      ? alarmSeverityLabel(comment.oldSeverity)
      : '',
    newSeverity: comment.newSeverity
      ? alarmSeverityLabel(comment.newSeverity)
      : '',
  });
}

function canEdit(item: AlarmCommentInfo) {
  return (
    canWrite.value &&
    item.type === 'OTHER' &&
    !!item.userId?.id &&
    item.userId.id === userStore.userInfo?.userId
  );
}

function canDelete(item: AlarmCommentInfo) {
  return (
    item.type === 'OTHER' &&
    (canEdit(item) || hasAccessByRoles([Authority.TENANT_ADMIN]))
  );
}

async function fetchComments(nextPage = 0) {
  const result = await getAlarmComments(props.alarmId, {
    page: nextPage,
    pageSize: 30,
    sortProperty: 'createdTime',
    sortOrder: sortOrder.value,
  });
  comments.value = {
    ...result,
    data: nextPage
      ? [...(comments.value?.data ?? []), ...result.data]
      : result.data,
  };
  page.value = nextPage;
}

async function reload(nextPage = 0) {
  if (loading.value) return;
  loading.value = true;
  try {
    await fetchComments(nextPage);
  } finally {
    loading.value = false;
  }
}

async function toggleSort() {
  sortOrder.value = sortOrder.value === 'DESC' ? 'ASC' : 'DESC';
  await reload();
}

async function save() {
  const value = (editing.value?.text ?? text.value).trim();
  if (!canWrite.value || !value || loading.value) return;
  if (editing.value && !canEdit(editing.value.record)) return;
  loading.value = true;
  try {
    const original = editing.value?.record;
    await saveAlarmComment(props.alarmId, {
      ...original,
      type: 'OTHER',
      comment: { ...original?.comment, text: value },
    });
    if (editing.value) editing.value = undefined;
    else text.value = '';
    await fetchComments();
  } finally {
    loading.value = false;
  }
}

async function remove(item: AlarmCommentInfo) {
  if (!item.id?.id || !canDelete(item) || loading.value) return;
  const id = item.id.id;
  await confirm({
    title: $t('alarm.detail.deleteComment'),
    content: $t('alarm.detail.deleteCommentConfirm'),
    icon: 'error',
    confirmText: $t('alarm.detail.delete'),
    confirmButtonProps: { variant: 'destructive' },
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      loading.value = true;
      try {
        await deleteAlarmComment(props.alarmId, id);
        if (editing.value?.record.id?.id === id) editing.value = undefined;
        await fetchComments();
        return true;
      } catch {
        return false;
      } finally {
        loading.value = false;
      }
    },
  });
}

async function exportActivity() {
  if (loading.value) return;
  loading.value = true;
  try {
    const rows = [
      [
        $t('alarm.detail.author'),
        $t('alarm.detail.time'),
        $t('alarm.detail.text'),
      ],
    ];
    let nextPage = 0;
    let hasNext = true;
    while (hasNext) {
      const result = await getAlarmComments(props.alarmId, {
        page: nextPage++,
        pageSize: 100,
        sortProperty: 'createdTime',
        sortOrder: sortOrder.value,
      });
      rows.push(
        ...result.data.map((item) => [
          author(item),
          formatDateTime(item.createdTime),
          commentText(item),
        ]),
      );
      hasNext = result.hasNext;
    }
    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const cell = String(value ?? '');
            const safe = /^[\s]*[=+@-]/.test(cell) ? `'${cell}` : cell;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(','),
      )
      .join('\r\n');
    downloadFileFromBlob({
      fileName: `alarm-activity-${props.alarmId}.csv`,
      source: new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.alarmId,
  () => {
    comments.value = undefined;
    text.value = '';
    editing.value = undefined;
    void reload();
  },
  { immediate: true },
);
defineExpose({ reload });
</script>

<template>
  <section class="relative overflow-hidden rounded-xl border">
    <VbenLoading :spinning="loading" />
    <div
      class="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3"
    >
      <h3 class="font-semibold">{{ $t('alarm.detail.activity') }}</h3>
      <div class="flex items-center gap-1">
        <VbenButton
          variant="ghost"
          size="icon"
          :title="$t('alarm.detail.export')"
          :aria-label="$t('alarm.detail.export')"
          :disabled="loading"
          @click="exportActivity"
        >
          <IconifyIcon icon="lucide:download" class="size-4" />
        </VbenButton>
        <VbenButton
          variant="ghost"
          size="icon"
          :title="sortLabel"
          :aria-label="sortLabel"
          :disabled="loading"
          @click="toggleSort"
        >
          <IconifyIcon
            :icon="
              sortOrder === 'DESC'
                ? 'lucide:arrow-down-wide-narrow'
                : 'lucide:arrow-up-narrow-wide'
            "
            class="size-4"
          />
        </VbenButton>
        <VbenButton
          variant="ghost"
          size="icon"
          :title="$t('alarm.detail.refresh')"
          :aria-label="$t('alarm.detail.refresh')"
          :disabled="loading"
          @click="reload()"
        >
          <IconifyIcon icon="lucide:refresh-cw" class="size-4" />
        </VbenButton>
      </div>
    </div>
    <div v-if="canWrite" class="space-y-2 border-b p-4">
      <TextArea
        v-model:value="text"
        :auto-size="{ minRows: 2, maxRows: 5 }"
        :placeholder="$t('alarm.detail.addComment')"
        :aria-label="$t('alarm.detail.addComment')"
        :disabled="loading || !!editing"
      />
      <div class="flex justify-end">
        <VbenButton
          size="sm"
          :disabled="loading || !!editing || !text.trim()"
          @click="save"
        >
          {{ $t('alarm.detail.send') }}
        </VbenButton>
      </div>
    </div>
    <div class="max-h-80 overflow-y-auto overscroll-contain p-4">
      <div
        v-if="!comments && !loading"
        class="space-y-2 text-center text-sm text-muted-foreground"
      >
        <p>{{ $t('alarm.detail.loadFailed') }}</p>
        <VbenButton size="sm" variant="outline" @click="reload()">
          {{ $t('alarm.detail.retry') }}
        </VbenButton>
      </div>
      <p
        v-else-if="!comments?.data.length"
        class="py-6 text-center text-sm text-muted-foreground"
      >
        {{ $t('alarm.detail.empty') }}
      </p>
      <ul v-else class="space-y-5">
        <li v-for="item in comments.data" :key="item.id?.id" class="flex gap-3">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
            aria-hidden="true"
          >
            <IconifyIcon
              v-if="item.type === 'SYSTEM'"
              icon="lucide:activity"
              class="size-4"
            />
            <template v-else>{{
              author(item).slice(0, 2).toUpperCase()
            }}</template>
          </span>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="font-medium">{{ author(item) }}</span>
              <time class="text-xs text-muted-foreground">{{
                formatDateTime(item.createdTime)
              }}</time>
              <span
                v-if="item.comment.edited"
                class="text-xs text-muted-foreground"
                :title="formatDateTime(item.comment.editedOn)"
                >{{ $t('alarm.detail.edited') }}</span>
              <div v-if="!editing" class="ml-auto flex gap-1">
                <VbenButton
                  v-if="canEdit(item)"
                  variant="ghost"
                  size="icon"
                  class="size-7"
                  :aria-label="$t('alarm.detail.edit')"
                  :disabled="loading"
                  @click="editing = { record: item, text: item.comment.text }"
                >
                  <IconifyIcon icon="lucide:pencil" class="size-3.5" />
                </VbenButton>
                <VbenButton
                  v-if="canDelete(item)"
                  variant="ghost"
                  size="icon"
                  class="size-7 text-destructive"
                  :aria-label="$t('alarm.detail.delete')"
                  :disabled="loading"
                  @click="remove(item)"
                >
                  <IconifyIcon icon="lucide:trash-2" class="size-3.5" />
                </VbenButton>
              </div>
            </div>
            <div
              v-if="editing && editing.record.id?.id === item.id?.id"
              class="space-y-2"
            >
              <TextArea
                v-model:value="editing.text"
                :auto-size="{ minRows: 2, maxRows: 5 }"
                :aria-label="$t('alarm.detail.edit')"
                :disabled="loading"
              />
              <div class="flex justify-end gap-2">
                <VbenButton
                  size="sm"
                  variant="ghost"
                  :disabled="loading"
                  @click="editing = undefined"
                >
                  {{ $t('alarm.detail.cancel') }}
                </VbenButton>
                <VbenButton
                  size="sm"
                  :disabled="loading || !editing.text.trim()"
                  @click="save"
                >
                  {{ $t('alarm.detail.save') }}
                </VbenButton>
              </div>
            </div>
            <p
              v-else
              class="whitespace-pre-wrap break-words text-sm"
              :class="item.type === 'SYSTEM' && 'text-muted-foreground'"
            >
              {{ commentText(item) }}
            </p>
          </div>
        </li>
      </ul>
      <VbenButton
        v-if="comments?.hasNext"
        class="mx-auto mt-4 flex"
        variant="ghost"
        :disabled="loading"
        @click="reload(page + 1)"
      >
        {{ $t('alarm.detail.loadMore') }}
      </VbenButton>
    </div>
  </section>
</template>
