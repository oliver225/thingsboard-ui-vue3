
import { type PluginOption } from 'vite';
import UnoCSS from 'unocss/vite';
import UnoCSSConfig from '../../uno.config';

export function configUnoCSSPlugin(): PluginOption {
  return UnoCSS(UnoCSSConfig);
}
