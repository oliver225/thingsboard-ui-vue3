import type { GlobConfig } from '/#/config';

import { getAppEnvConfig } from '/@/utils/env';

let globCache: Readonly<GlobConfig>;
export const useGlobSetting = (): Readonly<GlobConfig> => {
  if (globCache) return globCache;

  const {
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_API_URL,
    VITE_GLOB_APP_SHORT_NAME,
    VITE_GLOB_API_URL_PREFIX,
    VITE_FILE_PREVIEW,
  } = getAppEnvConfig();

  const ctxPath = ((): string => {
    let ctx = VITE_GLOB_API_URL + VITE_GLOB_API_URL_PREFIX;
    let idx = ctx.indexOf('://');
    if (idx != -1) {
      ctx = ctx.substring(idx + 3);
    }
    idx = ctx.indexOf('/');
    if (idx != -1) {
      ctx = ctx.substring(idx);
    } else {
      ctx = '';
    }
    return ctx;
  })();

  // Take global configuration
  const glob: Readonly<GlobConfig> = {
    title: VITE_GLOB_APP_TITLE,
    apiUrl: VITE_GLOB_API_URL,
    shortName: VITE_GLOB_APP_SHORT_NAME,
    urlPrefix: VITE_GLOB_API_URL_PREFIX,
    ctxPath: ctxPath,
    filePreview: VITE_FILE_PREVIEW || 'true',
  };
  globCache = glob;
  return glob as Readonly<GlobConfig>;
};
