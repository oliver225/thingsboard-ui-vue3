<script setup lang="ts">
import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import ScriptEditor from '#/adapter/component/code-editor/script-editor.vue';

import ScriptTest from '../script-test.vue';

const props = withDefaults(
  defineProps<{
    language: 'JS' | 'TBEL';
    scriptType: string;
    functionName: string;
    functionArgs?: string[];
    nodeId?: string;
  }>(),
  {
    functionArgs: () => ['msg', 'metadata', 'msgType'],
    nodeId: undefined,
  },
);
const value = defineModel<string>({ default: '' });
const title = computed(
  () => `function ${props.functionName}(${props.functionArgs.join(', ')}) {`,
);
const parameters = computed(() => props.functionArgs.map((name) => ({ name })));
const [TestModal, testApi] = useVbenModal({ connectedComponent: ScriptTest });

function handleTest() {
  testApi
    .setData({
      script: value.value,
      scriptLang: props.language,
      scriptType: props.scriptType,
      title: title.value,
      parameters: parameters.value,
      nodeId: props.nodeId,
      onApply: (script: string) => {
        value.value = script;
      },
    })
    .open();
}
</script>

<template>
  <div class="w-full min-w-0">
    <ScriptEditor
      v-model="value"
      :title="title"
      :parameters="parameters"
      :language="language === 'JS' ? 'javascript' : 'tbel'"
      :height="280"
      :test-handler="handleTest"
    />
    <TestModal />
  </div>
</template>
