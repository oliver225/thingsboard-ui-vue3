<script lang="ts" setup>
import { nextTick, watch } from 'vue';

import Prism from 'prismjs';

import 'prismjs/plugins/line-numbers/prism-line-numbers.min.js';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js';

import 'prismjs/themes/prism-tomorrow.css'; // 高亮主题

defineOptions({
  name: 'CodeViewer',
});

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'javascript',
  },
  lineNumber: {
    type: Boolean,
    default: false,
  },

  theme: {
    type: String,
    default: '',
  },
});
watch(
  () => props.value,
  () => {
    nextTick(() => {
      Prism.highlightAll();
    });
  },
  { immediate: true },
);

// watch(
//   () => props.theme,
//   () => {
//     changeTheme(props.theme);
//   },
//   { immediate: true },
// );
// function changeTheme(theme: string) {
//   // 移除旧的主题 link
//   const oldLink = document.querySelector('#prism-theme');
//   if (oldLink) {
//     oldLink.remove();
//   }

//   // 创建新的 link 元素
//   const link = document.createElement('link');
//   link.id = 'prism-theme';
//   link.rel = 'stylesheet';
//   link.href = `prismjs/themes/prism.css`;
//   if (theme) {
//     link.href = `prismjs/themes/prism-${theme}.css`;
//   }
//   document.head.append(link);
// }
</script>

<template>
  <div :class="[`${lineNumber ? '' : ''}`]">
    <pre
      class="code-viewer rounded-[var(--radius)]"
      :class="[`language-${language}`]"
    ><code :class="[`language-${language}`]" :innerHTML="value"></code></pre>
  </div>
</template>
