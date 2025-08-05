<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="dataToFetch">
      <div class="flex justify-center mb-2">
        <Radio.Group v-model:value="formState.renameIn" button-style="solid">
          <Radio.Button value="DATA">消息</Radio.Button>
          <Radio.Button value="METADATA">元数据</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <Form.Item :label="formState.dataToFetch == 'DATA' ? '消息' : '元数据'" name="renameKeysMapping"
        :rules="[{ validator: validatorDataMapping }]">
        <Table class="mapping-table">
          <tr class="header">
            <th>当前key</th>
            <th>名命key</th>
          </tr>
          <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
            <td class="py-2 px-4">
              <Input v-model:value="mapping.key" placeholder="当前key" />
            </td>
            <td> <Input v-model:value="mapping.value" placeholder="名命key" />
            </td>
            <td>
              <Tooltip title="删除" class="pl-4">
                <Icon :icon="'ant-design:delete-outlined'" :size="20" color="red" class="cursor-pointer"
                  @click="handleDeleteMapping(index)" />
              </Tooltip>
            </td>
          </tr>
        </Table>
        <Button class="my-4" type="primary" @click="handleAddMapping">添加映射</Button>
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
import { Form, Input, Radio, Button, Tooltip, Alert } from 'ant-design-vue';
import { Icon } from '/@/components/Icon';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
  renameIn: 'METADATA' | 'DATA',
  renameKeysMapping: Recordable
}

const props = defineProps({
  configuration: {
    type: Object as PropType<Configuration>,
    required: true,
  },
  ruleChainId: { type: String, default: '' }
});

const mappingList = ref<Array<any>>([]);

const formRef = ref<FormInstance>();

const formState = reactive<any>({
  renameIn: "DATA",
  renameKeysMapping: { temperatureCelsius: "temperature" },
});

watch(
  () => props.configuration,
  () => {
    mappingList.value = [];
    formState.renameKeysMapping = props.configuration.renameKeysMapping;
    formState.dataToFetch = props.configuration.renameIn;
    Object.keys(formState.renameKeysMapping).forEach(key => {
      mappingList.value.push({ key: key, value: formState.renameKeysMapping[key] })
    })
  },
  { immediate: true },
);

async function getConfiguration() {
  try {
    const data = await formRef.value?.validate();
    if (data) {
      mappingList.value.forEach(mapping => {
        data.renameKeysMapping[mapping.key] = mapping.value;
      })
    }
    return data;
  } catch (error: any) {
    throw error;
  }
}

function validatorDataMapping() {
  if (mappingList.value.length < 1) {
    return Promise.reject('key映射必填！');
  } else {
    let validateTag = true;
    mappingList.value.forEach(mapping => {
      if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
        validateTag = false;
      }
    })
    if (!validateTag) {
      return Promise.reject('key映射不能存在空值！');
    } else {
      return Promise.resolve();
    }

  }
}

function handleDeleteMapping(index: number) {
  mappingList.value.splice(index, 1)
}

function handleAddMapping() {
  mappingList.value.push({ key: '', value: '' })
}

defineExpose({ getConfiguration })
</script>
