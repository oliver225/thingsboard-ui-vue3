import type { Recordable, UserInfo } from '@vben/types';

import type { JwtPair } from '#/types/tb';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'antdv-next';
import { defineStore } from 'pinia';

import { getUserInfoApi, getUserToken, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function handleLoginSuccess(
    jwtPair: JwtPair,
    options: {
      onSuccess?: () => Promise<void> | void;
      reload?: boolean;
      showNotification?: boolean;
    } = {},
  ) {
    const { refreshToken, token } = jwtPair;
    if (!token) {
      return null;
    }

    accessStore.setAccessToken(token);
    accessStore.setRefreshToken(refreshToken);

    const userInfo = await fetchUserInfo();
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(userInfo.roles ?? []);

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else if (options.onSuccess) {
      await options.onSuccess();
    } else if (options.reload) {
      (
        accessStore as typeof accessStore & { $persist?: () => void }
      ).$persist?.();
      window.location.replace(
        userInfo.homePath || preferences.app.defaultHomePath,
      );
    } else {
      await router.push(userInfo.homePath || preferences.app.defaultHomePath);
    }

    if (options.showNotification && userInfo?.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
        duration: 3,
        title: $t('authentication.loginSuccess'),
      });
    }

    return userInfo;
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo;
    try {
      loginLoading.value = true;
      // TB 登录返回 JwtPair { token, refreshToken }
      const jwtPair = await loginApi(
        params as { password: string; username: string },
      );
      userInfo = await handleLoginSuccess(jwtPair, {
        onSuccess,
        showNotification: true,
      });
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function userLogin(userId: string) {
    const jwtPair = await getUserToken(userId);
    if (!jwtPair.token) {
      return;
    }
    resetAllStores();
    await handleLoginSuccess(jwtPair, { reload: true });
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    userLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
