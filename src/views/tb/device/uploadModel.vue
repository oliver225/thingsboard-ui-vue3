<template>
  <BasicModal
    v-bind="$attrs"
    width="60%"
    :closable="false"
    :mask-closable="false"
    :can-fullscreen="false"
    @close="handleCancel"
    @register="registerModal"
  >
    <template #title>
      <Icon icon="ant-design:upload-outlined" class="pr-1 m-1" />
      <span>导入设备</span>
    </template>

    <Steps v-model:current="currentStep" :items="stepsItems" />

    <div class="device-upload">
      <div v-if="currentStep === 0" class="device-upload__panel">
        <Upload.Dragger
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          :max-count="1"
          :before-upload="handleBeforeUpload"
          @remove="handleRemoveFile"
        >
          <p class="ant-upload-drag-icon">
            <Icon icon="ant-design:cloud-upload-outlined" />
          </p>
          <p class="ant-upload-text">点击或拖拽一个CSV或者Excel文件至此区域上传</p>
          <p class="ant-upload-hint">{{ selectedFile?.name || '没有选择文件' }}</p>
        </Upload.Dragger>
      </div>

      <div v-else-if="currentStep === 1" class="device-upload__panel">
        <div class="device-upload__field" v-show="!isExcelSource">
          <div class="device-upload__label">CSV 分隔符:</div>
          <Select v-model:value="config.delimiter" :options="delimiterOptions" />
        </div>
        <div class="device-upload__checks">
          <Checkbox v-model:checked="config.header">第一行包含列名</Checkbox>
          <Checkbox v-model:checked="config.update">更新属性/遥测</Checkbox>
        </div>
      </div>

      <div v-else class="device-upload__panel">
        <Table
          :bordered="true"
          :columns="tableColumns"
          :data-source="columnMappings"
          :pagination="false"
          :row-key="(record) => record.index"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sample'">
              <span>{{ record.sample || '-' }}</span>
            </template>
            <template v-else-if="column.key === 'type'">
              <Select
                class="w-full"
                v-model:value="record.type"
                :options="BULK_IMPORT_COLUMN_OPTIONS"
                @change="handleTypeChange(record)"
              />
            </template>
            <template v-else-if="column.key === 'key'">
              <Input
                v-model:value="record.key"
                :disabled="!requiresKey(record.type)"
                :placeholder="requiresKey(record.type) ? '请输入属性/遥测键' : '当前类型无需填写'"
              />
            </template>
          </template>
        </Table>
      </div>
    </div>
    <template #footer>
      <div class="device-upload__footer" v-show="hasPermission(Authority.TENANT_ADMIN)">
        <div>
          <Button v-if="currentStep > 0" @click="handlePrev">
            <Icon :icon="'ant-design:left-outlined'" /> 上一步
          </Button>
        </div>
        <div class="device-upload__footer-actions">
          <Button type="link" @click="handleCancel">取消</Button>
          <Button type="primary" :loading="loading" @click="handleNext">
            <Icon v-if="currentStep === 2" :icon="'ant-design:check-outlined'" />
            {{ currentStep === 2 ? '提交' : '下一步' }}
            <Icon v-if="currentStep !== 2" :icon="'ant-design:right-outlined'" />
          </Button>
        </div>
      </div>
    </template>
  </BasicModal>
</template>

<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbDeviceUploadModel',
  });
</script>

<script lang="ts" setup>
  import { computed, defineComponent, h, reactive, ref } from 'vue';
  import type { UploadFile, UploadProps } from 'ant-design-vue';
  import { Button, Checkbox, Input, Select, Table, Upload, Steps } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { Authority } from '/@/enums/authorityEnum';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BULK_IMPORT_COLUMN_OPTIONS, BulkImportColumnType } from '/@/enums/bulkImportColumnType';
  import { devicesBulkImport } from '/@/api/tb/device';
  import { parseCsv, readBulkImportFile } from '/@/utils/bulkImport';
  import { BulkImportRequest, BulkImportResult } from '/@/api/model/baseModel';

  interface ColumnMapping {
    index: number;
    sample: string;
    header: string;
    type: BulkImportColumnType;
    key: string;
  }

  const emit = defineEmits(['register', 'success']);

  const { hasPermission } = usePermission();
  const { showMessage, createSuccessModal } = useMessage();

  const currentStep = ref(0);
  const loading = ref(false);
  const selectedFile = ref<File | null>(null);
  const selectedFileSource = ref<'csv' | 'excel'>('csv');
  const rawCsvText = ref('');
  const columnMappings = ref<ColumnMapping[]>([]);
  const isExcelSource = computed(() => selectedFileSource.value === 'excel');

  const config = reactive({
    delimiter: ',',
    header: true,
    update: true,
  });

  const stepsItems = [
    { step: 0, title: '选择一个文件' },
    { step: 1, title: '导入配置' },
    { step: 2, title: '选择列类型' },
  ];

  const delimiterOptions = [
    { label: '逗号 ( , )', value: ',' },
    { label: '分号 ( ; )', value: ';' },
    { label: '分号 ( | )', value: '|' },
    { label: 'Tab', value: '\t' },
  ];

  const tableColumns = computed(() => [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
    },
    {
      title: '示例值数据',
      dataIndex: 'sample',
      key: 'sample',
    },
    {
      title: '列类型',
      dataIndex: 'type',
      key: 'type',
      width: 220,
    },
    {
      title: '属性/遥测键',
      dataIndex: 'key',
      key: 'key',
      width: 260,
    },
  ]);

  const [registerModal, { closeModal, setModalProps }] = useModalInner(async () => {
    resetState();
    setModalProps({ confirmLoading: false });
  });

  const handleBeforeUpload: UploadProps['beforeUpload'] = async (file) => {
    try {
      const raw = (file as UploadFile).originFileObj || (file as unknown as File);
      selectedFile.value = raw;
      const result = await readBulkImportFile(raw);
      rawCsvText.value = result.csvText;
      selectedFileSource.value = result.source;
      if (result.source === 'excel') {
        config.delimiter = ',';
      }
    } catch (error) {
      console.error(error);
      showMessage('文件读取失败', 'error');
    }
    return false;
  };

  function handleRemoveFile() {
    selectedFile.value = null;
    selectedFileSource.value = 'csv';
    rawCsvText.value = '';
    columnMappings.value = [];
  }

  function handleCancel() {
    resetState();
    closeModal();
  }

  function handlePrev() {
    if (currentStep.value > 0) {
      currentStep.value -= 1;
    }
  }

  async function handleNext() {
    if (currentStep.value === 0) {
      if (!selectedFile.value || !rawCsvText.value) {
        showMessage('请先选择一个 CSV 或 Excel 文件', 'warning');
        return;
      }
      currentStep.value = 1;
      return;
    }

    if (currentStep.value === 1) {
      const ok = buildColumnMappings();
      if (!ok) {
        return;
      }
      currentStep.value = 2;
      return;
    }

    await handleSubmit();
  }

  function buildColumnMappings() {
    try {
      const rows = parseCsv(rawCsvText.value, config.delimiter);
      if (!rows.length || !rows.some((row) => row.some((cell) => cell !== ''))) {
        showMessage('CSV 文件内容为空', 'warning');
        return false;
      }

      const normalizedRows = rows.filter((row) => row.some((cell) => cell !== ''));
      const headerRow = config.header ? normalizedRows[0] || [] : [];
      const sampleRow = normalizedRows[config.header ? 1 : 0] || [];
      const count = Math.max(headerRow.length, sampleRow.length, ...normalizedRows.map((item) => item.length));

      if (!count) {
        showMessage('未解析到有效列', 'warning');
        return false;
      }

      columnMappings.value = Array.from({ length: count }).map((_, index) => {
        const header = headerRow[index] || `column_${index + 1}`;
        const defaultType =
          index === 0
            ? BulkImportColumnType.NAME
            : index === 1
              ? BulkImportColumnType.TYPE
              : BulkImportColumnType.SERVER_ATTRIBUTE;
        return {
          index: index + 1,
          sample: sampleRow[index] || headerRow[index] || '',
          header,
          type: defaultType,
          key: requiresKey(defaultType) ? header : '',
        };
      });

      return true;
    } catch (error) {
      console.error(error);
      showMessage('CSV 解析失败，请检查分隔符是否正确', 'error');
      return false;
    }
  }

  function handleTypeChange(record: Recordable) {
    if (requiresKey(record.type)) {
      if (!record.key) {
        record.key = record.header;
      }
      return;
    }
    record.key = '';
  }

  function requiresKey(type: BulkImportColumnType) {
    return [
      BulkImportColumnType.SHARED_ATTRIBUTE,
      BulkImportColumnType.SERVER_ATTRIBUTE,
      BulkImportColumnType.TIME_SERIES,
    ].includes(type);
  }

  async function handleSubmit() {
    const invalidColumn = columnMappings.value.find((item) => requiresKey(item.type) && !item.key.trim());
    if (invalidColumn) {
      showMessage(`第 ${invalidColumn.index} 列请输入属性/遥测键`, 'warning');
      return;
    }

    const payload: BulkImportRequest = {
      file: rawCsvText.value,
      mapping: {
        delimiter: config.delimiter,
        header: config.header,
        update: config.update,
        columns: columnMappings.value.map((item) => ({
          type: item.type,
          key: requiresKey(item.type) ? item.key.trim() : '',
        })),
      },
    };

    loading.value = true;
    setModalProps({ confirmLoading: true });
    try {
      const result = await devicesBulkImport(payload);
      showResult(result);
      setTimeout(handleCancel);
      emit('success', result);
    } catch (error) {
      console.error(error);
      showMessage('导入失败', 'error');
    } finally {
      loading.value = false;
      setModalProps({ confirmLoading: false });
    }
  }

  function showResult(result: BulkImportResult) {
    createSuccessModal({
      title: '导入完成',
      width: 520,
      content: h('div', { class: 'device-upload-result' }, [
        h('p', null, `创建设备：${result.created}`),
        h('p', null, `更新设备：${result.updated}`),
        h('p', null, `错误数量：${result.errors}`),
        ...(result.errorsList?.length
          ? [
              h('div', { class: 'device-upload-result__title' }, '错误详情'),
              h(
                'div',
                { class: 'device-upload-result__errors' },
                result.errorsList.map((item) => h('div', { class: 'device-upload-result__error-item' }, item)),
              ),
            ]
          : []),
      ]),
    });
  }

  function resetState() {
    currentStep.value = 0;
    loading.value = false;
    selectedFile.value = null;
    selectedFileSource.value = 'csv';
    rawCsvText.value = '';
    columnMappings.value = [];
    config.delimiter = ',';
    config.header = true;
    config.update = true;
  }
</script>

<style lang="less">
  .device-upload {
    min-height: 420px;
    margin: 16px 8px 0 8px;
  }

  .device-upload__panel {
    flex: 1;
  }

  .device-upload__label {
    font-weight: 500;
    color: @heading-color;
    align-content: center;
  }

  .device-upload__field {
    display: flex;
    align-content: center;
    max-width: 360px;
    margin-bottom: 12px;
    gap: 12px;
    .ant-select {
      flex: 1;
    }
  }

  .device-upload__checks {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .device-upload__footer {
    display: flex;
    justify-content: space-between;
  }

  .device-upload-result {
    p {
      margin-bottom: 8px;
    }
  }

  .device-upload-result__title {
    margin: 12px 0 8px;
    font-weight: 500;
  }

  .device-upload-result__errors {
    max-height: 220px;
    overflow: auto;
    padding: 8px 12px;
    background: #fafafa;
    border: 1px solid @border-color-base;
    border-radius: 4px;
  }

  .device-upload-result__error-item + .device-upload-result__error-item {
    margin-top: 8px;
  }
</style>
