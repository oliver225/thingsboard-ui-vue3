<script setup lang="ts">
import type { AlarmRuleFilter } from '#/api/tb/alarm-rule';

import { computed } from 'vue';

import { VbenSelect } from '@vben-core/shadcn-ui';

import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { createDefaultPredicate, options } from '../form-data';
import { useFormNode } from '../use-form-node';
import PredicateEditor from './predicate-editor.vue';
const props = defineProps<{
  argumentNames: string[];
  usedArguments: string[];
  number: number;
}>();
const model = defineModel<AlarmRuleFilter>({ required: true });
const { invalid, ownErrors } = useFormNode(() =>
  props.argumentNames.includes(model.value.argument) &&
  !props.usedArguments.includes(model.value.argument)
    ? []
    : [$t('alarm-rule.validation.argument')],
);
const argumentOptions = computed(() =>
  props.argumentNames
    .filter(
      (name) =>
        name === model.value.argument || !props.usedArguments.includes(name),
    )
    .map((value) => ({ value, label: value })),
);
function handleChangeType(value: unknown) {
  const type = ['STRING', 'NUMERIC', 'BOOLEAN', 'DATE_TIME'].find(
    (type) => type === value,
  ) as AlarmRuleFilter['valueType'] | undefined;
  if (type)
    model.value = {
      ...model.value,
      valueType: type,
      predicates: [createDefaultPredicate(type)],
    };
}
</script>
<template>
  <div class="space-y-5">
    <FormSection
      size="small"
      :title="$t('alarm-rule.sections.general')"
      content-class="space-y-4"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <label
          class="grid gap-2 text-sm"
          :data-alarm-invalid="invalid && ownErrors.length ? '' : undefined"
          tabindex="-1"
          ><span>{{ $t('alarm-rule.fields.argument') }}</span><VbenSelect
            v-model="model.argument"
            :options="argumentOptions"
            :aria-label="$t('alarm-rule.fields.argument')"
            :aria-invalid="invalid && !!ownErrors.length"
            class="w-full"
        /></label>
        <label class="grid gap-2 text-sm"><span>{{ $t('alarm-rule.fields.valueType') }}</span><VbenSelect
            :model-value="model.valueType"
            :options="options(['STRING', 'NUMERIC', 'BOOLEAN', 'DATE_TIME'])"
            :aria-label="$t('alarm-rule.fields.valueType')"
            class="w-full"
            @update:model-value="handleChangeType"
        /></label>
      </div>
      <p
        v-if="invalid && ownErrors[0]"
        role="alert"
        class="text-destructive text-xs"
      >
        {{ ownErrors[0] }}
      </p>
      <p
        v-if="model.valueType === 'DATE_TIME'"
        class="text-muted-foreground text-xs"
      >
        {{ $t('alarm-rule.messages.dateTimeHint') }}
      </p>
    </FormSection>
    <PredicateEditor
      v-model="model.predicates"
      v-model:operation="model.operation"
      :value-type="model.valueType"
      :argument-names="argumentNames"
      :argument="model.argument"
    />
  </div>
</template>
