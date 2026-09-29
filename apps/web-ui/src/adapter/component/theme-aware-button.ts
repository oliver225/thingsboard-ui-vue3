import type { Component } from 'vue';

import { defineComponent, h } from 'vue';

import { ConfigProvider } from 'antdv-next';
import { useConfig } from 'antdv-next/config-provider/context';

import { useAppDesignTokens } from '../design-tokens';

function createThemeAwareButton(
  Button: Component,
  type: 'default' | 'primary',
) {
  return defineComponent({
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      const config = useConfig();
      if (config.value?.theme) {
        return () => h(Button, { ...attrs, ...props, type }, slots);
      }

      const buttonTheme = useAppDesignTokens();

      return () =>
        h(
          ConfigProvider,
          { theme: buttonTheme.value },
          {
            default: () => h(Button, { ...attrs, ...props, type }, slots),
          },
        );
    },
  });
}

export { createThemeAwareButton };
