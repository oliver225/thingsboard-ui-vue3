<script setup lang="ts">
import type { AssetBulkImportResult } from '#/api/tb/asset';
import type { ImportColumn } from '#/utils/bulk-import';

import { computed, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import {
  useVbenModal,
  VbenButton,
  VbenCheckbox,
  VbenIconButton,
  VbenSelect,
} from '@vben/common-ui';
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Download,
  Inbox,
  Upload,
  X,
} from '@vben/icons';

import { Input as VbenInput } from '@vben-core/shadcn-ui';

import { Steps } from 'antdv-next';

import { bulkImportAssets } from '#/api/tb/asset';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import {
  buildImportColumns,
  ImportFileError,
  parseCsv,
  readImportFile,
  requiresKey,
  serializeCsv,
  validateImportColumns,
} from '#/utils/bulk-import';

const emit = defineEmits<{ success: [] }>();
const { hasAccessByRoles } = useAccess();
const fileInputRef = ref<HTMLInputElement>();
const step = ref(0);
const selectedFile = ref<File>();
const source = ref({ csv: '', excel: false, sheetName: '' });
const rows = ref<string[][]>([]);
const columns = ref<ImportColumn[]>([]);
const result = ref<AssetBulkImportResult>();
const errorMessage = ref('');
const reading = ref(false);
const dragging = ref(false);
const config = reactive({ delimiter: ',', header: true, update: true });
const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) return;
    step.value = 0;
    handleClearFile();
    result.value = undefined;
    Object.assign(config, { delimiter: ',', header: true, update: true });
  },
});
const modalState = modalApi.useStore();
const rowCount = computed(() =>
  Math.max(0, rows.value.length - (config.header ? 1 : 0)),
);
const steps = computed(() => [
  { title: $t('asset.features.import.steps.file') },
  { title: $t('asset.features.import.steps.config') },
  { title: $t('asset.features.import.steps.columns') },
  { title: $t('asset.features.import.steps.result') },
]);
const delimiterOptions = computed(() => [
  { label: $t('asset.features.import.delimiters.comma'), value: ',' },
  { label: $t('asset.features.import.delimiters.semicolon'), value: ';' },
  { label: $t('asset.features.import.delimiters.pipe'), value: '|' },
  { label: $t('asset.features.import.delimiters.tab'), value: '\t' },
]);
const columnOptions = computed(() => [
  { value: 'NAME', label: $t('asset.fields.name') },
  { value: 'TYPE', label: $t('asset.fields.assetProfile') },
  { value: 'LABEL', label: $t('asset.fields.label') },
  { value: 'DESCRIPTION', label: $t('asset.fields.description') },
  {
    value: 'SERVER_ATTRIBUTE',
    label: $t('asset.features.import.types.serverAttribute'),
  },
  { value: 'TIMESERIES', label: $t('asset.features.import.types.timeseries') },
]);

watch(
  () => [config.delimiter, config.header],
  () => {
    columns.value = [];
  },
);

function handleClearFile() {
  selectedFile.value = undefined;
  source.value = { csv: '', excel: false, sheetName: '' };
  rows.value = [];
  columns.value = [];
  errorMessage.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function showFileError(error: unknown) {
  if (error instanceof ImportFileError) {
    switch (error.code) {
      case 'empty': {
        errorMessage.value = $t('asset.features.import.validation.empty');
        return;
      }
      case 'invalidFile': {
        errorMessage.value = $t('asset.features.import.validation.invalidFile');
        return;
      }
      case 'tooLarge': {
        errorMessage.value = $t('asset.features.import.validation.tooLarge');
        return;
      }
      case 'rowWidth': {
        errorMessage.value = $t('asset.features.import.validation.rowWidth', {
          row: error.row,
        });
        return;
      }
    }
  }
  errorMessage.value = $t('asset.features.import.validation.format');
}

async function handleSelectFile(file?: File) {
  if (!file || modalState.value.submitting) return;
  handleClearFile();
  reading.value = true;
  modalApi.lock();
  try {
    const parsed = await readImportFile(file);
    if (!parsed.csv.trim()) throw new ImportFileError('empty');
    source.value = parsed;
    selectedFile.value = file;
    if (parsed.excel) config.delimiter = ',';
  } catch (error) {
    showFileError(error);
  } finally {
    reading.value = false;
    modalApi.unlock();
  }
}

function handleFileChange(event: Event) {
  return handleSelectFile((event.target as HTMLInputElement).files?.[0]);
}

function handleDrop(event: DragEvent) {
  dragging.value = false;
  if (event.dataTransfer?.files.length !== 1) {
    errorMessage.value = $t('asset.features.import.validation.oneFile');
    return;
  }
  return handleSelectFile(event.dataTransfer.files[0]);
}

function handleColumnTypeChange(column: ImportColumn, value?: string) {
  const option = columnOptions.value.find((item) => item.value === value);
  if (!option) return;
  column.type = option.value as ImportColumn['type'];
  column.key = requiresKey(column.type) ? column.key || column.header : '';
}

function handlePrevious() {
  errorMessage.value = '';
  step.value--;
}

function handleNext() {
  errorMessage.value = '';
  if (step.value === 0) {
    if (selectedFile.value) step.value = 1;
    return;
  }
  try {
    rows.value = parseCsv(source.value.csv, config.delimiter);
    const mapped = buildImportColumns(
      rows.value,
      config.header,
      columnOptions.value.map(({ value }) => value),
    );
    if (columns.value.length === 0) columns.value = mapped;
    step.value = 2;
  } catch (error) {
    showFileError(error);
  }
}

async function handleImport() {
  if (
    modalState.value.submitting ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  errorMessage.value = '';
  const validation = validateImportColumns(columns.value);
  switch (validation) {
    case 'requiredColumns': {
      errorMessage.value = $t(
        'asset.features.import.validation.requiredColumns',
      );
      return;
    }
    case 'requiredKey': {
      errorMessage.value = $t('asset.features.import.validation.requiredKey');
      return;
    }
    case 'duplicateColumn': {
      errorMessage.value = $t(
        'asset.features.import.validation.duplicateColumn',
      );
      return;
    }
  }
  const dataRows = rows.value.slice(config.header ? 1 : 0);
  const invalidRow = dataRows.findIndex((row) =>
    columns.value.some(
      (column, index) =>
        ['NAME', 'TYPE'].includes(column.type) && !row[index]?.trim(),
    ),
  );
  if (invalidRow !== -1) {
    errorMessage.value = $t('asset.features.import.validation.requiredValue', {
      row: invalidRow + (config.header ? 2 : 1),
    });
    return;
  }
  modalApi.lock();
  try {
    result.value = await bulkImportAssets({
      file: serializeCsv(rows.value, config.delimiter),
      mapping: {
        ...config,
        columns: columns.value.map((column) => ({
          type: column.type,
          ...(requiresKey(column.type) ? { key: column.key.trim() } : {}),
        })),
      },
    });
    step.value = 3;
    emit('success');
  } catch {
    errorMessage.value = $t('asset.features.import.validation.requestFailed');
  } finally {
    modalApi.unlock();
  }
}

function handleDownloadTemplate() {
  const csv = serializeCsv(
    [
      ['NAME', 'TYPE', 'LABEL', 'temperature'],
      ['Asset-001', 'default', 'Room 1', '23.5'],
    ],
    ',',
  );
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'assets-template.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <Modal
    :title="$t('asset.features.import.title')"
    :description="$t('asset.features.import.description')"
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="flex min-h-0 flex-col overflow-hidden px-6 pt-5 pb-1"
  >
    <Steps
      :current="step"
      :items="steps"
      :responsive="false"
      title-placement="vertical"
      size="small"
      class="mb-6 shrink-0"
    />
    <div class="min-h-0 flex-1 overflow-y-auto px-1">
      <fieldset :disabled="modalState.submitting" class="min-w-0">
        <div v-if="step === 0" class="space-y-4">
          <div
            class="bg-muted/20 flex flex-col items-center rounded-xl border border-dashed px-5 py-10 text-center transition-colors"
            :class="dragging ? 'border-primary bg-primary/5' : 'border-border'"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="bg-background mb-4 rounded-xl border p-3 shadow-sm">
              <Upload class="text-primary size-6" />
            </div>
            <h3 class="text-base font-semibold">
              {{ $t('asset.features.import.uploadTitle') }}
            </h3>
            <p class="text-muted-foreground mt-2 text-sm">
              {{ $t('asset.features.import.uploadHint') }}
            </p>
            <input
              ref="fileInputRef"
              type="file"
              accept=".csv,.xlsx,.xls"
              class="sr-only"
              :aria-label="$t('asset.features.import.chooseFile')"
              @change="handleFileChange"
            />
            <VbenButton
              type="button"
              variant="outline"
              class="mt-5"
              :loading="reading"
              @click="fileInputRef?.click()"
            >
              {{ $t('asset.features.import.chooseFile') }}
            </VbenButton>
          </div>
          <div
            v-if="selectedFile"
            class="flex items-center gap-3 rounded-lg border p-4"
          >
            <Inbox class="text-primary size-6 shrink-0" />
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-medium"
                :title="selectedFile.name"
              >
                {{ selectedFile.name }}
              </p>
              <p class="text-muted-foreground mt-1 text-xs">
                {{ (selectedFile.size / 1024).toFixed(1) }} KB
              </p>
            </div>
            <VbenIconButton
              :tooltip="$t('asset.features.import.removeFile')"
              tooltip-side="top"
              @click="handleClearFile"
            >
              <X class="size-4" />
              <span class="sr-only">{{
                $t('asset.features.import.removeFile')
              }}</span>
            </VbenIconButton>
          </div>
          <div
            class="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <span class="text-muted-foreground">{{
              $t('asset.features.import.templateHint')
            }}</span>
            <VbenButton
              type="button"
              variant="link"
              class="h-auto p-0"
              @click="handleDownloadTemplate"
            >
              <Download class="mr-2 size-4" />{{
                $t('asset.features.import.downloadTemplate')
              }}
            </VbenButton>
          </div>
        </div>
        <div v-else-if="step === 1" class="space-y-5">
          <div
            class="bg-muted/30 flex items-center gap-3 rounded-lg border p-4"
          >
            <Inbox class="text-primary size-5 shrink-0" />
            <span class="min-w-0 truncate text-sm font-medium">{{
              selectedFile?.name
            }}</span>
          </div>
          <p v-if="source.excel" class="text-muted-foreground text-sm">
            {{
              $t('asset.features.import.excelSheet', { name: source.sheetName })
            }}
          </p>
          <label v-else class="block space-y-2">
            <span class="text-sm font-medium">{{
              $t('asset.features.import.delimiter')
            }}</span>
            <VbenSelect
              v-model="config.delimiter"
              class="sm:max-w-xs"
              :options="delimiterOptions"
            />
          </label>
          <div class="divide-y rounded-lg border">
            <div class="space-y-2 p-4">
              <VbenCheckbox v-model="config.header">
                {{ $t('asset.features.import.header') }}
              </VbenCheckbox>
              <p class="text-muted-foreground pl-6 text-sm">
                {{ $t('asset.features.import.headerHint') }}
              </p>
            </div>
            <div class="space-y-2 p-4">
              <VbenCheckbox v-model="config.update">
                {{ $t('asset.features.import.update') }}
              </VbenCheckbox>
              <p class="text-muted-foreground pl-6 text-sm">
                {{ $t('asset.features.import.updateHint') }}
              </p>
            </div>
          </div>
        </div>
        <div v-else-if="step === 2" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-medium">
              {{
                $t('asset.features.import.preview', {
                  rows: rowCount,
                  columns: columns.length,
                })
              }}
            </p>
            <span class="text-muted-foreground text-xs">{{
              $t('asset.features.import.mappingHint')
            }}</span>
          </div>
          <div class="overflow-x-auto rounded-lg border">
            <table class="w-full min-w-[660px] text-left text-sm">
              <thead class="bg-muted/50 text-muted-foreground">
                <tr>
                  <th class="w-10 p-3">#</th>
                  <th class="p-3">{{ $t('asset.features.import.sample') }}</th>
                  <th class="w-52 p-3">
                    {{ $t('asset.features.import.columnType') }}
                  </th>
                  <th class="w-52 p-3">
                    {{ $t('asset.features.import.attributeKey') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="(column, index) in columns"
                  :key="index"
                  class="hover:bg-muted/20"
                >
                  <td class="text-muted-foreground p-3">{{ index + 1 }}</td>
                  <td class="max-w-52 p-3">
                    <p class="truncate font-medium" :title="column.header">
                      {{
                        column.header ||
                        $t('asset.features.import.columnNumber', {
                          index: index + 1,
                        })
                      }}
                    </p>
                    <p
                      class="text-muted-foreground mt-1 truncate font-mono text-xs"
                      :title="column.sample"
                    >
                      {{ column.sample || '—' }}
                    </p>
                  </td>
                  <td class="p-3">
                    <label>
                      <span class="sr-only">{{
                        $t('asset.features.import.columnTypeLabel', {
                          index: index + 1,
                        })
                      }}</span>
                      <VbenSelect
                        :model-value="column.type"
                        :options="
                          columnOptions.filter(
                            (option) =>
                              requiresKey(option.value) ||
                              option.value === column.type ||
                              !columns.some(
                                (item) => item.type === option.value,
                              ),
                          )
                        "
                        @update:model-value="
                          (value) => handleColumnTypeChange(column, value)
                        "
                      />
                    </label>
                  </td>
                  <td class="p-3">
                    <VbenInput
                      v-if="requiresKey(column.type)"
                      v-model="column.key"
                      :aria-label="
                        $t('asset.features.import.keyLabel', {
                          index: index + 1,
                        })
                      "
                      :placeholder="$t('asset.features.import.attributeKey')"
                    />
                    <span v-else class="text-muted-foreground">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else-if="result" class="space-y-5">
          <div class="flex items-center gap-3">
            <component
              :is="result.errors ? CircleAlert : CircleCheckBig"
              class="size-8 shrink-0"
              :class="result.errors ? 'text-destructive' : 'text-primary'"
            />
            <div>
              <h3 class="font-semibold">
                {{
                  result.errors
                    ? $t('asset.features.import.result.withErrors')
                    : $t('asset.features.import.result.complete')
                }}
              </h3>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ selectedFile?.name }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border p-4">
              <p class="text-muted-foreground text-xs">
                {{ $t('asset.features.import.result.created') }}
              </p>
              <p class="mt-2 text-2xl font-semibold tabular-nums">
                {{ result.created }}
              </p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-muted-foreground text-xs">
                {{ $t('asset.features.import.result.updated') }}
              </p>
              <p class="mt-2 text-2xl font-semibold tabular-nums">
                {{ result.updated }}
              </p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-muted-foreground text-xs">
                {{ $t('asset.features.import.result.errors') }}
              </p>
              <p
                class="mt-2 text-2xl font-semibold tabular-nums"
                :class="{ 'text-destructive': result.errors }"
              >
                {{ result.errors }}
              </p>
            </div>
          </div>
          <div v-if="result.errorsList?.length" class="space-y-2">
            <h4 class="text-sm font-medium">
              {{ $t('asset.features.import.result.details') }}
            </h4>
            <ul
              class="bg-muted/30 max-h-56 space-y-2 overflow-auto rounded-lg border p-4 text-sm"
            >
              <li
                v-for="(error, index) in result.errorsList"
                :key="index"
                class="whitespace-pre-wrap break-words"
              >
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </fieldset>
      <p v-if="errorMessage" role="alert" class="text-destructive mt-4 text-sm">
        {{ errorMessage }}
      </p>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <VbenButton
          v-if="step > 0 && step < 3"
          type="button"
          variant="outline"
          :disabled="modalState.submitting"
          @click="handlePrevious"
        >
          <ArrowLeft class="mr-2 size-4" />{{
            $t('asset.features.import.previous')
          }}
        </VbenButton>
        <span v-else> </span>
        <div class="flex items-center gap-2">
          <VbenButton
            v-if="step < 3"
            type="button"
            variant="outline"
            :disabled="modalState.submitting"
            @click="modalApi.close()"
          >
            {{ $t('tb.common.cancel') }}
          </VbenButton>
          <VbenButton
            v-if="step < 2"
            type="button"
            :disabled="modalState.submitting || (step === 0 && !selectedFile)"
            @click="handleNext"
          >
            {{ $t('asset.features.import.next')
            }}<ChevronRight class="ml-2 size-4" />
          </VbenButton>
          <VbenButton
            v-else-if="step === 2"
            type="button"
            :loading="modalState.submitting"
            :disabled="modalState.submitting"
            @click="handleImport"
          >
            {{ $t('asset.features.import.submit', { count: rowCount }) }}
          </VbenButton>
          <VbenButton v-else type="button" @click="modalApi.close()">
            {{ $t('asset.features.import.done') }}
          </VbenButton>
        </div>
      </div>
    </template>
  </Modal>
</template>
