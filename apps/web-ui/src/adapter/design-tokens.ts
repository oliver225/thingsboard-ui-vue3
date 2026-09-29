import { computed, reactive } from 'vue';

import { useAntdDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';

import { theme } from 'antdv-next';
export const globalUiConfig = reactive({
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
});
export function useAppDesignTokens() {
  const { tokens } = useAntdDesignTokens();
  const { isDark } = usePreferences();
  return computed(() => {
    const primaryForeground = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground')})`;
    const primaryText = 'hsl(var(--primary-text, var(--primary)))';
    // 深色算法会压暗品牌底色；Logo 主题的实色控件保持同一组明亮色阶。
    const primaryControls =
      preferences.theme.colorPrimary.toLowerCase() === '#00c07f'
        ? {
            colorPrimary: tokens.colorPrimary,
            colorPrimaryHover: '#20CC91',
            colorPrimaryActive: '#00B578',
          }
        : {};
    return {
      algorithm: [
        ...(isDark.value ? [theme.darkAlgorithm] : [theme.defaultAlgorithm]),
        ...(preferences.app.compact ? [theme.compactAlgorithm] : []),
      ],
      token: {
        ...tokens,
        colorPrimaryText: primaryText,
        colorLink: primaryText,
        // 全局选项交互使用中性色；Select、Tree、Table 等继承这些背景。
        controlItemBgHover: 'hsl(var(--accent))',
        controlItemBgActive: 'hsl(var(--accent))',
        controlItemBgActiveHover: 'hsl(var(--accent))',
        // Vben stores radius in rem; its root font size is configurable.
        borderRadius:
          Number.parseFloat(preferences.theme.radius) *
          preferences.theme.fontSize,
        fontFamily: globalUiConfig.fontFamily,
        fontSize: preferences.theme.fontSize,
      },
      // 仅声明组件默认值与全局主题不同的部分。
      components: {
        Button: {
          ...primaryControls,
          primaryColor: primaryForeground,
        },
        Checkbox: {
          ...primaryControls,
          colorWhite: primaryForeground,
        },
        DatePicker: {
          ...primaryControls,
          colorTextLightSolid: primaryForeground,
        },
        Radio: {
          ...primaryControls,
          radioColor: primaryForeground,
          buttonSolidCheckedColor: primaryForeground,
        },
        Segmented: {
          itemSelectedBg: 'hsl(var(--primary))',
          itemSelectedColor: 'hsl(var(--primary-foreground))',
        },
        Switch: {
          ...primaryControls,
          colorTextLightSolid: primaryForeground,
        },
      },
    };
  });
}
