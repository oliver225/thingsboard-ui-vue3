
import type { ESBuildOptions } from 'vite';

export function createEsBuildOptions(mode: string): ESBuildOptions {
  return {
    // pure: viteEnv.VITE_DROP_CONSOLE ? ['console.log', 'debugger'] : [],
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  };
}
