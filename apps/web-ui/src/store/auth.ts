import type { Recordable } from '@vben/types';

import type { LoginResponse } from '#/api/tb/auth';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { loadLocaleMessages } from '@vben/locales';
import { updatePreferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { message, notification } from 'antdv-next';
import { defineStore } from 'pinia';

import { getUserInfoApi } from '#/api';
import { loginApi, logoutApi } from '#/api/tb/auth';
import { getUserToken } from '#/api/tb/user';
import { $t } from '#/locales';
import { resetRoutes } from '#/router';
import { getLoginRedirect, getTokenClaims } from '#/utils/auth';

import { useSystemStore } from './system';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const loginLoading = ref(false);
  // 会话重置时递增；异步请求返回后比较版本，防止旧账号的响应覆盖新会话。
  const sessionVersion = ref(0);
  // 2FA 临时凭据，仅存内存，不写入正式登录令牌；认证完成或取消后清除。
  // PRE_VERIFICATION_TOKEN 表示待验证，MFA_CONFIGURATION_TOKEN 表示待绑定认证方式。
  const challenge = ref<{ token: string; scope: string }>();

  async function fetchUserInfo() {
    const version = sessionVersion.value;
    const userInfo = await getUserInfoApi();
    if (version !== sessionVersion.value) {
      throw new Error('Session changed');
    }
    const lang = userInfo.tbUser.additionalInfo?.lang;
    const browserLocale = navigator.language.toLowerCase().startsWith('zh')
      ? 'zh_CN'
      : 'en_US';
    const locale = lang === 'zh_CN' || lang === 'en_US' ? lang : browserLocale;
    await loadLocaleMessages(locale);
    if (version !== sessionVersion.value) {
      throw new Error('Session changed');
    }
    updatePreferences({ app: { locale } });
    await useSystemStore().loadSystemParams();
    if (version !== sessionVersion.value) {
      throw new Error('Session changed');
    }
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(userInfo.roles ?? []);
    return userInfo;
  }

  /** 登录、账号激活与用户切换共用会话初始化，清理上一个用户的路由和缓存。 */
  async function loginWithToken(pair: LoginResponse) {
    const claims = getTokenClaims(pair.token);
    const scope = claims.scopes[0];
    const restricted =
      scope === 'PRE_VERIFICATION_TOKEN' || scope === 'MFA_CONFIGURATION_TOKEN';
    if (
      !scope ||
      claims.exp * 1000 <= Date.now() ||
      (pair.scope && pair.scope !== scope) ||
      (!restricted &&
        (!pair.refreshToken ||
          !['CUSTOMER_USER', 'SYS_ADMIN', 'TENANT_ADMIN'].includes(scope)))
    )
      throw new Error($t('authentication.session.invalid'));
    resetRoutes();
    resetAllStores();
    if (restricted) {
      challenge.value = { token: pair.token, scope };
      return null;
    }
    const version = sessionVersion.value;
    loginLoading.value = true;
    try {
      accessStore.setAccessToken(pair.token);
      accessStore.setRefreshToken(pair.refreshToken ?? '');
      const userInfo = await fetchUserInfo();
      accessStore.setLoginExpired(false);
      return userInfo;
    } catch (error) {
      if (version === sessionVersion.value) {
        resetRoutes();
        resetAllStores();
      }
      throw error;
    } finally {
      if (version === sessionVersion.value) loginLoading.value = false;
    }
  }

  async function completeLogin(pair: LoginResponse) {
    const expired = accessStore.loginExpired;
    const redirect = router.currentRoute.value.query.redirect;
    const userInfo = await loginWithToken(pair);
    if (!userInfo) {
      await router.replace({
        path: '/auth/two-factor',
        query: {
          redirect: typeof redirect === 'string' ? redirect : undefined,
        },
      });
      return;
    }
    await router.replace(
      getLoginRedirect(
        expired ? undefined : redirect,
        userInfo.homePath || '/home',
      ),
    );
    notification.success({
      title: $t('authentication.loginSuccess'),
      description: userInfo.realName,
    });
  }

  async function authLogin(params: Recordable<any>) {
    if (loginLoading.value) return;
    const version = sessionVersion.value;
    loginLoading.value = true;
    try {
      const pair = await loginApi({
        username: params.username.trim(),
        password: params.password,
      });
      if (version !== sessionVersion.value) return;
      await completeLogin(pair);
    } catch (error: any) {
      if (!error.response && error.message !== 'Session changed')
        message.error(error.message || $t('authentication.session.invalid'));
    } finally {
      if (version === sessionVersion.value) loginLoading.value = false;
    }
  }
  async function logout(redirect = true, notifyServer = true) {
    const version = sessionVersion.value;
    const currentPath = router.currentRoute.value.fullPath;
    try {
      if (notifyServer && accessStore.accessToken) await logoutApi();
    } catch {
      /* Local logout must succeed even if the backend is unavailable. */
    }
    if (version !== sessionVersion.value) return;
    resetRoutes();
    resetAllStores();
    accessStore.setLoginExpired(false);
    await router.replace({
      path: LOGIN_PATH,
      query: redirect ? { redirect: encodeURIComponent(currentPath) } : {},
    });
  }
  async function userLogin(userId: string) {
    const version = sessionVersion.value;
    const pair = await getUserToken(userId);
    if (version !== sessionVersion.value) return;
    const userInfo = await loginWithToken(pair);
    await router.replace(
      userInfo ? userInfo.homePath || '/home' : '/auth/two-factor',
    );
  }
  return {
    $reset: () => {
      ++sessionVersion.value;
      challenge.value = undefined;
      loginLoading.value = false;
    },
    authLogin,
    challenge,
    completeLogin,
    fetchUserInfo,
    loginLoading,
    loginWithToken,
    logout,
    sessionVersion,
    userLogin,
  };
});
