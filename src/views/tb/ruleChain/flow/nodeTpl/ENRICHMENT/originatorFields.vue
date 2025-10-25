<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <Form.Item
        :label="t('tb.ruleChain.nodeAction.originatorFieldsMapping')"
        name="dataMapping"
        :rules="[{ validator: validatorDataMapping }]"
      >
        <Table class="mapping-table">
          <tr class="header">
            <th>{{ t('tb.ruleChain.nodeAction.sourceField') }}</th>
            <th>{{ t('tb.ruleChain.nodeAction.targetField') }}</th>
          </tr>
          <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
            <td class="py-2 px-4">
              <Select v-model:value="mapping.key" :options="mappingKeyOptions" />
            </td>
            <td>
              <Input v-model:value="mapping.value" :placeholder="t('tb.ruleChain.nodeAction.targetFieldPlaceholder')" />
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
        <Alert type="success" :message="t('tb.ruleChain.nodeAction.targetFieldTemplatingHelp')" />
      </Form.Item>
    </div>
    <Form.Item name="fetchTo">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <span>{{ t('tb.ruleChain.nodeAction.addOriginatorFieldsTo') }}</span>
        <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
          <Radio.Button value="DATA">Message</Radio.Button>
          <Radio.Button value="METADATA">Metadata</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <Form.Item name="ignoreNullStrings">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <Checkbox v-model:checked="formState.ignoreNullStrings">
          {{ t('tb.ruleChain.nodeAction.skipNullFields') }}
        </Checkbox>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'originator-fields',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Select, Radio, Button, Checkbox, Tooltip, Alert } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    dataMapping: Recordable;
    ignoreNullStrings: boolean;
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

  const mappingKeyOptions = [
    { value: 'createdTime', label: t('tb.ruleChain.nodeAction.createdTime') },
    { value: 'name', label: t('tb.ruleChain.nodeAction.name') },
    { value: 'firstName', label: t('tb.ruleChain.nodeAction.firstName') },
    { value: 'lastName', label: t('tb.ruleChain.nodeAction.lastName') },
    { value: 'email', label: t('tb.ruleChain.nodeAction.email') },
    { value: 'title', label: t('tb.ruleChain.nodeAction.title') },
    { value: 'country', label: t('tb.ruleChain.nodeAction.country') },
    { value: 'state', label: t('tb.ruleChain.nodeAction.state') },
    { value: 'city', label: t('tb.ruleChain.nodeAction.city') },
    { value: 'address', label: t('tb.ruleChain.nodeAction.address') },
    { value: 'address2', label: t('tb.ruleChain.nodeAction.address2') },
    { value: 'zip', label: t('tb.ruleChain.nodeAction.zip') },
    { value: 'phone', label: t('tb.ruleChain.nodeAction.phone') },
    { value: 'label', label: t('tb.ruleChain.nodeAction.label') },
    { value: 'id', label: t('tb.ruleChain.nodeAction.id') },
  ];

  const mappingList = ref<Array<any>>([]);

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    dataMapping: { name: 'originatorName' },
    ignoreNullStrings: false,
    fetchTo: 'METADATA',
  });

  watch(
    () => props.configuration,
    () => {
      mappingList.value = [];
      formState.dataMapping = props.configuration.dataMapping;
      formState.ignoreNullStrings = props.configuration.ignoreNullStrings;
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
      return Promise.reject(t('tb.ruleChain.nodeAction.originatorFieldsMappingRequired'));
    } else {
      let validateTag = true;
      mappingList.value.forEach((mapping) => {
        if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
          validateTag = false;
        }
      });
      if (!validateTag) {
        return Promise.reject(t('tb.ruleChain.nodeAction.originatorFieldsMappingNotEmpty'));
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
    align: 'center';
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
