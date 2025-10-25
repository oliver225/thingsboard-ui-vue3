
import type { CSSOptions } from 'vite';
import { generateModifyVars } from '../theme/modifyVars';

export function createCSSOptions(): CSSOptions {
  return {
    preprocessorOptions: {
      less: {
        modifyVars: generateModifyVars(),
        javascriptEnabled: true,
      },
    },
  };
}
