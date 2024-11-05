<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="scriptLang">
      <div class="flex justify-center mb-2">
        <Radio.Group v-model:value="formState.scriptLang" button-style="solid">
          <Radio.Button value="JS">JavaScript</Radio.Button>
          <Radio.Button value="TBEL">&nbsp;&nbsp;&nbsp;TBEL&nbsp;&nbsp;&nbsp;</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <Form.Item :name="formState.scriptLang == 'TBEL' ? 'tbelScript' : 'jsScript'">
      <div>
        <div class="flex justify-between">
          <p class="text-gray-500">function Transform(msg, metadata, msgType) {</p>
          <Space>
            <Tooltip title="格式化">
              <Icon class="cursor-pointer" @click="handleFormatScript" :icon="'ant-design:format-painter-filled'" />
            </Tooltip>
            <Tooltip title="测试脚本功能">
              <Icon class="cursor-pointer" @click="handleTestScript" :icon="'ant-design:bug-outlined'" />
            </Tooltip>
            <Tooltip title="全屏">
              <Icon class="cursor-pointer" @click="handleFullScreen" :icon="'ant-design:fullscreen-outlined'" />
            </Tooltip>
          </Space>
        </div>
        <div class="py-2">
          <CodeEditor v-if="formState.scriptLang == 'TBEL'" v-model:value="formState.tbelScript" :mode="'tbelScript'"
            class="border border-solid border-gray-400" />
          <CodeEditor v-if="formState.scriptLang == 'JS'" v-model:value="formState.jsScript" :mode="MODE.JS"
            class="border border-solid border-gray-400" />
        </div>
        <div class="text-gray-500">}</div>
      </div>
      <Button class="mt-2" type="primary" @click="handleTestScript">测试转换函数</Button>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
export default defineComponent({
  name: "script",
});
</script>
<script lang="ts" setup>
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Form, Radio, Button, Tooltip, Space } from 'ant-design-vue';
import { CodeEditor, MODE } from '/@/components/CodeEditor';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
  jsScript: string,
  scriptLang: 'TBEL' | 'JS',
  tbelScript: string,
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
  scriptLang: 'TBEL',
  jsScript: 'return {msg: msg, metadata: metadata, msgType: msgType};',
  tbelScript: 'return {msg: msg, metadata: metadata, msgType: msgType};',
});

watch(
  () => props.configuration,
  () => {
    formState.scriptLang = props.configuration.scriptLang;
    formState.jsScript = props.configuration.jsScript;
    formState.tbelScript = props.configuration.tbelScript;
  },
  { immediate: true }
)

async function getConfiguration() {
  try {
    return await formRef.value?.validate();
  } catch (error: any) {
    throw error;
  }
}

function handleFormatScript() {

}

function handleTestScript() {

}

function handleFullScreen() {

}

defineExpose({ getConfiguration })

</script>
