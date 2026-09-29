<script setup lang="ts">
import type { AlarmRuleFilter } from '#/api/tb/alarm-rule';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import { filterSummary, validateFilter } from '../form-data';
import { useEditorDraft } from '../use-editor-draft';
import { useFormNode } from '../use-form-node';
import FilterFields from './filter-fields.vue';
import ValidationBoundary from './validation-boundary.vue';
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  argumentNames: string[];
  usedArguments: string[];
  number: number;
  create?: boolean;
  tableRow?: boolean;
}>();
const emit = defineEmits<{ remove: []; cancel: [] }>();
const model = defineModel<AlarmRuleFilter>({ required: true });
function validateFormValues(value: AlarmRuleFilter) {
  return props.usedArguments.includes(value.argument)
    ? [
        {
          fieldName: 'argument',
          message: $t('alarm-rule.validation.duplicateFilter'),
        },
      ]
    : validateFilter(value, props.argumentNames);
}
const { invalid, ownErrors } = useFormNode(() => [
  validateFormValues(model.value),
]);
const { Modal, modalApi, draft, isEditing, error, boundaryRef, contentRef } =
  useEditorDraft({
    get: () => model.value,
    set: (value) => {
      model.value = value;
    },
    validate: validateFormValues,
    create: props.create,
    onCancel: () => emit('cancel'),
  });
</script>
<template>
  <div
    v-if="!create"
    v-bind="$attrs"
    :class="tableRow ? 'min-w-0' : 'flex min-w-0 items-start gap-2'"
  >
    <template v-if="tableRow">
      <div
        class="p-4"
        :data-alarm-invalid="invalid ? '' : undefined"
        tabindex="-1"
      >
        <div
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 text-sm"
        >
          <span class="break-all">{{ model.argument }}</span>
          <span>{{ $t(`alarm-rule.options.${model.valueType}`) }}</span>
          <div class="flex items-center gap-1">
            <VbenButton
              type="button"
              variant="ghost"
              size="icon"
              class="text-primary size-8"
              :aria-label="`${$t('alarm-rule.actions.editFilter')} ${model.argument}`"
              :aria-invalid="invalid"
              @click="modalApi.open()"
            >
              <IconifyIcon icon="lucide:pencil" class="size-4" />
            </VbenButton>
            <VbenButton
              type="button"
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive size-8"
              :aria-label="`${$t('alarm-rule.actions.remove')} ${model.argument}`"
              @click="emit('remove')"
            >
              <IconifyIcon icon="lucide:x" class="size-4" />
            </VbenButton>
          </div>
        </div>
        <p
          v-if="invalid && ownErrors[0]"
          role="alert"
          class="text-destructive mt-2 text-xs"
        >
          {{ ownErrors[0] }}
        </p>
      </div>
    </template>
    <template v-else>
      <VbenButton
        type="button"
        variant="outline"
        class="h-auto min-h-10 min-w-0 flex-1 justify-between gap-3 whitespace-normal text-left font-normal"
        :aria-label="$t('alarm-rule.sections.filterNumber', { number })"
        :aria-invalid="invalid"
        :class="{ 'border-destructive text-destructive': invalid }"
        @click="modalApi.open()"
      >
        <span class="min-w-0 break-all">{{ filterSummary(model) }}</span>
        <IconifyIcon icon="lucide:square-pen" class="size-4 shrink-0" />
      </VbenButton>
      <VbenButton
        type="button"
        variant="ghost"
        size="icon"
        :aria-label="$t('alarm-rule.actions.remove')"
        @click="emit('remove')"
      >
        <IconifyIcon icon="lucide:trash-2" class="size-4" />
      </VbenButton>
    </template>
  </div>
  <Modal
    content-class="px-6 pt-5 pb-1"
    class="w-[calc(100%_-_2rem)] max-w-6xl rounded-xl"
    :title="$t('alarm-rule.sections.filterNumber', { number })"
    :confirm-text="$t('tb.common.save')"
  >
    <div v-if="isEditing" :ref="contentRef" class="space-y-4">
      <ValidationBoundary :ref="boundaryRef">
        <FilterFields
          v-model="draft"
          :argument-names="argumentNames"
          :used-arguments="usedArguments"
          :number="number"
        />
      </ValidationBoundary>
      <p
        v-if="error"
        role="alert"
        class="text-destructive text-sm"
        data-alarm-invalid
        tabindex="-1"
      >
        {{ error }}
      </p>
    </div>
  </Modal>
</template>
