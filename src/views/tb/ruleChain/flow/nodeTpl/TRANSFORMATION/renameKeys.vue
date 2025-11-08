<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="dataToFetch">
      <div class="flex justify-center mb-2">
        <Radio.Group v-model:value="formState.renameIn" button-style="solid">
          <Radio.Button value="DATA">{{ t('tb.ruleChain.nodeAction.message') }}</Radio.Button>
          <Radio.Button value="METADATA">{{ t('tb.ruleChain.nodeAction.metadata') }}</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <Form.Item
        :label="
          formState.renameIn == 'DATA' ? t('tb.ruleChain.nodeAction.message') : t('tb.ruleChain.nodeAction.metadata')
        "
        name="renameKeysMapping"
        :rules="[{ validator: validatorDataMapping }]"
      >
        <table class="mapping-table">
          <tr class="header">
            <th>{{ t('tb.ruleChain.nodeAction.currentKey') }}</th>
            <th>{{ t('tb.ruleChain.nodeAction.renameKey') }}</th>
          </tr>
          <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
            <td class="py-2 px-4">
              <Input v-model:value="mapping.key" :placeholder="t('tb.ruleChain.nodeAction.currentKey')" />
            </td>
            <td> <Input v-model:value="mapping.value" :placeholder="t('tb.ruleChain.nodeAction.renameKey')" /> </td>
            <td>
              <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
                <Icon
                  v-if="mappingList.length > 1"
                  :icon="'ant-design:delete-outlined'"
                  :size="20"
                  color="red"
                  class="cursor-pointer"
                  @click="handleDeleteMapping(index)"
                />
              </Tooltip>
            </td>
          </tr>
        </table>
        <Button class="my-4" type="primary" @click="handleAddMapping">{{
          t('tb.ruleChain.nodeAction.addMapping')
        }}</Button>
      </Form.Item>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'rename-keys',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Radio, Button, Tooltip } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Icon } from '/@/components/Icon';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';

  const { t } = useI18n('tb');

  interface Configuration {
    renameIn: 'METADATA' | 'DATA';
    renameKeysMapping: Recordable;
  }

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
    renameIn: 'DATA',
    renameKeysMapping: { temperatureCelsius: 'temperature' },
  });

  watch(
    () => props.configuration,
    () => {
      mappingList.value = [];
      formState.renameKeysMapping = props.configuration.renameKeysMapping;
      formState.renameIn = props.configuration.renameIn;
      Object.keys(formState.renameKeysMapping).forEach((key) => {
        mappingList.value.push({ key: key, value: formState.renameKeysMapping[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        mappingList.value.forEach((mapping) => {
          data.renameKeysMapping[mapping.key] = mapping.value;
        });
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorDataMapping() {
    if (mappingList.value.length < 1) {
      return Promise.reject(t('tb.ruleChain.nodeAction.keyMappingRequired'));
    } else {
      let validateTag = true;
      mappingList.value.forEach((mapping) => {
        if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
          validateTag = false;
        }
      });
      if (!validateTag) {
        return Promise.reject(t('tb.ruleChain.nodeAction.keyMappingNotEmpty'));
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
