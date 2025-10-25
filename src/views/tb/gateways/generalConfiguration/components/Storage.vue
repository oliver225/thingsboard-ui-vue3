<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
      <p class="text-base font-bold mb-1">{{ t('tb.gateway.storageConfig.title') }}</p>
      <p class="text-sm text-neutral-500 mb-3">
        {{ t('tb.gateway.storageConfig.desc') }}
      </p>

      <Segmented
        v-model:value="formState.type"
        :options="[
          { label: t('tb.gateway.storageConfig.segmented.memory'), value: 'memory' },
          { label: t('tb.gateway.storageConfig.segmented.file'), value: 'file' },
          { label: t('tb.gateway.storageConfig.segmented.sqlite'), value: 'sqlite' },
        ]"
        block
        class="mb-2"
      />

      <!-- Tips by tab -->
      <div class="text-neutral-500 text-sm mb-3" v-if="formState.type === 'memory'">
        {{ t('tb.gateway.storageConfig.tips.memory') }}
      </div>
      <div class="text-neutral-500 text-sm mb-3" v-else-if="formState.type === 'file'">
        {{ t('tb.gateway.storageConfig.tips.file') }}
      </div>
      <div class="text-neutral-500 text-sm mb-3" v-else>
        {{ t('tb.gateway.storageConfig.tips.sqlite') }}
      </div>

      <!-- MEMORY -->
      <div v-show="formState.type === 'memory'">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.memory.readRecordsCount')"
              name="read_records_count"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.memory.required') }]"
              :help="t('tb.gateway.storageConfig.memory.readRecordsCountHelp')"
            >
              <InputNumber v-model:value="formState.read_records_count" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.memory.maxRecordsCount')"
              name="max_records_count"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.memory.required') }]"
              :help="t('tb.gateway.storageConfig.memory.maxRecordsCountHelp')"
            >
              <InputNumber v-model:value="formState.max_records_count" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <!-- FILE -->
      <div v-show="formState.type === 'file'">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.file.dataFolderPath')"
              name="data_folder_path"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.file.required') }]"
              :help="t('tb.gateway.storageConfig.file.dataFolderPathHelp')"
            >
              <Input v-model:value="formState.data_folder_path" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.file.maxFileCount')"
              name="max_file_count"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.file.required') }]"
              :help="t('tb.gateway.storageConfig.file.maxFileCountHelp')"
            >
              <InputNumber v-model:value="formState.max_file_count" :min="1" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.file.maxReadRecordsCount')"
              name="max_read_records_count"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.file.required') }]"
              :help="t('tb.gateway.storageConfig.file.maxReadRecordsCountHelp')"
            >
              <InputNumber v-model:value="formState.max_read_records_count" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.file.maxRecordsPerFile')"
              name="max_records_per_file"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.file.required') }]"
              :help="t('tb.gateway.storageConfig.file.maxRecordsPerFileHelp')"
            >
              <InputNumber v-model:value="formState.max_records_per_file" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <!-- SQLITE -->
      <div v-show="formState.type === 'sqlite'">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.sqlite.storagePath')"
              name="data_file_path"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.sqlite.required') }]"
              :help="t('tb.gateway.storageConfig.sqlite.storagePathHelp')"
            >
              <Input v-model:value="formState.data_file_path" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.sqlite.ttlCheckHours')"
              name="messages_ttl_check_in_hours"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.sqlite.required') }]"
              :help="t('tb.gateway.storageConfig.sqlite.ttlCheckHoursHelp')"
            >
              <InputNumber v-model:value="formState.messages_ttl_check_in_hours" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.sqlite.ttlDays')"
              name="messages_ttl_in_days"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.sqlite.required') }]"
              :help="t('tb.gateway.storageConfig.sqlite.ttlDaysHelp')"
            >
              <InputNumber v-model:value="formState.messages_ttl_in_days" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.storageConfig.sqlite.maxRecordsCount')"
              name="max_records_count"
              :rules="[{ required: true, message: t('tb.gateway.storageConfig.sqlite.required') }]"
              :help="t('tb.gateway.storageConfig.sqlite.maxRecordsCountHelp')"
            >
              <InputNumber v-model:value="formState.max_records_count" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  </Form>
</template>

<script lang="ts" setup name="Storage">
  import { ref, reactive, watch, PropType } from 'vue';
  import { Form, Segmented, Row, Col, Input, InputNumber } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { StorageConfigurationValue } from '/@/api/tb/gateways/types/configuration';
  import { DeviceCredentials } from '/@/api/tb/device';

  import { DEFAULT_STORAGE_FORM } from './default';
  import { useI18n } from '/@/hooks/web/useI18n';

  const props = defineProps({
    configuration: { type: Object as PropType<Partial<StorageConfigurationValue>>, default: () => ({}) },
    device: { type: Object as PropType<Partial<DeviceCredentials>>, default: () => ({}) },
  });

  const formRef = ref();
  const { t } = useI18n('');

  const formState = reactive<Partial<StorageConfigurationValue>>({});

  watch(
    () => props.configuration,
    (newValue) => {
      if (newValue && Object.keys(newValue).length > 0) {
        Object.assign(formState, newValue);
      } else {
        Object.assign(formState, cloneDeep(DEFAULT_STORAGE_FORM));
      }
    },
    { immediate: true, deep: true },
  );

  async function getConfiguration() {
    await formRef.value?.validate();

    return cloneDeep(formState);
  }

  defineExpose({ getConfiguration });
</script>
