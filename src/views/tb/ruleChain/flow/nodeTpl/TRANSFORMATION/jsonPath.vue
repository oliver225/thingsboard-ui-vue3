<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item label="jsonPath表达式" name="jsonPath"
      :rules="[{ required: true, validator: validatorJsonPath, message: 'jsonPaht值不能为空!' }]">
      <Input v-model:value="formState.jsonPath" style="width: 100%;">
      </Input>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
export default defineComponent({
  name: 'json-path',
});
</script>
<script lang="ts" setup>
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
  jsonPath: string;
}

const props = defineProps({
  configuration: {
    type: Object as PropType<Configuration>,
    required: true,
  },
  ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
  jsonPath: '$'
});

watch(
  () => props.configuration,
  () => {
    formState.jsonPath = props.configuration.jsonPath;
  },
  { immediate: true },
);

async function getConfiguration() {
  try {
    return await formRef.value?.validate();
  } catch (error: any) {
    throw error;
  }
}

function validatorJsonPath() {
  if (!isEmpty(formState.jsonPath)) {
    return Promise.resolve();
  } else {
    return Promise.reject('jsonPaht必须填写！');
  }
}

defineExpose({ getConfiguration });
</script>
