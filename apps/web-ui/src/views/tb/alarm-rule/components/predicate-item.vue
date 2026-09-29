<script setup lang="ts">
import type { AlarmRuleFilter, AlarmRulePredicate } from '#/api/tb/alarm-rule';

import { computed } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import { predicateSummary, validatePredicate } from '../form-data';
import { useEditorDraft } from '../use-editor-draft';
import { useFormNode } from '../use-form-node';
import PredicateEditor from './predicate-editor.vue';
import ValidationBoundary from './validation-boundary.vue';

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  valueType: AlarmRuleFilter['valueType'];
  argumentNames: string[];
  argument: string;
  number: number;
  create?: boolean;
}>();
const emit = defineEmits<{ remove: []; cancel: [] }>();
const model = defineModel<AlarmRulePredicate>({ required: true });
const title = computed(() =>
  $t('alarm-rule.sections.groupNumber', { number: props.number }),
);
const validateFormValues = (value: AlarmRulePredicate) =>
  validatePredicate(
    value,
    props.valueType,
    props.argumentNames,
    props.argument,
  );
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
    class="flex min-w-0 items-start gap-2 py-3"
  >
    <div
      class="grid min-w-0 flex-1 items-start gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]"
    >
      <span class="pt-2 text-sm font-medium">{{ title }}</span>
      <div class="min-w-0">
        <VbenButton
          type="button"
          variant="outline"
          class="h-auto min-h-10 w-full justify-between gap-3 whitespace-normal text-left font-normal"
          :aria-label="title"
          :aria-invalid="invalid"
          :data-alarm-invalid="invalid ? '' : undefined"
          :class="{ 'border-destructive text-destructive': invalid }"
          @click="modalApi.open()"
        >
          <span class="line-clamp-2 min-w-0 break-all">{{
            predicateSummary(model, argument)
          }}</span>
          <IconifyIcon icon="lucide:square-pen" class="size-4 shrink-0" />
        </VbenButton>
        <p
          v-if="invalid && ownErrors[0]"
          role="alert"
          class="text-destructive mt-1 text-xs"
        >
          {{ ownErrors[0] }}
        </p>
      </div>
    </div>
    <VbenButton
      type="button"
      variant="ghost"
      size="icon"
      class="text-muted-foreground hover:text-destructive shrink-0"
      :aria-label="$t('alarm-rule.actions.remove')"
      @click="emit('remove')"
    >
      <IconifyIcon icon="lucide:trash-2" class="size-4" />
    </VbenButton>
  </div>
  <Modal
    content-class="px-6 pt-5 pb-1"
    class="w-[calc(100%_-_2rem)] max-w-5xl rounded-xl"
    :title="title"
    :confirm-text="$t('tb.common.save')"
  >
    <div v-if="isEditing" :ref="contentRef" class="space-y-4">
      <ValidationBoundary :ref="boundaryRef">
        <PredicateEditor
          v-if="draft.predicates"
          v-model="draft.predicates"
          v-model:operation="draft.operation"
          :value-type="valueType"
          :argument-names="argumentNames"
          :argument="argument"
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
