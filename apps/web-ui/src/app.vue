<script lang="ts" setup>
import { computed, watch } from 'vue';

import { useAntdDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';

import { App, ConfigProvider, theme } from 'antdv-next';

import { antdLocale } from '#/locales';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();
const { tokens } = useAntdDesignTokens();

/** 读取根节点 CSS 变量(HSL 三元组),转为合法 CSS 颜色 */
function cssColor(variable: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return `hsl(${value})`;
}

const tokenTheme = computed(() => {
  const algorithm = isDark.value
    ? [theme.darkAlgorithm]
    : [theme.defaultAlgorithm];

  // antd 紧凑模式算法
  if (preferences.app.compact) {
    algorithm.push(theme.compactAlgorithm);
  }

  return {
    algorithm,
    token: tokens,
    components: {
      // 全局:Segmented 选中态使用主题色
      Segmented: {
        itemSelectedBg: tokens.colorPrimary,
        itemSelectedColor: cssColor('--primary-foreground'),
      },
      // 全局:Tag 默认色(无 color 时)对齐菜单选中态
      // —— 主题色文字 + 15% 主题色背景 + 无边框,跟随主题切换
      Tag: {
        colorBorder: 'transparent',
        defaultBg: 'hsl(var(--primary) / 15%)',
        defaultColor: 'hsl(var(--primary))',
      },
    },
  };
});

watch(
  tokenTheme,
  (themeConfig) => {
    ConfigProvider.config({ theme: themeConfig });
  },
  { immediate: true },
);
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <RouterView />
    </App>
  </ConfigProvider>
</template>
