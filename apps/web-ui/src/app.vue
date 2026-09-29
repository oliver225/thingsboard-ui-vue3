<script lang="ts" setup>
import { watch, watchEffect } from 'vue';

import { App, ConfigProvider, StyleProvider } from 'antdv-next';

import { globalUiConfig, useAppDesignTokens } from '#/adapter/design-tokens';
import { antdLocale } from '#/locales';

defineOptions({ name: 'App' });

const tokenTheme = useAppDesignTokens();
watchEffect(() => {
  document.documentElement.style.setProperty(
    '--app-font-family',
    globalUiConfig.fontFamily,
  );
  document.documentElement.style.setProperty(
    '--font-family',
    globalUiConfig.fontFamily,
  );
});

watch(
  [tokenTheme, antdLocale],
  ([themeConfig, locale]) => {
    ConfigProvider.config({ theme: themeConfig, locale });
  },
  { immediate: true },
);
</script>

<template>
  <!-- layer: antd 组件样式注入 @layer antd，让 Tailwind 工具类可以覆盖组件样式 -->
  <StyleProvider layer>
    <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
      <App>
        <RouterView />
      </App>
    </ConfigProvider>
  </StyleProvider>
</template>
