<script setup lang="ts">
import type { AlarmRuleValue } from '#/api/tb/alarm-rule';

import { computed, useId } from 'vue';

import { Input, VbenSelect } from '@vben-core/shadcn-ui';

import { DatePicker, InputNumber, Segmented } from 'antdv-next';
import dayjs from 'dayjs';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import TbSwitch from '#/adapter/component/tb-switch.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { createDefaultRuleValue } from '../form-data';

const props = defineProps<{
  argumentNames: string[];
  excludedArgument?: string;
  kind: 'BOOLEAN' | 'DATE_TIME' | 'NUMERIC' | 'POSITIVE' | 'STRING';
  label?: string;
  table?: boolean;
  segmented?: boolean;
}>();
const model = defineModel<AlarmRuleValue<boolean | number | string>>({
  required: true,
});
const booleanId = useId();
const dateValue = computed({
  get: () =>
    typeof model.value.staticValue === 'number' &&
    Number.isFinite(model.value.staticValue)
      ? dayjs(model.value.staticValue)
      : null,
  set: (value) => {
    model.value = {
      staticValue: value?.isValid() ? value.valueOf() : undefined,
    };
  },
});
const dynamic = computed(
  () => typeof model.value.dynamicValueArgument === 'string',
);
const argumentValues = computed(() =>
  props.argumentNames
    .filter((name) => name !== props.excludedArgument)
    .map((value) => ({ value, label: value })),
);
function handleSetMode(value: boolean) {
  model.value = value
    ? { dynamicValueArgument: argumentValues.value[0]?.value ?? '' }
    : { staticValue: createDefaultRuleValue(props.kind) };
}
</script>
<template>
  <component
    :is="segmented ? FormSection : 'div'"
    :size="segmented ? 'small' : undefined"
    :content-class="segmented ? 'space-y-4' : undefined"
    :class="table ? 'contents' : segmented ? 'min-w-0' : 'min-w-0 space-y-2'"
  >
    <div v-if="table" class="min-w-0 space-y-2">
      <span class="text-muted-foreground text-xs sm:hidden">{{
        $t('alarm-rule.fields.valueSource')
      }}</span>
      <VbenSelect
        :model-value="dynamic ? 'dynamic' : 'static'"
        :options="[
          { value: 'static', label: $t('alarm-rule.options.static') },
          { value: 'dynamic', label: $t('alarm-rule.options.dynamic') },
        ]"
        :aria-label="$t('alarm-rule.fields.valueSource')"
        class="min-h-10 w-full"
        @update:model-value="(value) => handleSetMode(value === 'dynamic')"
      />
    </div>
    <div v-else class="flex flex-wrap items-center justify-between gap-2">
      <span
        :class="
          segmented ? 'text-sm font-semibold' : 'text-muted-foreground text-xs'
        "
        >{{ label || $t('alarm-rule.fields.value') }}</span>
      <Segmented
        shape="round"
        v-if="segmented"
        :value="dynamic ? 'dynamic' : 'static'"
        :options="[
          { value: 'static', label: $t('alarm-rule.options.static') },
          { value: 'dynamic', label: $t('alarm-rule.options.dynamic') },
        ]"
        :aria-label="$t('alarm-rule.fields.valueSource')"
        @update:value="(value) => handleSetMode(value === 'dynamic')"
      />
      <span v-else class="inline-flex items-center gap-2 text-xs">
        {{ $t('alarm-rule.options.dynamic') }}
        <TbSwitch
          :checked="dynamic"
          :aria-label="$t('alarm-rule.options.dynamic')"
          @update:checked="handleSetMode"
        />
      </span>
    </div>
    <div
      :class="
        $slots.suffix
          ? 'grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]'
          : 'min-w-0 space-y-2'
      "
    >
      <span v-if="table" class="text-muted-foreground text-xs sm:hidden">{{
        label || $t('alarm-rule.fields.value')
      }}</span>
      <VbenSelect
        v-if="dynamic"
        :model-value="model.dynamicValueArgument"
        :options="argumentValues"
        :aria-label="label || $t('alarm-rule.fields.argument')"
        class="w-full"
        @update:model-value="
          (value) => (model = { dynamicValueArgument: String(value) })
        "
      />
      <div
        v-else-if="kind === 'BOOLEAN'"
        class="flex min-h-10 items-center gap-2"
      >
        <TbCheckbox
          :id="booleanId"
          :checked="model.staticValue === true"
          @update:checked="(value) => (model = { staticValue: value })"
        />
        <label :for="booleanId" class="cursor-pointer text-sm">{{
          model.staticValue === true ? 'True' : 'False'
        }}</label>
      </div>
      <DatePicker
        v-else-if="kind === 'DATE_TIME'"
        v-model:value="dateValue"
        show-time
        format="YYYY-MM-DD HH:mm:ss"
        :aria-label="label || $t('alarm-rule.fields.value')"
        class="!min-h-10 !w-full"
      />
      <Input
        v-else-if="kind === 'STRING'"
        :model-value="String(model.staticValue ?? '')"
        :aria-label="label || $t('alarm-rule.fields.value')"
        @update:model-value="
          (value) => (model = { staticValue: String(value) })
        "
      />
      <InputNumber
        v-else
        :value="
          typeof model.staticValue === 'number' ? model.staticValue : undefined
        "
        :min="kind === 'POSITIVE' ? 1 : undefined"
        :max="kind === 'POSITIVE' ? 2147483647 : undefined"
        :precision="kind === 'POSITIVE' ? 0 : undefined"
        :aria-label="label || $t('alarm-rule.fields.value')"
        class="!w-full"
        @update:value="(value) => (model = { staticValue: value ?? undefined })"
      />
      <slot></slot>
      <slot name="suffix"></slot>
    </div>
  </component>
</template>
