<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { InputNumber } from 'antdv-next';

import { $t } from '#/locales';
import { isValidRateLimit, normalizeRateLimit } from '#/utils/rate-limit';

interface RateLimitRow {
  count: null | number;
  id: number;
  seconds: null | number;
}

const props = defineProps<{
  disabled?: boolean;
  label: string;
  value?: null | string;
}>();
const emit = defineEmits<{ 'update:value': [value: string] }>();
let nextRowId = 0;
const rows = ref<RateLimitRow[]>([]);
const validationError = ref('');
const editTitle = computed(() =>
  $t('tb.components.rateLimit.actions.edit', { label: props.label }),
);
const draftValue = computed(() => serializeRows(rows.value));
const summary = computed(() => formatRateLimitSummary(props.value));
const preview = computed(() =>
  formatRateLimitSummary(
    serializeRows(
      rows.value.filter((row) => row.count !== null && row.seconds !== null),
    ),
  ),
);

function serializeRows(value: RateLimitRow[]) {
  return value
    .map((row) => `${row.count ?? ''}:${row.seconds ?? ''}`)
    .join(',');
}

function createRow(value = ''): RateLimitRow {
  const [count, seconds] = value.split(':');
  return {
    count: parseNumber(count),
    id: nextRowId++,
    seconds: parseNumber(seconds),
  };
}

function parseNumber(value?: string) {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatRateLimitSummary(value?: null | string) {
  return value?.trim()
    ? value
        .split(',')
        .map((part) => {
          const [count, seconds] = part.split(':');
          return $t('tb.components.rateLimit.messages.summary', {
            count,
            seconds,
          });
        })
        .join('; ')
    : $t('tb.components.rateLimit.messages.notSet');
}

function addRateLimit() {
  rows.value.push(createRow());
  validationError.value = '';
}

function removeRateLimit(index: number) {
  rows.value.splice(index, 1);
  validationError.value = '';
}

const [Modal, modalApi] = useVbenModal({
  onConfirm() {
    if (!isValidRateLimit(draftValue.value)) {
      validationError.value = $t('tb.components.rateLimit.validation.invalid');
      return;
    }
    emit('update:value', normalizeRateLimit(draftValue.value));
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    validationError.value = '';
    rows.value = props.value?.trim()
      ? props.value.split(',').map((part) => createRow(part))
      : [createRow()];
  },
});
</script>

<template>
  <div class="w-full">
    <VbenButton
      type="button"
      variant="outline"
      class="enabled:hover:border-primary h-10 w-full justify-between gap-2 px-3 py-2 text-left font-normal"
      :disabled="disabled"
      :aria-label="editTitle"
      @click="modalApi.open()"
    >
      <span class="text-muted-foreground min-w-0 truncate" :title="summary">{{
        summary
      }}</span>
      <IconifyIcon
        :icon="value ? 'lucide:pencil' : 'lucide:circle-plus'"
        class="text-primary size-4 shrink-0"
      />
    </VbenButton>
    <Modal
      :title="editTitle"
      class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
      content-class="px-6 py-5"
    >
      <div class="space-y-4">
        <div
          v-for="(row, index) in rows"
          :key="row.id"
          class="grid grid-cols-[1fr_1fr_auto] items-end gap-3"
        >
          <label class="flex min-w-0 flex-col gap-2 text-sm font-medium">
            <span>{{ $t('tb.components.rateLimit.fields.count') }}</span>
            <InputNumber
              v-model:value="row.count"
              class="w-full"
              :aria-label="$t('tb.components.rateLimit.fields.count')"
              :min="1"
              :precision="0"
              :max="Number.MAX_SAFE_INTEGER"
              @change="validationError = ''"
            />
          </label>
          <label class="flex min-w-0 flex-col gap-2 text-sm font-medium">
            <span>{{ $t('tb.components.rateLimit.fields.seconds') }}</span>
            <InputNumber
              v-model:value="row.seconds"
              class="w-full"
              :aria-label="$t('tb.components.rateLimit.fields.seconds')"
              :min="1"
              :precision="0"
              :max="Number.MAX_SAFE_INTEGER"
              @change="validationError = ''"
            />
          </label>
          <VbenButton
            type="button"
            variant="ghost"
            size="icon"
            class="size-10"
            :aria-label="$t('tb.components.rateLimit.actions.remove')"
            @click="removeRateLimit(index)"
          >
            <IconifyIcon
              icon="lucide:circle-minus"
              class="text-primary size-4"
            />
          </VbenButton>
        </div>
        <p v-if="validationError" class="text-destructive text-sm" role="alert">
          {{ validationError }}
        </p>
        <VbenButton type="button" variant="outline" @click="addRateLimit">
          <IconifyIcon icon="lucide:plus" class="text-primary mr-1 size-4" />
          {{ $t('tb.components.rateLimit.actions.add') }}
        </VbenButton>
        <fieldset class="border-border min-w-0 rounded-md border p-3">
          <legend class="text-muted-foreground px-1 text-sm">
            {{ $t('tb.components.rateLimit.sections.preview') }}
          </legend>
          <p class="text-sm break-words">{{ preview }}</p>
        </fieldset>
      </div>
    </Modal>
  </div>
</template>
