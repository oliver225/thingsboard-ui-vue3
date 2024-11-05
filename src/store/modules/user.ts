/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author Vben、ThinkGem
 */
import type { JwtPair, UserInfo } from '/#/store';
import type { ErrorMessageMode } from '/#/axios';
import { defineStore } from 'pinia';
import { store } from '/@/store';
import { RoleEnum } from '/@/enums/roleEnum';
import { PageEnum } from '/@/enums/pageEnum';
import { TOKEN_KEY, REFRESHTOKEN_KEY, ROLES_KEY, USER_INFO_KEY, SESSION_TIMEOUT_KEY } from '/@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '/@/utils/auth';
import { loginApi, logoutApi, userInfoApi, LoginParams, LoginResult } from '/@/api/tb/login';
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
  authority?: Nullable<Authority>;
  // roleList: RoleEnum[] | string[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
  pageCache: any;
  emitter: Emitter<any>;
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    token: undefined,
    // token
    refreshToken: undefined,
    // authority
    authority: null,
    // roleList
    // roleList: [],
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
      return this.refreshToken || getAuthCache<string>(REFRESHTOKEN_KEY);
    },
    getAuthority(): Nullable<Authority> {
      const userInfo = this.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
      return this.authority ? this.authority : userInfo?.authority;
    },
    // getRoleList(): RoleEnum[] | string[] {
    //   return this.roleList.length > 0
    //     ? this.roleList
    //     : getAuthCache<RoleEnum[] | string[]>(ROLES_KEY);
    // },
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
    setToken(jwtPair: JwtPair | undefined | null) {
      this.token = jwtPair ? jwtPair.token : ''; // for null or undefined value
      this.refreshToken = jwtPair ? jwtPair.refreshToken : '';
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(TOKEN_KEY, jwtPair ? jwtPair.token : '');
      setAuthCache(REFRESHTOKEN_KEY, jwtPair ? jwtPair.refreshToken : '');
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
      setAuthCache(SESSION_TIMEOUT_KEY, flag);
    },

    setAuthority(authority: Authority | null) {
      this.authority = authority;
    },
    setUserInfo(info: UserInfo | null) {
      if (info) {
        const { ctxPath } = useGlobSetting();
        let url = info.additionalInfo?.avatarUrl || '/ctxPath/static/images/user1.jpg';
        url = url.replace('/ctxPath/', ctxPath + '/');
        info.additionalInfo.avatarUrl = url || logoImg;
        // info.additionalInfo.homePath = res.desktopUrl;
      }
      this.userInfo = info;
      this.authority = info?.authority || null;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    // setRoleList(roleList: RoleEnum[] | string[]) {
    //   this.roleList = roleList;
    //   setAuthCache(ROLES_KEY, roleList);
    // },
    resetState() {
      this.userInfo = null;
      this.token = '';
      // this.roleList = [];
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
      if (jwtPair) {
        this.setToken(jwtPair);
        const userInfo = await this.getUserInfoAction();
        this.initPageCache(userInfo);
        return userInfo;
      }
      // await this.afterLoginAction(userInfo, goHome);
      // return res;
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
      // if (res['modifyPasswordTip']) {
      //   createConfirm({
      //     content: res['modifyPasswordTip'],
      //     maskClosable: false,
      //     iconType: 'info',
      //     cancelText: '取消',
      //     okText: '确定',
      //     onOk: () => {
      //       router.replace('/account/modPwd');
      //     },
      //   });
      // }
      return res || null;
    },
    async getUserInfoAction() {
      // if (!this.getToken) return null;
      const res = await userInfoApi();
      this.setUserInfo(res);
      this.initPageCache(res);
      // this.setRoleList(roleList);
      this.setSessionTimeout(false);
      return res;
    },
    initPageCache(res: UserInfo) {
      // this.setPageCache('demoMode', res.demoMode);
      // this.setPageCache('useCorpModel', res.useCorpModel);
      // this.setPageCache('modifyPasswordTip', res.modifyPasswordTip);
      // this.setPageCache('modifyPasswordMsg', res.modifyPasswordMsg);
      // this.setPageCache('sysCode', res.sysCode);
      // this.setPageCache('roleCode', res.roleCode);
      // this.setPageCache('title', res.title);
      // this.setPageCache('company', res.company);
      // this.setPageCache('version', res.version);
      // this.setPageCache('year', res.year);
      this.setPageCache('authority', res.authority);
      this.setPageCache('tenantId', res.tenantId.id);
      this.setPageCache('customerId', res.customerId.id);
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
      // this.setRoleList([]);
      goLogin && router.push(PageEnum.BASE_LOGIN);
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
