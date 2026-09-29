<script setup lang="ts">
import type { AlarmRuleScriptTestRequest } from '../form-data';

import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type { AlarmRule, AlarmRuleFilter } from '#/api/tb/alarm-rule';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { VbenSelect } from '@vben-core/shadcn-ui';

import { Segmented } from 'antdv-next';

import ScriptEditor from '#/adapter/component/code-editor/script-editor.vue';
import ScriptTest from '#/adapter/component/script-test/index.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import {
  createDefaultPredicate,
  hasNoData,
  options,
  units,
  validateCondition,
} from '../form-data';
import { useFormNode } from '../use-form-node';
import ConditionPreviewContent from './condition-preview-content.vue';
import FilterEditor from './filter-editor.vue';
import ValueEditor from './value-editor.vue';
const props = defineProps<{ argumentNames: string[] }>();
const emit = defineEmits<{ test: [request: AlarmRuleScriptTestRequest] }>();
const scriptParameters = computed(() => [
  { name: 'ctx', type: 'object' },
  ...props.argumentNames.map((name) => ({ name })),
]);
const scriptTitle = computed(
  () =>
    `function expression(${scriptParameters.value.map(({ name }) => name).join(', ')}) {`,
);
const model = defineModel<AlarmRule['condition']>({ required: true });
// Render the test dialog under the condition dialog so modal stacking and focus share the same parent.
const [TestModal, testApi] = useVbenModal<ScriptTestData>({
  connectedComponent: ScriptTest,
  destroyOnClose: true,
});
let active = true;
let testRequest = 0;
onBeforeUnmount(() => {
  active = false;
  testRequest++;
});
function requestTest(expression: string) {
  const request = ++testRequest;
  emit('test', {
    expression,
    open(data) {
      if (active && request === testRequest) testApi.setData(data).open();
    },
    onApply(value) {
      if (active && request === testRequest)
        model.value.expression.expression = value;
    },
  });
}
const { invalid, ownErrors } = useFormNode(() => [
  validateCondition(model.value, props.argumentNames),
]);
const noData = computed(
  () =>
    model.value.expression.type === 'SIMPLE' &&
    !!model.value.expression.filters?.some((filter) =>
      hasNoData(filter.predicates),
    ),
);
watch(
  noData,
  (value) => {
    if (value) model.value.type = 'SIMPLE';
  },
  { immediate: true },
);
function handleSetType(value: unknown) {
  if (!['DURATION', 'REPEATING', 'SIMPLE'].includes(String(value))) return;
  model.value.type = value as AlarmRule['condition']['type'];
  if (value === 'DURATION') {
    model.value.value ??= { staticValue: 1 };
    model.value.unit ??= 'SECONDS';
  }
  if (value === 'REPEATING') model.value.count ??= { staticValue: 1 };
}
const pendingFilter = ref<AlarmRuleFilter>();
function handleAddFilter() {
  const argument = props.argumentNames.find(
    (name) => !model.value.expression.filters?.some((f) => f.argument === name),
  );
  if (!argument) return;
  pendingFilter.value = {
    argument,
    valueType: 'NUMERIC',
    operation: 'AND',
    predicates: [createDefaultPredicate('NUMERIC')],
  };
}
</script>
<template>
  <div class="space-y-5">
    <FormSection
      size="small"
      :title="$t('alarm-rule.fields.expression')"
      content-class="space-y-4"
    >
      <template #actions>
        <Segmented
          shape="round"
          v-model:value="model.expression.type"
          :options="options(['SIMPLE', 'TBEL'])"
          :aria-label="$t('alarm-rule.fields.expression')"
        />
      </template>
      <template v-if="model.expression.type === 'SIMPLE'">
        <FormSection
          size="small"
          :title="$t('alarm-rule.sections.filters')"
          content-class="space-y-4"
        >
          <template #actions>
            <Segmented
              shape="round"
              :value="model.expression.operation ?? 'AND'"
              :options="options(['AND', 'OR'])"
              :aria-label="$t('alarm-rule.fields.matchFilters')"
              @update:value="
                (value) =>
                  (model.expression.operation = value === 'OR' ? 'OR' : 'AND')
              "
            />
          </template>
          <FormSection size="small" content-class="p-0" class="overflow-hidden">
            <div
              class="bg-muted/30 border-border grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b px-4 py-3 text-sm font-medium"
            >
              <span>{{ $t('alarm-rule.fields.argumentName') }}</span>
              <span>{{ $t('alarm-rule.fields.valueType') }}</span>
              <span class="w-[4.25rem]" aria-hidden="true"></span>
            </div>
            <div
              v-for="(filter, index) in model.expression.filters"
              :key="index"
              class="relative"
              :class="{ 'border-border border-t': index > 0 }"
            >
              <span
                v-if="index > 0"
                class="bg-primary text-primary-foreground border-primary absolute left-4 top-0 z-10 -translate-y-1/2 rounded border px-1.5 text-xs leading-4"
                >{{
                  model.expression.operation === 'OR'
                    ? $t('alarm-rule.options.joinOr')
                    : $t('alarm-rule.options.joinAnd')
                }}</span>
              <FilterEditor
                table-row
                :model-value="filter"
                :number="index + 1"
                :argument-names="argumentNames"
                :used-arguments="
                  (model.expression.filters ?? [])
                    .filter((_, i) => i !== index)
                    .map((f) => f.argument)
                "
                @update:model-value="
                  (value) =>
                    model.expression.filters &&
                    (model.expression.filters[index] = value)
                "
                @remove="model.expression.filters?.splice(index, 1)"
              />
            </div>
            <p
              v-if="!model.expression.filters?.length"
              class="text-muted-foreground p-4 text-sm"
            >
              {{ $t('alarm-rule.messages.noFilterPreview') }}
            </p>
          </FormSection>
          <FilterEditor
            v-if="pendingFilter"
            :model-value="pendingFilter"
            create
            :number="(model.expression.filters?.length ?? 0) + 1"
            :argument-names="argumentNames"
            :used-arguments="
              (model.expression.filters ?? []).map((f) => f.argument)
            "
            @update:model-value="
              (value) => {
                (model.expression.filters ??= []).push(value);
                pendingFilter = undefined;
              }
            "
            @cancel="pendingFilter = undefined"
          />
          <VbenButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="
              !argumentNames.some(
                (name) =>
                  !model.expression.filters?.some((f) => f.argument === name),
              )
            "
            @click="handleAddFilter"
          >
            <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />{{
              $t('alarm-rule.actions.addFilter')
            }}
          </VbenButton>
        </FormSection>
        <FormSection
          collapsible
          size="small"
          :title="$t('alarm-rule.sections.filterPreview')"
        >
          <ConditionPreviewContent :condition="model" />
        </FormSection>
      </template>
      <ScriptEditor
        v-else
        :model-value="model.expression.expression ?? ''"
        language="tbel"
        :title="scriptTitle"
        :height="220"
        :parameters="scriptParameters"
        :test-handler="requestTest"
        :placeholder="$t('alarm-rule.messages.scriptHint')"
        @update:model-value="(value) => (model.expression.expression = value)"
      />
    </FormSection>
    <FormSection
      size="small"
      :title="$t('alarm-rule.fields.conditionType')"
      content-class="space-y-4"
    >
      <template #actions>
        <Segmented
          shape="round"
          :value="model.type"
          :options="
            options(['SIMPLE', 'DURATION', 'REPEATING']).map((item) => ({
              ...item,
              disabled: noData && item.value !== 'SIMPLE',
            }))
          "
          :aria-label="$t('alarm-rule.fields.conditionType')"
          @update:value="handleSetType"
        />
      </template>
      <p v-if="noData" class="text-muted-foreground text-xs">
        {{ $t('alarm-rule.messages.noDataHint') }}
      </p>
      <ValueEditor
        v-if="model.type === 'DURATION' && model.value"
        v-model="model.value"
        segmented
        kind="POSITIVE"
        :argument-names="argumentNames"
        :label="$t('alarm-rule.fields.value')"
      >
        <template #suffix>
          <label class="grid gap-2 text-sm">
            <span class="sr-only">{{ $t('alarm-rule.fields.unit') }}</span>
            <VbenSelect
              v-model="model.unit"
              :options="options(units)"
              :aria-label="$t('alarm-rule.fields.unit')"
              class="min-h-10 w-full"
            />
          </label>
        </template>
      </ValueEditor>
      <template v-if="model.type === 'REPEATING'">
        <ValueEditor
          v-if="model.count"
          v-model="model.count"
          segmented
          kind="POSITIVE"
          :argument-names="argumentNames"
          :label="$t('alarm-rule.fields.count')"
        />
        <p class="text-muted-foreground text-xs">
          {{ $t('alarm-rule.messages.countHint') }}
        </p>
      </template>
    </FormSection>
    <p
      v-if="invalid && ownErrors[0]"
      role="alert"
      class="text-destructive text-xs"
      data-alarm-invalid
      tabindex="-1"
    >
      {{ ownErrors[0] }}
    </p>
    <TestModal />
  </div>
</template>
