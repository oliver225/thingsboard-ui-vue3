import { defineConfig, UserConfig, presetTypography, presetIcons, transformerDirectives } from 'unocss';
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders';
import { presetWind3 } from '@unocss/preset-wind3';

export default defineConfig({
  inspector: false,
  content: {
    pipeline: {
      include: ['**/*.vue', '**/*.tsx', '**/*.ts', '**/*-lib/**/*.mjs'],
      exclude: ['.git', '.idea', '.turbo', 'node_modules', 'public'],
    },
  },
  theme: {
    animation: {
      keyframes: {
        float: '{0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); }}',
      },
      durations: {
        float: '3s',
      },
      timingFns: {
        float: 'ease-in-out',
      },
      counts: {
        float: 'infinite',
      },
    },
  },
  presets: [
    presetWind3(),
    presetTypography(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        svg: FileSystemIconLoader(__dirname + '/src/assets/icons'),
      },
    }),
  ],
  transformers: [transformerDirectives()],
} as UserConfig);
