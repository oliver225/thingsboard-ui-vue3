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
            <Tooltip :title="t('tb.ruleChain.nodeAction.format')">
              <Icon class="cursor-pointer" @click="handleFormatScript" :icon="'ant-design:format-painter-filled'" />
            </Tooltip>
            <Tooltip :title="t('tb.ruleChain.nodeAction.testScript')">
              <Icon class="cursor-pointer" @click="handleTestScript" :icon="'ant-design:bug-outlined'" />
            </Tooltip>
            <Tooltip :title="t('tb.ruleChain.nodeAction.fullScreen')">
              <Icon class="cursor-pointer" @click="handleFullScreen" :icon="'ant-design:fullscreen-outlined'" />
            </Tooltip>
          </Space>
        </div>
        <div class="border border-solid border-neutral-300 h-56">
          <CodeEditor
            v-if="formState.scriptLang == 'TBEL'"
            v-model:value="formState.tbelScript"
            :mode="MODE.JAVASCRIPT"
          />
          <CodeEditor v-if="formState.scriptLang == 'JS'" v-model:value="formState.jsScript" :mode="MODE.JAVASCRIPT" />
        </div>
        <div class="text-gray-500">}</div>
      </div>
      <Button class="mt-2" type="primary" @click="handleTestScript">
        {{ t('tb.ruleChain.nodeAction.testConversionFunction') }}
      </Button>
    </Form.Item>
  </Form>

  <TestScriptModal @register="registerTestModal" @success="handleScriptSaved" />
</template>
<script lang="ts">
  export default defineComponent({
    name: 'transform-script',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive, computed } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Form, Radio, Button, Tooltip, Space } from 'ant-design-vue';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import TestScriptModal from '../../components/TestScriptModal.vue';

  interface Configuration {
    jsScript: string;
    scriptLang: 'TBEL' | 'JS';
    tbelScript: string;
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();
  const [registerTestModal, { openModal: openTestModal }] = useModal();

  const formState = reactive<any>({
    scriptLang: 'TBEL',
    jsScript: 'return {msg: msg, metadata: metadata, msgType: msgType};',
    tbelScript: 'return {msg: msg, metadata: metadata, msgType: msgType};',
  });

  const currentScript = computed(() => {
    return formState.scriptLang === 'TBEL' ? formState.tbelScript : formState.jsScript;
  });

  const scriptLangLabel = computed(() => {
    return formState.scriptLang === 'JS' ? 'JavaScript' : 'TBEL';
  });

  watch(
    () => props.configuration,
    () => {
      formState.scriptLang = props.configuration.scriptLang;
      formState.jsScript = props.configuration.jsScript;
      formState.tbelScript = props.configuration.tbelScript;
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

  function handleFormatScript() {}

  function handleTestScript() {
    openTestModal(true, {
      scriptLang: formState.scriptLang,
      scriptContent: currentScript.value,
      modalTitle: `${t('tb.ruleChain.nodeAction.testScriptModal.title')} (${scriptLangLabel.value})`,
      transformerTitle: 'Transformer',
      scriptType: 'update',
    });
  }

  function handleScriptSaved(data: { scriptContent: string }) {
    if (formState.scriptLang === 'JS') {
      formState.jsScript = data.scriptContent;
    } else {
      formState.tbelScript = data.scriptContent;
    }
  }

  function handleFullScreen() {}

  defineExpose({ getConfiguration });
</script>
