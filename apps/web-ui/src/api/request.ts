import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { message, Modal } from 'antdv-next';

import { useAuthStore } from '#/store';

import { createThingsBoardClients } from './client';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
export const { baseRequestClient, requestClient, getAccessToken } =
  createThingsBoardClients({
    baseURL: apiURL,
    async expireSession() {
      const store = useAccessStore();
      store.setAccessToken(null);
      store.setRefreshToken(null);
      if (preferences.app.loginExpiredMode === 'modal' && store.isAccessChecked)
        store.setLoginExpired(true);
      else await useAuthStore().logout(true, false);
    },
    getLocale: () => preferences.app.locale,
    getSession: () => useAccessStore(),
    refreshEnabled: () => preferences.app.enableRefreshToken,
    reportError(content, status) {
      if (status && status >= 500) Modal.error({ title: '系统提示', content });
      else message.error(content);
    },
    setTokens({ token, refreshToken }) {
      const store = useAccessStore();
      store.setAccessToken(token);
      store.setRefreshToken(refreshToken);
    },
  });
