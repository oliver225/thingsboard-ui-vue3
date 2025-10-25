
import { type PluginOption } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { legacyTargets } from '../options/build';

export function configLegacyPlugin(isBuild: boolean, viteEnv: ViteEnv): PluginOption {
  if (!(isBuild && viteEnv.VITE_LEGACY)) {
    return [];
  }
  return legacy({
    targets: legacyTargets,
    modernPolyfills: true,
  });
}
