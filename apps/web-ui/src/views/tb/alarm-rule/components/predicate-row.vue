<script setup lang="ts">
import type { AlarmRuleFilter, AlarmRulePredicate } from '#/api/tb/alarm-rule';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { VbenSelect } from '@vben-core/shadcn-ui';

import { $t } from '#/locales';

import {
  createDefaultPredicate,
  options,
  predicateOperations,
  units,
  validatePredicate,
} from '../form-data';
import { useFormNode } from '../use-form-node';
import ValueEditor from './value-editor.vue';

const props = defineProps<{
  valueType: AlarmRuleFilter['valueType'];
  argumentNames: string[];
  argument: string;
  number: number;
}>();
const emit = defineEmits<{ remove: [] }>();
const model = defineModel<AlarmRulePredicate>({ required: true });
const { invalid, ownErrors } = useFormNode(() => [
  validatePredicate(
    model.value,
    props.valueType,
    props.argumentNames,
    props.argument,
  ),
]);
function handleChangeOperation(value: unknown) {
  if (value === 'NO_DATA') {
    if (model.value.type !== 'NO_DATA')
      model.value = {
        type: 'NO_DATA',
        operation: 'NO_DATA',
        duration: { staticValue: 1 },
        unit: 'MINUTES',
      };
  } else {
    model.value = {
      ...(model.value.type === 'NO_DATA'
        ? createDefaultPredicate(props.valueType)
        : model.value),
      operation: String(value),
    };
  }
}
</script>

<template>
  <div class="p-4" :data-alarm-invalid="invalid ? '' : undefined" tabindex="-1">
    <div
      class="grid items-start gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_2rem]"
    >
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <span class="text-muted-foreground w-full text-xs sm:hidden">{{
          $t('alarm-rule.fields.operation')
        }}</span>
        <VbenSelect
          :model-value="model.operation"
          :options="options(predicateOperations(valueType))"
          :aria-label="$t('alarm-rule.fields.operation')"
          :aria-invalid="invalid"
          class="min-h-10 min-w-0 flex-1"
          @update:model-value="handleChangeOperation"
        />
        <VbenButton
          v-if="model.type === 'STRING'"
          type="button"
          size="sm"
          variant="outline"
          :aria-pressed="!!model.ignoreCase"
          class="h-8 shrink-0 rounded-full px-3 text-xs"
          :class="
            model.ignoreCase
              ? 'border-primary bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          "
          @click="model.ignoreCase = !model.ignoreCase"
        >
          {{ $t('alarm-rule.fields.ignoreCase') }}
        </VbenButton>
      </div>
      <ValueEditor
        v-if="model.type === 'NO_DATA' && model.duration"
        v-model="model.duration"
        table
        kind="POSITIVE"
        :argument-names="argumentNames"
        :excluded-argument="argument"
        :label="$t('alarm-rule.fields.duration')"
      >
        <VbenSelect
          v-model="model.unit"
          :options="options(units)"
          :aria-label="$t('alarm-rule.fields.unit')"
          class="w-full"
        />
      </ValueEditor>
      <ValueEditor
        v-else-if="model.value"
        v-model="model.value"
        table
        :kind="valueType"
        :argument-names="argumentNames"
        :excluded-argument="argument"
      />
      <VbenButton
        type="button"
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-destructive size-8 justify-self-end"
        :aria-label="`${$t('alarm-rule.actions.remove')} ${$t('alarm-rule.sections.predicateNumber', { number })}`"
        @click="emit('remove')"
      >
        <IconifyIcon icon="lucide:x" class="size-4" />
      </VbenButton>
    </div>
    <p v-if="invalid" role="alert" class="text-destructive mt-2 text-xs">
      {{ ownErrors[0] }}
    </p>
  </div>
</template>
