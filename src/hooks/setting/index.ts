import type { GlobConfig } from '/#/config';

import { getAppEnvConfig, isProdMode } from '/@/utils/env';

let globCache: Readonly<GlobConfig>;
export const useGlobSetting = (): Readonly<GlobConfig> => {
  if (globCache) return globCache;

  const {
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_API_URL,
    VITE_GLOB_API_URL_WEBSOCKET,
    VITE_GLOB_APP_SHORT_NAME,
    VITE_GLOB_API_URL_PREFIX,
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

  const websocketPath = ((): string => {
    if (isProdMode()) {
      return `${location.protocol.replace('https:', 'wss:').replace('http:', 'ws:')}${location.host}${VITE_GLOB_API_URL_WEBSOCKET}`;
    }
    const viteProxy = JSON.parse(VITE_PROXY);
    const proxyHost = viteProxy[0][1].replace(viteProxy[0][0], '');
    return `${proxyHost.replace('https:', 'wss:').replace('http:', 'ws:')}${VITE_GLOB_API_URL_WEBSOCKET}`;
  })();

  // Take global configuration
  const glob: Readonly<GlobConfig> = {
    title: VITE_GLOB_APP_TITLE,
    apiUrl: VITE_GLOB_API_URL,
    shortName: VITE_GLOB_APP_SHORT_NAME,
    urlPrefix: VITE_GLOB_API_URL_PREFIX,
    ctxPath: ctxPath,
    websocketPath: websocketPath,
  };
  globCache = glob;
  return glob as Readonly<GlobConfig>;
};
