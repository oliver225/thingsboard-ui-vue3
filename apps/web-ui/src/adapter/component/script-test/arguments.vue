<script setup lang="ts">
import type { ArgumentValues } from '#/adapter/component/field-arguments/data';
import type { AttributeValueType as ValueType } from '#/enums/attribute';

import { computed, ref } from 'vue';

import { useVbenModal, VbenButton, VbenSelect } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, Checkbox, Input, InputNumber } from 'antdv-next';

import JsonEditor from '#/adapter/component/code-editor/json-editor.vue';
import { parseJsonText } from '#/adapter/component/code-editor/utils/json';
import { createTestArguments } from '#/adapter/component/field-arguments/data';
import {
  attributeValueTypeOptions,
  inferAttributeValueType,
} from '#/enums/attribute';
import { $t } from '#/locales';

interface TestArgumentRow {
  name: string;
  keyType: ArgumentValues['keyType'];
  ts: unknown;
  value: unknown;
  valueType: ValueType;
  json: string;
}

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  arguments: ArgumentValues[];
  samples?: Record<string, unknown>;
  disabled?: boolean;
}>();

const emit = defineEmits<{ change: [] }>();

function createTestArgumentRows(
  argumentsList: ArgumentValues[],
  samples?: Record<string, unknown>,
  now = Date.now(),
): TestArgumentRow[] {
  const initial = createTestArguments(argumentsList, now, samples);
  return argumentsList
    .filter((argument) => argument.name.trim())
    .map((argument) => {
      const sample = initial[argument.name.trim()];
      if (!sample) throw new Error(`Missing test argument: ${argument.name}`);
      const value = 'value' in sample ? sample.value : null;
      return {
        name: argument.name.trim(),
        keyType: argument.keyType,
        ts: 'ts' in sample ? sample.ts : null,
        value,
        valueType: inferAttributeValueType(value),
        json:
          JSON.stringify(
            argument.keyType === 'TS_ROLLING'
              ? { values: sample.values, timeWindow: sample.timeWindow }
              : value,
            null,
            2,
          ) ?? '',
      };
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function serializeTestArgumentRows(
  rows: TestArgumentRow[],
): Record<string, unknown> {
  return Object.fromEntries(
    rows.map((row) => {
      const fail = (key: string): never => {
        throw new Error(
          `${row.name}: ${$t(`tb.components.scriptTest.validation.${key}`)}`,
        );
      };
      if (row.keyType === 'TS_ROLLING') {
        const parsed = parseJsonText(row.json, {
          required: true,
          rootType: 'object',
        });
        if (!parsed.valid || !isRecord(parsed.value))
          return fail('testInvalidRolling');
        const { values, timeWindow } = parsed.value;
        if (!Array.isArray(values) || !isRecord(timeWindow))
          return fail('testInvalidRolling');
        const bounded = 'startTs' in timeWindow || 'endTs' in timeWindow;
        if (
          bounded &&
          (!isTimestamp(timeWindow.startTs) ||
            !isTimestamp(timeWindow.endTs) ||
            timeWindow.startTs > timeWindow.endTs)
        )
          return fail('testInvalidRolling');
        const points = values.map((point) => {
          if (
            !isRecord(point) ||
            !isTimestamp(point.ts) ||
            !Object.hasOwn(point, 'value')
          )
            return fail('testInvalidRolling');
          return { ts: point.ts, value: point.value };
        });
        return [
          row.name,
          {
            type: 'TS_ROLLING',
            values: points,
            timeWindow: bounded
              ? { startTs: timeWindow.startTs, endTs: timeWindow.endTs }
              : {},
          },
        ];
      }
      if (!isTimestamp(row.ts)) return fail('testInvalidTimestamp');
      let value = row.value;
      if (row.valueType === 'JSON') {
        const parsed = parseJsonText(row.json);
        if (
          !parsed.valid ||
          (parsed.value !== undefined &&
            parsed.value !== null &&
            typeof parsed.value !== 'object')
        )
          return fail('testInvalidValue');
        value = parsed.value ?? null;
      } else if (value !== null) {
        if (row.valueType === 'STRING' && typeof value !== 'string')
          return fail('testInvalidValue');
        if (row.valueType === 'BOOLEAN' && typeof value !== 'boolean')
          return fail('testInvalidValue');
        if (
          (row.valueType === 'INTEGER' || row.valueType === 'DOUBLE') &&
          (!isTimestamp(value) ||
            (row.valueType === 'INTEGER' && !Number.isInteger(value)))
        )
          return fail('testInvalidValue');
      }
      return [row.name, { type: 'SINGLE_VALUE', ts: row.ts, value }];
    }),
  );
}
const rows = ref(createTestArgumentRows(props.arguments, props.samples));
const valueTypes = computed(attributeValueTypeOptions);
const editingRow = ref<TestArgumentRow>();
const editorText = ref('');
const editorError = ref('');

function updateRow(row: TestArgumentRow, patch: Partial<TestArgumentRow>) {
  if (props.disabled) return;
  Object.assign(row, patch);
  emit('change');
}
function changeValueType(row: TestArgumentRow, value: unknown) {
  if (!valueTypes.value.some((option) => option.value === value)) return;
  let defaultValue: unknown = null;
  if (value === 'BOOLEAN') defaultValue = false;
  else if (value === 'JSON') defaultValue = {};
  updateRow(row, {
    valueType: value as ValueType,
    value: defaultValue,
    json: value === 'JSON' ? '{}' : '',
  });
}
function changeEditor(text: string) {
  if (props.disabled) return;
  editorText.value = text;
  editorError.value = '';
  emit('change');
}
const [DataModal, modalApi] = useVbenModal({
  onOpenChange(open) {
    if (!open) editingRow.value = undefined;
  },
  onConfirm() {
    const row = editingRow.value;
    if (!row || props.disabled) return;
    const parsed = parseJsonText(editorText.value, {
      required: true,
      rootType: 'object',
    });
    if (!parsed.valid || !isRecord(parsed.value)) {
      editorError.value = $t(
        'tb.components.scriptTest.validation.testArguments',
      );
      return;
    }
    const draft =
      row.keyType === 'TS_ROLLING'
        ? { ...row, json: editorText.value }
        : {
            ...row,
            ts: parsed.value.ts,
            value: parsed.value.value,
            valueType: inferAttributeValueType(parsed.value.value),
            json: JSON.stringify(parsed.value.value, null, 2) ?? '',
          };
    try {
      serializeTestArgumentRows([draft]);
      updateRow(row, draft);
      modalApi.close();
    } catch (error) {
      editorError.value = (error as Error).message;
    }
  },
});
function editData(row: TestArgumentRow) {
  if (props.disabled) return;
  editingRow.value = row;
  editorError.value = '';
  if (row.keyType === 'TS_ROLLING') editorText.value = row.json;
  else if (row.valueType === 'JSON') {
    editorText.value = `{
  "ts": ${JSON.stringify(row.ts)},
  "value": ${row.json.trim() || 'null'}
}`;
  } else {
    editorText.value = JSON.stringify(
      { ts: row.ts, value: row.value },
      null,
      2,
    );
  }
  modalApi
    .setState({
      title: $t('tb.components.scriptTest.sections.testDataTitle', {
        name: row.name,
      }),
    })
    .open();
}

defineExpose({ getArguments: () => serializeTestArgumentRows(rows.value) });
</script>

<template>
  <div
    v-bind="$attrs"
    class="border-border w-full min-w-0 overflow-auto rounded-lg border"
  >
    <table class="w-full min-w-[760px] table-fixed border-collapse text-sm">
      <thead class="bg-muted/40 sticky top-0 z-10">
        <tr class="border-border border-b text-left">
          <th class="w-1/6 px-3 py-2 font-medium">
            {{ $t('tb.components.scriptTest.fields.testArgumentName') }}
          </th>
          <th class="w-1/5 px-3 py-2 font-medium">
            {{ $t('tb.components.scriptTest.fields.testArgumentType') }}
          </th>
          <th class="px-3 py-2 font-medium">
            {{ $t('tb.components.scriptTest.fields.testArgumentData') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.name"
          class="border-border border-b"
          :data-argument="row.name"
        >
          <td class="px-3 py-2">
            <Input
              :value="row.name"
              disabled
              :aria-label="
                $t('tb.components.scriptTest.fields.testArgumentName')
              "
            />
          </td>
          <td class="px-3 py-2">
            <VbenSelect
              class="w-full"
              :model-value="row.keyType"
              :options="[
                {
                  value: row.keyType,
                  label: $t(
                    `tb.components.fieldArguments.options.${row.keyType}`,
                  ),
                },
              ]"
              disabled
              :aria-label="
                $t('tb.components.scriptTest.fields.testArgumentType')
              "
            />
          </td>
          <td class="px-3 py-2">
            <div class="flex items-center gap-2">
              <Input
                v-if="row.keyType === 'TS_ROLLING'"
                :value="row.json"
                :disabled="disabled"
                :placeholder="
                  $t(
                    'tb.components.scriptTest.messages.testValuePlaceholders.JSON',
                  )
                "
                class="min-w-64 flex-1"
                @update:value="(json) => updateRow(row, { json })"
              />
              <template v-else>
                <InputNumber
                  :value="typeof row.ts === 'number' ? row.ts : null"
                  :disabled="disabled"
                  :placeholder="
                    $t('tb.components.scriptTest.fields.testTimestamp')
                  "
                  :aria-label="
                    $t('tb.components.scriptTest.fields.testTimestamp')
                  "
                  class="w-36 shrink-0"
                  @update:value="(ts) => updateRow(row, { ts })"
                />
                <div class="w-24 shrink-0">
                  <VbenSelect
                    :model-value="row.valueType"
                    :options="valueTypes"
                    :disabled="disabled"
                    :aria-label="$t('attribute.fields.valueType')"
                    @update:model-value="(value) => changeValueType(row, value)"
                  />
                </div>
                <Checkbox
                  v-if="row.valueType === 'BOOLEAN'"
                  :checked="row.value === true"
                  :disabled="disabled"
                  class="min-w-24 flex-1"
                  @update:checked="(value) => updateRow(row, { value })"
                >
                  {{
                    row.value
                      ? $t('tb.components.scriptTest.options.testTrue')
                      : $t('tb.components.scriptTest.options.testFalse')
                  }}
                </Checkbox>
                <InputNumber
                  v-else-if="
                    row.valueType === 'INTEGER' || row.valueType === 'DOUBLE'
                  "
                  :value="typeof row.value === 'number' ? row.value : null"
                  :disabled="disabled"
                  :precision="row.valueType === 'INTEGER' ? 0 : undefined"
                  :placeholder="
                    $t(
                      `tb.components.scriptTest.messages.testValuePlaceholders.${row.valueType}`,
                    )
                  "
                  class="min-w-24 flex-1"
                  @update:value="(value) => updateRow(row, { value })"
                />
                <Input
                  v-else
                  :value="
                    row.valueType === 'JSON'
                      ? row.json
                      : typeof row.value === 'string'
                        ? row.value
                        : ''
                  "
                  :disabled="disabled"
                  :placeholder="
                    $t(
                      `tb.components.scriptTest.messages.testValuePlaceholders.${row.valueType}`,
                    )
                  "
                  class="min-w-24 flex-1"
                  @update:value="
                    (value) =>
                      updateRow(
                        row,
                        row.valueType === 'JSON' ? { json: value } : { value },
                      )
                  "
                />
              </template>
              <VbenButton
                type="button"
                variant="ghost"
                size="icon"
                :disabled="disabled"
                :aria-label="
                  $t('tb.components.scriptTest.actions.testEditData')
                "
                @click="editData(row)"
              >
                <IconifyIcon icon="lucide:square-pen" class="size-4" />
              </VbenButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <DataModal class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl">
    <Alert
      v-if="editorError"
      type="error"
      :message="editorError"
      class="mb-3"
    />
    <JsonEditor
      :model-value="editorText"
      :readonly="disabled"
      :height="360"
      required
      root-type="object"
      @update:model-value="changeEditor"
    />
  </DataModal>
</template>
