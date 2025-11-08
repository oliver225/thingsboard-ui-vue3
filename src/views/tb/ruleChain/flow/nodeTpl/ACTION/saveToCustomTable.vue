<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.customTableName')"
      name="tableName"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.customTableNameRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customTableNameHelp')"
    >
      <Input v-model:value="formState.tableName" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.defaultTtl')"
      name="defaultTtl"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.defaultTtlRequired') }]"
      :help="t('tb.ruleChain.nodeAction.defaultTtlHelp')"
    >
      <InputNumber
        v-model:value="formState.defaultTtl"
        :addon-after="t('tb.ruleChain.nodeAction.unitSecond')"
        :style="{ width: '100%' }"
        :min="0"
      />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.fieldsMapping')"
      name="fieldsMapping"
      :rules="[{ validator: validatorFieldsMapping }]"
    >
      <Table class="mapping-table">
        <tr class="header">
          <th>{{ t('tb.ruleChain.nodeAction.messageField') }}</th>
          <th>{{ t('tb.ruleChain.nodeAction.tableColumn') }}</th>
        </tr>
        <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
          <td class="py-2 px-4">
            <Input v-model:value="mapping.key" :placeholder="t('tb.ruleChain.nodeAction.sourcePropertyPlaceholder')" />
          </td>
          <td>
            <Input
              v-model:value="mapping.value"
              :placeholder="t('tb.ruleChain.nodeAction.targetPropertyPlaceholder')"
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
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'save-to-custom-table',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Form, Input, InputNumber, Button, Tooltip } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    fieldsMapping: Recordable;
    tableName: string;
    defaultTtl: number;
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
    fieldsMapping: {},
    tableName: undefined,
    defaultTtl: 0,
  });

  watch(
    () => props.configuration,
    () => {
      mappingList.value = [];
      formState.fieldsMapping = props.configuration.fieldsMapping;
      formState.tableName = props.configuration.tableName;
      formState.defaultTtl = props.configuration.defaultTtl ?? 0;
      Object.keys(formState.fieldsMapping).forEach((key) => {
        mappingList.value.push({ key: key, value: formState.fieldsMapping[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        mappingList.value.forEach((mapping) => {
          data.fieldsMapping[mapping.key] = mapping.value;
        });
      }

      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorFieldsMapping() {
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
