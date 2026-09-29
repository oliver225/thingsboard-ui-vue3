<script setup lang="ts">
import type { AlarmRuleFilter, AlarmRulePredicate } from '#/api/tb/alarm-rule';

import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Segmented } from 'antdv-next';

import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { createDefaultPredicate, options } from '../form-data';
import { useFormNode } from '../use-form-node';
import PredicateItem from './predicate-item.vue';
import PredicateRow from './predicate-row.vue';

const props = defineProps<{
  valueType: AlarmRuleFilter['valueType'];
  argumentNames: string[];
  argument: string;
}>();
const model = defineModel<AlarmRulePredicate[]>({ required: true });
const operation = defineModel<string>('operation', { required: true });
const pending = ref<AlarmRulePredicate>();
const { invalid, ownErrors } = useFormNode(() =>
  model.value.length > 0 ? [] : [$t('alarm-rule.validation.group')],
);
function handleAdd(group = false) {
  if (group)
    pending.value = { type: 'COMPLEX', operation: 'AND', predicates: [] };
  else model.value.push(createDefaultPredicate(props.valueType));
}
</script>
<template>
  <FormSection
    size="small"
    :title="$t('alarm-rule.fields.predicateFilters')"
    content-class="space-y-4"
  >
    <template #actions>
      <Segmented
        shape="round"
        v-model:value="operation"
        :options="options(['AND', 'OR'])"
        :aria-label="$t('alarm-rule.fields.matchPredicates')"
      />
    </template>
    <FormSection size="small" content-class="p-0" class="overflow-hidden">
      <div
        class="bg-muted/40 text-muted-foreground border-border hidden gap-3 border-b px-4 py-3 text-xs font-medium sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_2rem]"
      >
        <span>{{ $t('alarm-rule.fields.operation') }}</span>
        <span>{{ $t('alarm-rule.fields.valueSource') }}</span>
        <span>{{ $t('alarm-rule.fields.value') }}</span>
        <span class="sr-only">{{ $t('alarm-rule.actions.remove') }}</span>
      </div>
      <div>
        <div
          v-for="(item, index) in model"
          :key="index"
          class="relative"
          :class="{ 'border-border border-t': index > 0 }"
        >
          <span
            v-if="index > 0"
            class="bg-primary text-primary-foreground border-primary absolute left-4 top-0 z-10 -translate-y-1/2 rounded border px-1.5 text-xs leading-4"
            >{{
              operation === 'OR'
                ? $t('alarm-rule.options.joinOr')
                : $t('alarm-rule.options.joinAnd')
            }}</span>
          <PredicateItem
            v-if="item.type === 'COMPLEX'"
            class="px-4"
            :key="index"
            :model-value="item"
            :number="index + 1"
            :value-type="valueType"
            :argument-names="argumentNames"
            :argument="argument"
            @update:model-value="(value) => (model[index] = value)"
            @remove="model.splice(index, 1)"
          />
          <PredicateRow
            v-else
            :model-value="item"
            :number="index + 1"
            :value-type="valueType"
            :argument-names="argumentNames"
            :argument="argument"
            @update:model-value="(value) => (model[index] = value)"
            @remove="model.splice(index, 1)"
          />
        </div>
      </div>
    </FormSection>
    <PredicateItem
      v-if="pending"
      :model-value="pending"
      create
      :number="model.length + 1"
      :value-type="valueType"
      :argument-names="argumentNames"
      :argument="argument"
      @update:model-value="
        (value) => {
          model.push(value);
          pending = undefined;
        }
      "
      @cancel="pending = undefined"
    />
    <p
      v-if="invalid"
      role="alert"
      class="text-destructive text-xs"
      data-alarm-invalid
      tabindex="-1"
    >
      {{ ownErrors[0] }}
    </p>
    <div class="flex flex-wrap gap-2">
      <VbenButton
        type="button"
        variant="outline"
        size="sm"
        @click="handleAdd()"
      >
        <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />{{
          $t('alarm-rule.actions.addPredicate')
        }}
      </VbenButton>
      <VbenButton
        type="button"
        variant="ghost"
        size="sm"
        @click="handleAdd(true)"
      >
        {{ $t('alarm-rule.actions.addGroup') }}
      </VbenButton>
    </div>
  </FormSection>
</template>
