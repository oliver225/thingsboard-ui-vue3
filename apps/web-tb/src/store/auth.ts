import type { Recordable } from '@vben/types';

import type { AuthApi } from '#/api';
import type { UserInfo } from '#/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import {
  resetAllStores,
  useAccessStore,
  useTabbarStore,
  useUserStore,
} from '@vben/stores';

import { message, notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const tabbarStore = useTabbarStore();

  const loginLoading = ref(false);

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
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { refreshToken, token } = await loginApi({
        username: params.username,
        password: params.password,
      });
      // 如果成功获取到 accessToken
      if (token) {
        accessStore.setAccessToken(token);
        accessStore.setRefreshToken(refreshToken);
        // 获取用户信息并存储到 accessStore 中

        userInfo = await fetchUserInfo();

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes([userInfo.authority]);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.additionalInfo?.homePath ||
                  preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.firstName || userInfo?.email) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.firstName || userInfo?.email}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function tokenLogin(token: AuthApi.JwtPair) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      // 如果成功获取到 accessToken
      if (token) {
        accessStore.setAccessToken(token.token);
        accessStore.setRefreshToken(token.refreshToken);

        // 获取用户信息并存储到 accessStore 中

        userInfo = await fetchUserInfo();

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes([userInfo.authority]);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          await tabbarStore.closeAllTabs(router);
          await router.push(
            userInfo.additionalInfo?.homePath ||
              preferences.app.defaultHomePath,
          );
        }

        if (userInfo?.firstName || userInfo?.email) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.firstName ?? userInfo.email} `,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }
  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
      message.error($t('authentication.logoutFailed'));
    } finally {
      resetAllStores();
      accessStore.setLoginExpired(false);
    }

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
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function getUserInfo() {
    const userInfo = userStore.userInfo as UserInfo;
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    tokenLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    getUserInfo,
  };
});
