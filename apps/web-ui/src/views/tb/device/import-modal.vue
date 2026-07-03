<script lang="ts" setup>
import type {
  DeviceBulkImportRequest,
  DeviceBulkImportResult,
} from '#/api/tb/device';

import { computed, h, reactive, ref } from 'vue';

import { alert, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Checkbox,
  Input,
  message,
  Select,
  Steps,
  Table,
  Tag,
  Upload,
} from 'antdv-next';

import { bulkImportDevices } from '#/api/tb/device';
import {
  bulkImportColumnRequiresKey,
  BulkImportColumnType,
  bulkImportColumnTypeOptions,
} from '#/enums';
import { $t } from '#/locales';
import { parseCsv, readBulkImportFile } from '#/utils/bulk-import';

interface ColumnMapping {
  error?: boolean;
  header: string;
  index: number;
  key: string;
  sample: string;
  type: BulkImportColumnType;
}

const emit = defineEmits<{ success: [] }>();

const Dragger = Upload.Dragger;

const currentStep = ref(0);
const loading = ref(false);
const selectedFileName = ref('');
const fileSource = ref<'csv' | 'excel'>('csv');
const rawCsvText = ref('');
const columnMappings = ref<ColumnMapping[]>([]);

const config = reactive({
  delimiter: ',',
  header: true,
  update: true,
});

const isExcelSource = computed(() => fileSource.value === 'excel');

const parsedRows = computed(() =>
  parseCsv(rawCsvText.value, config.delimiter).filter((row) =>
    row.some((cell) => cell !== ''),
  ),
);

const dataRowCount = computed(() =>
  Math.max(parsedRows.value.length - (config.header ? 1 : 0), 0),
);

const columnCount = computed(() => {
  let count = 0;
  for (const row of parsedRows.value) {
    count = Math.max(count, row.length);
  }
  return count;
});

const fileSourceLabel = computed(() =>
  isExcelSource.value ? 'Excel' : $t('tb.device.import.csvFile'),
);

const requiredKeyColumnCount = computed(
  () =>
    columnMappings.value.filter((item) =>
      bulkImportColumnRequiresKey(item.type),
    ).length,
);

const stepsItems = computed(() => [
  { title: $t('tb.device.import.step1') },
  { title: $t('tb.device.import.step2') },
  { title: $t('tb.device.import.step3') },
]);

const delimiterOptions = [
  { label: `${$t('tb.device.import.delimiterComma')} ( , )`, value: ',' },
  { label: `${$t('tb.device.import.delimiterSemicolon')} ( ; )`, value: ';' },
  { label: `${$t('tb.device.import.delimiterPipe')} ( | )`, value: '|' },
  { label: 'Tab', value: '\t' },
];

const tableColumns = computed(() => [
  {
    dataIndex: 'index',
    key: 'index',
    title: '#',
    width: 60,
  },
  {
    dataIndex: 'sample',
    ellipsis: true,
    key: 'sample',
    title: $t('tb.device.import.sample'),
    width: 220,
  },
  {
    dataIndex: 'type',
    key: 'type',
    title: $t('tb.device.import.columnTypeLabel'),
    width: 180,
  },
  {
    dataIndex: 'key',
    key: 'key',
    title: $t('tb.device.import.columnKey'),
    width: 180,
  },
]);

function resetState() {
  currentStep.value = 0;
  loading.value = false;
  selectedFileName.value = '';
  fileSource.value = 'csv';
  rawCsvText.value = '';
  columnMappings.value = [];
  config.delimiter = ',';
  config.header = true;
  config.update = true;
}

async function beforeUpload(file: File) {
  try {
    const result = await readBulkImportFile(file);
    rawCsvText.value = result.csvText;
    fileSource.value = result.source;
    selectedFileName.value = file.name;
    if (result.source === 'excel') {
      config.delimiter = ',';
    }
  } catch {
    message.error($t('tb.device.import.readError'));
  }
  return false;
}

function buildColumnMappings(): boolean {
  const rows = parsedRows.value;
  if (rows.length === 0) {
    message.warning($t('tb.device.import.emptyFile'));
    return false;
  }
  const headerRow = config.header ? (rows[0] ?? []) : [];
  const sampleRow = rows[config.header ? 1 : 0] ?? [];
  const count = Math.max(
    headerRow.length,
    sampleRow.length,
    ...rows.map((row) => row.length),
  );
  columnMappings.value = Array.from({ length: count }).map((_, index) => {
    const header = headerRow[index] || `column_${index + 1}`;
    let type = BulkImportColumnType.SERVER_ATTRIBUTE;
    if (index === 0) {
      type = BulkImportColumnType.NAME;
    } else if (index === 1) {
      type = BulkImportColumnType.TYPE;
    }
    return {
      header,
      index: index + 1,
      key: bulkImportColumnRequiresKey(type) ? header : '',
      sample: sampleRow[index] || headerRow[index] || '',
      type,
    };
  });
  return true;
}

function onTypeChange(record: ColumnMapping) {
  record.key = bulkImportColumnRequiresKey(record.type)
    ? record.key || record.header
    : '';
  record.error = false;
}

function onKeyChange(record: ColumnMapping) {
  if (record.key.trim()) {
    record.error = false;
  }
}

function getRowClassName(record: ColumnMapping) {
  return record.error ? 'tb-import-row-error' : '';
}

function getPreviewText(value?: string) {
  return value || '-';
}

function showImportResult(result: DeviceBulkImportResult) {
  const errorsList = result.errorsList ?? [];
  alert({
    containerClass: 'sm:min-w-[560px]',
    confirmText: $t('tb.common.confirm'),
    icon: 'success',
    title: $t('tb.device.import.completeTitle'),
    content: () =>
      h('div', { class: 'space-y-5 pt-1' }, [
        h('div', { class: 'space-y-3 text-base leading-6' }, [
          h(
            'div',
            `${$t('tb.device.import.createdCount')}: ${result.created ?? 0}`,
          ),
          h(
            'div',
            `${$t('tb.device.import.updatedCount')}: ${result.updated ?? 0}`,
          ),
          h(
            'div',
            `${$t('tb.device.import.errorCount')}: ${result.errors ?? 0}`,
          ),
        ]),
        errorsList.length > 0
          ? h('div', { class: 'space-y-3' }, [
              h(
                'div',
                { class: 'text-base font-medium' },
                $t('tb.device.import.errorDetails'),
              ),
              h(
                'div',
                {
                  class:
                    'max-h-60 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/30 px-4 py-3 text-sm leading-6 text-foreground',
                },
                errorsList.join('\n'),
              ),
            ])
          : null,
      ]),
  }).catch(() => {});
}

function onPrev() {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
}

async function onSubmit() {
  let invalid: ColumnMapping | undefined;
  columnMappings.value = columnMappings.value.map((item) => {
    const error = bulkImportColumnRequiresKey(item.type) && !item.key.trim();
    if (error && !invalid) {
      invalid = item;
    }
    return { ...item, error };
  });
  if (invalid) {
    message.warning(
      $t('tb.device.import.keyRequired', { index: invalid.index }),
    );
    return;
  }
  const payload: DeviceBulkImportRequest = {
    file: rawCsvText.value,
    mapping: {
      columns: columnMappings.value.map((item) => ({
        key: bulkImportColumnRequiresKey(item.type) ? item.key.trim() : '',
        type: item.type,
      })),
      delimiter: config.delimiter,
      header: config.header,
      update: config.update,
    },
  };
  loading.value = true;
  try {
    const result = await bulkImportDevices(payload);
    modalApi.close();
    emit('success');
    showImportResult(result);
  } finally {
    loading.value = false;
  }
}

async function onNext() {
  if (currentStep.value === 0) {
    if (!rawCsvText.value) {
      message.warning($t('tb.device.import.noFile'));
      return;
    }
    currentStep.value = 1;
    return;
  }
  if (currentStep.value === 1) {
    if (buildColumnMappings()) {
      currentStep.value = 2;
    }
    return;
  }
  await onSubmit();
}

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) return;
    resetState();
    modalApi.setState({ title: $t('tb.device.import.title') });
  },
});
</script>

<template>
  <Modal
    class="w-[760px] max-w-[90vw]"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Steps :current="currentStep" :items="stepsItems" size="small" />

    <div class="mt-6 min-h-[390px]">
      <!-- 步骤 1:选择文件 -->
      <div v-if="currentStep === 0" class="space-y-4">
        <Dragger
          accept=".csv,.xlsx,.xls"
          :before-upload="beforeUpload"
          :max-count="1"
          :show-upload-list="false"
        >
          <p class="flex justify-center py-2 text-3xl text-primary">
            <IconifyIcon icon="lucide:cloud-upload" />
          </p>
          <p class="text-sm">{{ $t('tb.device.import.uploadHint') }}</p>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ selectedFileName || $t('tb.device.import.noFileSelected') }}
          </p>
        </Dragger>
        <div
          v-if="selectedFileName"
          class="grid grid-cols-3 gap-3 rounded border border-border bg-muted/30 p-4"
        >
          <div>
            <div class="text-muted-foreground text-xs">
              {{ $t('tb.device.import.fileName') }}
            </div>
            <div class="mt-1 truncate text-sm font-medium">
              {{ selectedFileName }}
            </div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">
              {{ $t('tb.device.import.fileType') }}
            </div>
            <div class="mt-1 text-sm font-medium">{{ fileSourceLabel }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">
              {{ $t('tb.device.import.fileStats') }}
            </div>
            <div class="mt-1 text-sm font-medium">
              {{
                $t('tb.device.import.rowsColumns', {
                  columns: columnCount,
                  rows: dataRowCount,
                })
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤 2:导入配置 -->
      <div v-else-if="currentStep === 1" class="space-y-4">
        <div class="rounded border border-border p-4">
          <div class="mb-3 text-sm font-medium">
            {{ $t('tb.device.import.parseConfig') }}
          </div>
          <div v-if="!isExcelSource" class="flex max-w-md items-center gap-3">
            <span class="shrink-0 text-sm">
              {{ $t('tb.device.import.delimiter') }}
            </span>
            <Select
              v-model:value="config.delimiter"
              :options="delimiterOptions"
              style="width: 100%"
            />
          </div>
          <div
            v-else
            class="flex items-start gap-2 rounded bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          >
            <IconifyIcon
              class="mt-0.5 shrink-0"
              icon="lucide:file-spreadsheet"
            />
            <span>{{ $t('tb.device.import.excelAutoParsed') }}</span>
          </div>
        </div>

        <div class="rounded border border-border p-4">
          <div class="mb-3 text-sm font-medium">
            {{ $t('tb.device.import.importOptions') }}
          </div>
          <div class="flex flex-col gap-3">
            <Checkbox v-model:checked="config.header">
              {{ $t('tb.device.import.headerCheckbox') }}
            </Checkbox>
            <Checkbox v-model:checked="config.update">
              {{ $t('tb.device.import.updateCheckbox') }}
            </Checkbox>
          </div>
        </div>

        <div
          class="grid grid-cols-3 gap-3 rounded border border-border bg-muted/30 p-4"
        >
          <div>
            <div class="text-muted-foreground text-xs">
              {{ $t('tb.device.import.dataRows') }}
            </div>
            <div class="mt-1 text-sm font-medium">{{ dataRowCount }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">
              {{ $t('tb.device.import.columns') }}
            </div>
            <div class="mt-1 text-sm font-medium">{{ columnCount }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">
              {{ $t('tb.device.import.fileType') }}
            </div>
            <div class="mt-1 text-sm font-medium">{{ fileSourceLabel }}</div>
          </div>
        </div>
      </div>

      <!-- 步骤 3:选择列类型 -->
      <div v-else class="space-y-4">
        <div
          class="flex items-center justify-between rounded border border-border p-4"
        >
          <div>
            <div class="text-sm font-medium">
              {{ $t('tb.device.import.mappingSummary') }}
            </div>
            <div class="text-muted-foreground mt-1 text-xs">
              {{
                $t('tb.device.import.mappingSummaryDesc', {
                  columns: columnMappings.length,
                  keys: requiredKeyColumnCount,
                })
              }}
            </div>
          </div>
          <Tag color="blue">
            {{
              $t('tb.device.import.rowsColumns', {
                columns: columnCount,
                rows: dataRowCount,
              })
            }}
          </Tag>
        </div>

        <Table
          class="tb-import-mapping-table"
          :bordered="true"
          :columns="tableColumns"
          :data-source="columnMappings"
          :pagination="false"
          :row-class-name="getRowClassName"
          :row-key="(record: ColumnMapping) => record.index"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sample'">
              <div
                class="text-muted-foreground truncate"
                :title="getPreviewText(record.sample)"
              >
                {{ getPreviewText(record.sample) }}
              </div>
            </template>
            <template v-else-if="column.key === 'type'">
              <Select
                v-model:value="record.type"
                :options="bulkImportColumnTypeOptions()"
                style="width: 100%"
                @change="onTypeChange(record)"
              />
            </template>
            <template v-else-if="column.key === 'key'">
              <Input
                v-model:value="record.key"
                :disabled="!bulkImportColumnRequiresKey(record.type)"
                :placeholder="
                  bulkImportColumnRequiresKey(record.type)
                    ? $t('tb.device.import.keyPlaceholder')
                    : $t('tb.device.import.keyNotNeeded')
                "
                :status="record.error ? 'error' : undefined"
                @change="onKeyChange(record)"
              />
            </template>
          </template>
        </Table>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <Button v-if="currentStep > 0" @click="onPrev">
          <template #icon>
            <IconifyIcon icon="lucide:chevron-left" />
          </template>
          {{ $t('tb.device.import.prev') }}
        </Button>
        <span v-else></span>
        <div class="flex items-center gap-2">
          <Button @click="modalApi.close()">
            {{ $t('tb.common.cancel') }}
          </Button>
          <Button type="primary" :loading="loading" @click="onNext">
            {{
              currentStep === 2
                ? $t('tb.device.import.submit')
                : $t('tb.device.import.next')
            }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
:deep(.tb-import-row-error > td) {
  background-color: rgb(254 242 242 / 70%);
}

:deep(.tb-import-mapping-table .ant-table-cell) {
  vertical-align: middle;
}

:deep(.tb-import-mapping-table .ant-table-tbody > tr > td) {
  height: 56px;
}
</style>
