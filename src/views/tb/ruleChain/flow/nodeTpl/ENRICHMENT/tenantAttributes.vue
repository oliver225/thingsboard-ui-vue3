<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="dataToFetch">
      <div class="flex justify-center mb-2">
        <Radio.Group v-model:value="formState.dataToFetch" button-style="solid">
          <Radio.Button value="ATTRIBUTES">Attributes</Radio.Button>
          <Radio.Button value="LATEST_TELEMETRY">Last telemetry</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>

    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <Form.Item
        :label="
          formState.dataToFetch == 'ATTRIBUTES'
            ? t('tb.ruleChain.nodeAction.attributeMapping')
            : t('tb.ruleChain.nodeAction.telemetryMapping')
        "
        name="dataMapping"
        :rules="[{ validator: validatorDataMapping }]"
      >
        <Table class="mapping-table">
          <tr class="header">
            <th>{{ t('tb.ruleChain.nodeAction.sourceAttribute') }}</th>
            <th>{{ t('tb.ruleChain.nodeAction.targetAttribute') }}</th>
          </tr>
          <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
            <td class="py-2 px-4">
              <Input
                v-model:value="mapping.key"
                :placeholder="t('tb.ruleChain.nodeAction.sourceAttributePlaceholder')"
              />
            </td>
            <td>
              <Input
                v-model:value="mapping.value"
                :placeholder="t('tb.ruleChain.nodeAction.targetAttributePlaceholder')"
              />
            </td>
            <td>
              <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
                <Icon
                  :icon="'ant-design:delete-outlined'"
                  :size="20"
                  color="red"
                  class="cursor-pointer"
                  @click="handleDeleteMapping(index)"
                />
              </Tooltip>
            </td>
          </tr>
        </Table>
        <Button class="my-4" type="primary" @click="handleAddMapping">{{
          t('tb.ruleChain.nodeAction.addMapping')
        }}</Button>
        <Alert type="success" :message="t('tb.ruleChain.nodeAction.templatingHelp')" />
      </Form.Item>
    </div>
    <Form.Item name="fetchTo">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <span>{{
          formState.dataToFetch == 'ATTRIBUTES'
            ? t('tb.ruleChain.nodeAction.addMappedAttributesTo')
            : t('tb.ruleChain.nodeAction.addMappedTelemetryTo')
        }}</span>
        <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
          <Radio.Button value="DATA">Message</Radio.Button>
          <Radio.Button value="METADATA">Metadata</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'tenant-attributes',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Radio, Button, Tooltip, Alert } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    dataMapping: Recordable;
    dataToFetch: 'ATTRIBUTES' | 'LATEST_TELEMETRY';
    fetchTo: 'METADATA' | 'DATA';
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const mappingList = ref<Array<any>>([]);

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    dataMapping: { alarmThreshold: 'threshold' },
    dataToFetch: 'ATTRIBUTES',
    fetchTo: 'METADATA',
  });

  watch(
    () => props.configuration,
    () => {
      mappingList.value = [];
      formState.dataMapping = props.configuration.dataMapping;
      formState.dataToFetch = props.configuration.dataToFetch;
      formState.fetchTo = props.configuration.fetchTo;
      Object.keys(formState.dataMapping).forEach((key) => {
        mappingList.value.push({ key: key, value: formState.dataMapping[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        mappingList.value.forEach((mapping) => {
          data.dataMapping[mapping.key] = mapping.value;
        });
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorDataMapping() {
    if (mappingList.value.length < 1) {
      return Promise.reject(t('tb.ruleChain.nodeAction.mappingRequired'));
    } else {
      let validateTag = true;
      mappingList.value.forEach((mapping) => {
        if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
          validateTag = false;
        }
      });
      if (!validateTag) {
        return Promise.reject(t('tb.ruleChain.nodeAction.fieldsMappingNotEmpty'));
      } else {
        return Promise.resolve();
      }
    }
  }

  function handleDeleteMapping(index: number) {
    mappingList.value.splice(index, 1);
  }

  function handleAddMapping() {
    mappingList.value.push({ key: '', value: '' });
  }

  defineExpose({ getConfiguration });
</script>

<style lang="less">
  .ant-form-item-has-error {
    .mapping-table {
      border: 1px solid #ff4d4f;
    }
  }

  .mapping-table {
    width: 100%;
    border: 1px solid @border-color-base;
    border-radius: 4px;

    .header {
      border-bottom: 1px solid @border-color-base;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      color: @border-color-base;
    }

    .td {
      padding: 2px 2px;
    }
  }
</style>
