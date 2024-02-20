/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author ThinkGem
 */
import { defHttp } from '/@/utils/http/axios';
import { JwtPair, UserInfo } from '/#/store';
import { ErrorMessageMode } from '/#/axios';
// import { encryptByBase64 } from '/@/utils/cipher';
import { Menu } from '/@/router/types';


export interface LoginParams {
  username: string;
  password: string;
  validCode?: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  result: string;
  message: string;
  token: JwtPair;
  // sessionid: string;
  user: UserInfo;
  // demoMode: boolean;
  // useCorpModel: boolean;
  // currentCorpCode: string;
  // currentCorpName: string;
  // modifyPasswordTip: string;
  // modifyPasswordMsg: string;
  // sysCode: string;
  isValidCodeLogin: boolean;
}

export interface AuthInfo {
  stringPermissions: string[];
  roles: string[];
}

export const loginApi = (params: LoginParams, mode: ErrorMessageMode = 'none') => {
  // params.username = encryptByBase64(params.username);
  // params.password = encryptByBase64(params.password);
  // if (params.validCode) {
  //   params.validCode = encryptByBase64(params.validCode);
  // }
  // return defHttp.post<LoginResult>(
  //   { url: adminPath + '/login', params, timeout: 20 * 1000 },
  //   { errorMessageMode: mode },
  // );
  return defHttp.postJson<JwtPair>(
    {
      url: '/api/auth/login',
      data: params,
      timeout: 20 * 1000
    }, { errorMessageMode: mode },
  );
};

export const userInfoApi = (mode: ErrorMessageMode = 'message') =>
  defHttp.get<UserInfo>(
    { url: '/api/auth/user', timeout: 10 * 1000 },
    { errorMessageMode: mode },
  );

export function refreshTokenApi(refreshToken: string, mode: ErrorMessageMode = 'none') {
  return defHttp.postJson<JwtPair>(
    {
      url: '/api/auth/token',
      data: { refreshToken: refreshToken },
      timeout: 20 * 1000
    }, { errorMessageMode: mode },
  );
}

// export const switchSys = (sysCode: string) => {
//   return defHttp.get({ url: adminPath + '/switch/' + sysCode });
// };

// export const switchRole = (roleCode: string) => {
//   return defHttp.get({ url: adminPath + '/switchRole/' + roleCode });
// };

// export const switchSkin = (name = '') => {
//   if (name == '') {
//     const appStore = useAppStore();
//     if (appStore.getDarkMode === 'dark') {
//       name = 'skin-dark';
//     } else {
//       const themeColor = appStore.getProjectConfig.themeColor;
//       name = themeColor == '#1890ff' ? 'skin-blue-light3' : 'skin-blue3';
//     }
//   }
//   return defHttp.get({ url: adminPath + '/switchSkin/' + name });
// };



// export const authInfoApi = () => defHttp.get<AuthInfo>({ url: adminPath + '/authInfo' });

export const menuRouteApi = () => defHttp.get<Menu[]>({ url: '/menuRoute' });

export const logoutApi = () => defHttp.post({ url: '/api/auth/logout' });
