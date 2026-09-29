<script setup lang="ts">
import type { AlarmRuleScriptTestRequest } from '../form-data';

import type { AlarmRule } from '#/api/tb/alarm-rule';
import type { AlarmSeverity } from '#/enums';

import { computed, ref, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Textarea, VbenSelect } from '@vben-core/shadcn-ui';

import { Alert } from 'antdv-next';

import { EntityInput } from '#/adapter/component';
import { FormSection } from '#/components/form-section';
import { alarmSeverityLabel } from '#/enums';
import { $t } from '#/locales';

import {
  conditionSummary,
  scheduleSummary,
  severities,
  severityColors,
  validateCondition,
  validateSchedule,
} from '../form-data';
import { useEditorDraft } from '../use-editor-draft';
import { useFormNode } from '../use-form-node';
import ConditionFields from './condition-fields.vue';
import ConditionPreviewContent from './condition-preview-content.vue';
import ScheduleFields from './schedule-fields.vue';
import ValidationBoundary from './validation-boundary.vue';
const props = defineProps<{
  argumentNames: string[];
  severity?: AlarmSeverity;
  usedSeverities?: string[];
}>();
const emit = defineEmits<{
  remove: [];
  severity: [value: AlarmSeverity];
  test: [request: AlarmRuleScriptTestRequest];
}>();
const model = defineModel<AlarmRule>({ required: true });
const { errors, invalid, validationRun } = useFormNode(() => [
  validateCondition(model.value.condition, props.argumentNames),
  validateSchedule(model.value.condition.schedule, props.argumentNames),
]);
const open = ref(true);
watch(
  [invalid, validationRun],
  ([value]) => {
    if (value) open.value = true;
  },
  { immediate: true },
);
const schedule = computed({
  get: () =>
    model.value.condition.schedule ?? {
      staticValue: { type: 'ANY_TIME' as const },
    },
  set: (value) => (model.value.condition.schedule = value),
});
const severityOptions = computed(() =>
  severities
    .filter(
      (value) =>
        value === props.severity || !props.usedSeverities?.includes(value),
    )
    .map((value) => ({ value, label: alarmSeverityLabel(value) })),
);

const {
  Modal: ConditionModal,
  modalApi: conditionApi,
  draft: conditionDraft,
  isEditing: conditionEditing,
  error: conditionDraftError,
  boundaryRef: conditionBoundaryRef,
  contentRef: conditionContentRef,
} = useEditorDraft({
  get: () => model.value.condition,
  set: (value) => {
    model.value.condition = value;
  },
  validate: (value) => validateCondition(value, props.argumentNames),
});
const {
  Modal: ScheduleModal,
  modalApi: scheduleApi,
  draft: scheduleDraft,
  isEditing: scheduleEditing,
  error: scheduleDraftError,
  boundaryRef: scheduleBoundaryRef,
  contentRef: scheduleContentRef,
} = useEditorDraft({
  get: () => schedule.value,
  set: (value) => {
    schedule.value = value;
  },
  validate: (value) => validateSchedule(value, props.argumentNames),
});
const {
  Modal: DetailsModal,
  modalApi: detailsApi,
  draft: detailsDraft,
  isEditing: detailsEditing,
} = useEditorDraft({
  get: () => model.value.alarmDetails ?? '',
  set: (value) => {
    model.value.alarmDetails = value;
  },
});
const editors = computed(() => [
  {
    key: 'condition',
    title: $t('alarm-rule.fields.condition'),
    summary: conditionSummary(model.value.condition),
    error: validateCondition(model.value.condition, props.argumentNames)[0]
      ?.message,
    modalApi: conditionApi,
  },
  {
    key: 'schedule',
    title: $t('alarm-rule.fields.schedule'),
    summary: scheduleSummary(schedule.value),
    error: validateSchedule(schedule.value, props.argumentNames)[0]?.message,
    modalApi: scheduleApi,
  },
  {
    key: 'details',
    title: $t('alarm-rule.fields.details'),
    summary: model.value.alarmDetails || $t('alarm-rule.options.optional'),
    error: undefined,
    modalApi: detailsApi,
  },
]);
</script>
<template>
  <FormSection
    v-model:open="open"
    collapsible
    size="small"
    :title="
      severity
        ? alarmSeverityLabel(severity)
        : $t('alarm-rule.sections.clearCondition')
    "
    class="overflow-hidden border-l-4"
    :style="{
      borderLeftColor: severity
        ? severityColors[severity]
        : 'hsl(var(--muted-foreground))',
    }"
  >
    <template #actions>
      <span
        class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
        :class="
          invalid
            ? 'bg-destructive/10 text-destructive'
            : errors.length
              ? 'bg-muted text-muted-foreground'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        "
        role="status"
        ><IconifyIcon
          :icon="errors.length ? 'lucide:circle-alert' : 'lucide:circle-check'"
          class="size-3.5"
        /><span class="sr-only sm:not-sr-only">{{
          $t(
            `alarm-rule.options.status.${invalid ? 'invalid' : errors.length ? 'incomplete' : 'valid'}`,
          )
        }}</span></span>
      <VbenButton
        type="button"
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-destructive size-7"
        :aria-label="$t('alarm-rule.actions.remove')"
        @click="emit('remove')"
      >
        <IconifyIcon icon="lucide:trash-2" class="size-4" />
      </VbenButton>
    </template>
    <div
      v-if="severity"
      class="border-border grid items-start gap-2 border-b py-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
    >
      <span class="pt-2 text-sm font-medium">{{
        $t('alarm-rule.fields.severity')
      }}</span>
      <VbenSelect
        :model-value="severity"
        :options="severityOptions"
        :aria-label="$t('alarm-rule.fields.severity')"
        class="min-h-10 w-full"
        @update:model-value="
          (value) => emit('severity', value as AlarmSeverity)
        "
      />
    </div>
    <div class="divide-border divide-y">
      <div
        v-for="editor in editors"
        :key="editor.key"
        class="grid items-start gap-2 py-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
      >
        <span class="pt-2 text-sm font-medium">{{ editor.title }}</span>
        <div class="min-w-0">
          <VbenButton
            type="button"
            variant="outline"
            class="h-auto min-h-10 w-full justify-between gap-3 whitespace-normal text-left font-normal"
            :class="{
              'border-destructive text-destructive': invalid && editor.error,
            }"
            :aria-label="editor.title"
            :aria-invalid="!!(invalid && editor.error)"
            :data-alarm-invalid="invalid && editor.error ? '' : undefined"
            @click="editor.modalApi.open()"
          >
            <ConditionPreviewContent
              v-if="editor.key === 'condition'"
              :condition="model.condition"
            />
            <span
              v-else
              class="line-clamp-2 min-w-0 break-all"
              :title="editor.summary"
              >{{ editor.summary }}</span>
            <IconifyIcon icon="lucide:square-pen" class="size-4 shrink-0" />
          </VbenButton>
          <p
            v-if="invalid && editor.error"
            role="alert"
            class="text-destructive mt-1 text-xs"
          >
            {{ editor.error }}
          </p>
        </div>
      </div>
      <div
        class="grid items-start gap-2 py-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
      >
        <span class="pt-2 text-sm font-medium">{{
          $t('alarm-rule.fields.dashboard')
        }}</span>
        <EntityInput
          v-model="model.dashboardId"
          entity-type="DASHBOARD"
          object-id
          :params="{ sortProperty: 'title', sortOrder: 'ASC' }"
          show-search
          :aria-label="$t('alarm-rule.fields.dashboard')"
          :placeholder="$t('alarm-rule.actions.set')"
          class="w-full min-w-0"
        />
      </div>
    </div>
  </FormSection>

  <ConditionModal
    content-ref-class="px-6 pt-5 pb-1"
    class="w-[calc(100%_-_2rem)] max-w-5xl rounded-xl"
    :title="$t('alarm-rule.actions.editCondition')"
    :confirm-text="$t('tb.common.save')"
  >
    <div v-if="conditionEditing" :ref="conditionContentRef" class="space-y-4">
      <ValidationBoundary :ref="conditionBoundaryRef">
        <ConditionFields
          v-model="conditionDraft"
          :argument-names="argumentNames"
          @test="(request) => emit('test', request)"
        />
      </ValidationBoundary>
      <p
        v-if="conditionDraftError"
        role="alert"
        class="text-destructive text-sm"
        data-alarm-invalid
        tabindex="-1"
      >
        {{ conditionDraftError }}
      </p>
    </div>
  </ConditionModal>
  <ScheduleModal
    content-ref-class="px-6 pt-5 pb-1"
    class="w-[calc(100%_-_2rem)] max-w-5xl rounded-xl"
    :title="$t('alarm-rule.actions.editSchedule')"
    :confirm-text="$t('tb.common.save')"
  >
    <div v-if="scheduleEditing" :ref="scheduleContentRef" class="space-y-4">
      <ValidationBoundary :ref="scheduleBoundaryRef">
        <ScheduleFields
          v-model="scheduleDraft"
          :argument-names="argumentNames"
        />
      </ValidationBoundary>
      <p
        v-if="scheduleDraftError"
        role="alert"
        class="text-destructive text-sm"
        data-alarm-invalid
        tabindex="-1"
      >
        {{ scheduleDraftError }}
      </p>
    </div>
  </ScheduleModal>
  <DetailsModal
    content-ref-class="px-6 pt-5 pb-1"
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    :title="$t('alarm-rule.fields.details')"
    :confirm-text="$t('tb.common.save')"
  >
    <template v-if="detailsEditing">
      <Alert
        class="mb-5 rounded-md"
        type="warning"
        show-icon
        :message="
          $t('alarm-rule.messages.detailsHint', {
            parameter: `\${${$t('alarm-rule.fields.argumentName')}}`,
          })
        "
      />
      <Textarea
        v-model="detailsDraft"
        :rows="6"
        :aria-label="$t('alarm-rule.fields.details')"
        :placeholder="$t('alarm-rule.messages.detailsPlaceholder')"
      />
    </template>
  </DetailsModal>
</template>
