import type { JwtPair, UserInfo } from '/#/store';
import type { ErrorMessageMode } from '/#/axios';
import { defineStore } from 'pinia';
import { store } from '/@/store';
import { PageEnum } from '/@/enums/pageEnum';
import { TOKEN_KEY, USER_INFO_KEY, SESSION_TIMEOUT_KEY, REFRESH_TOKEN_KEY, AUTHORITY_KEY } from '/@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '/@/utils/auth';
import { loginApi, logoutApi, userInfoApi, LoginParams } from '/@/api/tb/login';
// import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { usePermissionStore } from '/@/store/modules/permission';
import { RouteRecordRaw } from 'vue-router';
import { PAGE_NOT_FOUND_ROUTE } from '/@/router/routes/basic';
import { useGlobSetting } from '/@/hooks/setting';
import logoImg from '/@/assets/images/logo.png';
import { mitt, Emitter } from '/@/utils/mitt';
import { Authority } from '/@/enums/authorityEnum';

const { showMessage, createConfirm } = useMessage();

interface UserState {
  userInfo: Nullable<UserInfo>;
  token?: string;
  refreshToken?: string;
  authority?: Authority | string;
  sessionTimeout?: boolean;
  lastUpdateTime: number;
  pageCache: any;
  emitter: Emitter<any>;
}

export const useUserStore = defineStore('app-user', {
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    token: undefined,
    // authority
    authority: undefined,
    // Whether the login expired
    sessionTimeout: undefined,
    // Last fetch time
    lastUpdateTime: 0,
    // 刷新页面及销毁的缓存
    pageCache: {},
    // 全局事件 think gem
    emitter: mitt(),
  }),
  getters: {
    getUserInfo(): UserInfo {
      return this.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getToken(): string {
      return this.token || getAuthCache<string>(TOKEN_KEY);
    },
    getRefreshToken(): string {
      return this.token || getAuthCache<string>(REFRESH_TOKEN_KEY);
    },
    getAuthority(): Authority | string {
      return this.authority ?? getAuthCache<Authority | string>(AUTHORITY_KEY);
    },
    getSessionTimeout(): boolean {
      return !!(this.sessionTimeout || getAuthCache<boolean>(SESSION_TIMEOUT_KEY));
    },
    getLastUpdateTime(): number {
      return this.lastUpdateTime;
    },
    getPageCache(): any {
      return this.pageCache;
    },
    getEmitter(): any {
      return this.emitter;
    },
  },
  actions: {
    setToken(token: JwtPair | undefined) {
      this.token = token?.token || undefined;
      this.refreshToken = token?.refreshToken || undefined;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(TOKEN_KEY, token?.token);
      setAuthCache(REFRESH_TOKEN_KEY, token?.refreshToken);
      // 设置thingsboard 平台原生的 token 方便IFRAME 访问
      localStorage.setItem('jwt_token', token?.token || '');
      localStorage.setItem('refresh_token', token?.refreshToken || '');
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
      setAuthCache(SESSION_TIMEOUT_KEY, flag);
    },
    setUserInfo(info: UserInfo | null) {
      if (info) {
        const { ctxPath } = useGlobSetting();
        let url = info.additionalInfo?.avatarUrl || '/resource/img/avatar.jpg';
        const avatarUrl = url || logoImg;
        info.additionalInfo = { ...info.additionalInfo, avatarUrl: avatarUrl };
        this.setAuthority(info.authority);
      }
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setAuthority(authority: Authority | string | undefined) {
      this.authority = authority;
      setAuthCache(AUTHORITY_KEY, authority);
    },
    resetState() {
      this.userInfo = null;
      this.token = '';
      this.authority = undefined;
      this.sessionTimeout = true;
    },
    setPageCache(key: string, value: any) {
      this.pageCache[key] = value;
    },
    getPageCacheByKey(key: string, defaultValue?: any): any {
      if (!this.pageCache[key] && defaultValue) {
        this.pageCache[key] = defaultValue;
      }
      return this.pageCache[key];
    },
    async login(
      params: LoginParams & {
        goHome?: boolean;
        mode?: ErrorMessageMode;
      },
    ) {
      const { goHome = true, mode, ...loginParams } = params;
      const jwtPair = await loginApi(loginParams, mode);
      if (!jwtPair) {
        throw new Error('Login failed, please try again!');
      }
      this.setToken(jwtPair);
      const res = await userInfoApi();
      await this.afterLoginAction(res, goHome);
      return res;
    },
    // async afterLoginAction(goHome?: boolean): Promise<GetUserInfoModel | null> {
    async afterLoginAction(res: UserInfo, goHome?: boolean) {
      this.setUserInfo(res);
      this.initPageCache(res);
      this.setSessionTimeout(false);
      const permissionStore = usePermissionStore();
      if (!permissionStore.isDynamicAddedRoute) {
        const routes = await permissionStore.buildRoutesAction();
        routes.forEach((route) => {
          router.addRoute(route as unknown as RouteRecordRaw);
        });
        router.addRoute(PAGE_NOT_FOUND_ROUTE as unknown as RouteRecordRaw);
        permissionStore.setDynamicAddedRoute(true);
      }
      if (goHome) {
        const currentRoute = router.currentRoute.value;
        let path = currentRoute.query.redirect;
        if (path !== '/') {
          path = path || res.additionalInfo?.homePath || PageEnum.BASE_HOME;
        } else {
          path = res.additionalInfo?.homePath || PageEnum.BASE_HOME;
        }
        await router.replace(decodeURIComponent(path as string));
      }
      return res || null;
    },
    async getUserInfoAction() {
      // if (!this.getToken) return null;
      const res = await userInfoApi();
      this.setUserInfo(res);
      this.initPageCache(res);
      this.setSessionTimeout(false);
      return res;
    },
    initPageCache(userInfo: UserInfo) {
      this.setPageCache('authority', userInfo.authority);
      this.setPageCache('tenantId', userInfo.tenantId.id);
      this.setPageCache('customerId', userInfo.customerId.id);
    },
    /**
     * @description: logout
     */
    async logout(goLogin = false) {
      if (this.getToken) {
        try {
          await logoutApi();
        } catch {
          console.log('注销Token失败');
        }
      }
      this.setToken(undefined);
      this.setSessionTimeout(true);
      this.setUserInfo(null);
      this.setAuthority(undefined);
      goLogin && (await router.replace(PageEnum.BASE_LOGIN));
    },
    /**
     * @description: Confirm before logging out
     */
    async confirmLoginOut() {
      // const { createConfirm } = useMessage();
      // const { t } = useI18n();
      // createConfirm({
      //   iconType: 'warning',
      //   title: () => h('span', t('sys.app.logoutTip')),
      //   content: () => h('span', t('sys.app.logoutMessage')),
      //   onOk: async () => {
      await this.logout(true);
      //   },
      // });
    },
  },
});

// Global emit by think gem
export function useEmitter() {
  return useUserStore().emitter;
}

// Need to be used outside the setup
export function useUserStoreWithOut() {
  return useUserStore(store);
}
