import type { GlobConfig } from '/#/config';

import { getAppEnvConfig, isProdMode } from '/@/utils/env';

let globCache: Readonly<GlobConfig>;
export const useGlobSetting = (): Readonly<GlobConfig> => {
  if (globCache) return globCache;

  const {
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_API_URL,
    VITE_GLOB_APP_SHORT_NAME,
    VITE_GLOB_API_URL_PREFIX,
    VITE_GLOB_WS_PREFIX,
    // VITE_GLOB_UPLOAD_URL,
    VITE_GLOB_ADMIN_PATH,
    // VITE_FILE_PREVIEW,
    VITE_PROXY,
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

  const adminPath = VITE_GLOB_ADMIN_PATH as string;
  const ctxAdminPath = ctxPath + adminPath;


  const wsPath = ((): string => {
    if (isProdMode()) {
      return `${location.protocol.replace('https:', 'wss://').replace('http:', 'ws://')}${location.host}${VITE_GLOB_WS_PREFIX}`;
    }
    const proxyHost = VITE_PROXY[0][1].replace(VITE_PROXY[0][0], '');
    return `${proxyHost.replace('https:', 'wss://').replace('http:', 'ws://')}${VITE_GLOB_WS_PREFIX}`;
  })();

  // Take global configuration
  const glob: Readonly<GlobConfig> = {
    title: VITE_GLOB_APP_TITLE,
    apiUrl: VITE_GLOB_API_URL,
    shortName: VITE_GLOB_APP_SHORT_NAME,
    urlPrefix: VITE_GLOB_API_URL_PREFIX,
    // uploadUrl: VITE_GLOB_UPLOAD_URL,
    ctxPath: ctxPath,
    adminPath: adminPath,
    ctxAdminPath: ctxAdminPath,
    // filePreview: VITE_FILE_PREVIEW || 'true',
    wsPath: wsPath,
  };
  globCache = glob;
  return glob as Readonly<GlobConfig>;
};
