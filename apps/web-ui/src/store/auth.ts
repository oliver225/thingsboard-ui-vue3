import type { Recordable } from '@vben/types';

import type { JwtPair } from '#/types/tb';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { loadLocaleMessages } from '@vben/locales';
import { updatePreferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'antdv-next';
import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';
import { getUserToken } from '#/api/tb/user';
import { $t } from '#/locales';
import { resetRoutes } from '#/router';

import { useSystemStore } from './system';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const loginLoading = ref(false);

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    const lang = userInfo.tbUser.additionalInfo?.lang;
    const browserLocale = navigator.language.toLowerCase().startsWith('zh')
      ? 'zh-CN'
      : 'en-US';
    const locale = lang === 'zh-CN' || lang === 'en-US' ? lang : browserLocale;
    await loadLocaleMessages(locale);
    updatePreferences({ app: { locale } });
    await useSystemStore().loadSystemParams();
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(userInfo.roles ?? []);
    return userInfo;
  }

  /** 登录、账号激活与用户切换共用会话初始化，清理上一个用户的路由和缓存。 */
  async function loginWithToken(pair: JwtPair) {
    if (!pair.token || !pair.refreshToken) {
      throw new Error('Invalid login response');
    }
    resetRoutes();
    resetAllStores();
    loginLoading.value = true;
    try {
      accessStore.setAccessToken(pair.token);
      accessStore.setRefreshToken(pair.refreshToken);
      const userInfo = await fetchUserInfo();
      accessStore.setLoginExpired(false);
      return userInfo;
    } catch (error) {
      resetRoutes();
      resetAllStores();
      throw error;
    } finally {
      loginLoading.value = false;
    }
  }

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    loginLoading.value = true;
    try {
      const pair = await loginApi({
        username: params.username,
        password: params.password,
      });
      const expired = accessStore.loginExpired;
      const userInfo = await loginWithToken(pair);
      loginLoading.value = true;
      if (onSuccess) await onSuccess();
      else {
        const redirect = router.currentRoute.value.query.redirect;
        let target = userInfo.homePath || '/home';
        if (typeof redirect === 'string') {
          try {
            const decoded = decodeURIComponent(redirect);
            if (
              decoded.startsWith('/') &&
              !decoded.startsWith('//') &&
              !decoded.startsWith('/auth')
            )
              target = decoded;
          } catch {
            /* Use the role's home for malformed redirects. */
          }
        }
        await router.replace(expired ? userInfo.homePath || '/home' : target);
      }
      notification.success({
        title: $t('authentication.loginSuccess'),
        description: userInfo.realName,
      });
      return { userInfo };
    } catch {
      resetRoutes();
      resetAllStores();
      return { userInfo: null };
    } finally {
      loginLoading.value = false;
    }
  }
  async function logout(redirect = true, notifyServer = true) {
    const currentPath = router.currentRoute.value.fullPath;
    try {
      if (notifyServer && accessStore.accessToken) await logoutApi();
    } catch {
      /* Local logout must succeed even if the backend is unavailable. */
    }
    resetRoutes();
    resetAllStores();
    accessStore.setLoginExpired(false);
    await router.replace({
      path: LOGIN_PATH,
      query: redirect ? { redirect: encodeURIComponent(currentPath) } : {},
    });
  }
  async function userLogin(userId: string) {
    const pair = await getUserToken(userId);
    const userInfo = await loginWithToken(pair);
    window.location.assign(userInfo.homePath || '/home');
  }
  return {
    $reset: () => {
      loginLoading.value = false;
    },
    authLogin,
    fetchUserInfo,
    loginLoading,
    loginWithToken,
    logout,
    userLogin,
  };
});
