import { Persistent, BasicKeys } from '/@/utils/cache/persistent';
import { CacheTypeEnum, THINGSBOARD_SHARE_TOKEN } from '/@/enums/cacheEnum';
import projectSetting from '/@/settings/projectSetting';
import { TOKEN_KEY, REFRESHTOKEN_KEY } from '/@/enums/cacheEnum';
import { JwtPair } from '/#/store';
import { setLocalStorage } from '../cache';

const { permissionCacheType } = projectSetting;
const isLocal = permissionCacheType === CacheTypeEnum.LOCAL;

export function getToken() {
  return getAuthCache<string>(TOKEN_KEY);
}

export function getRefreshToken() {
  return getAuthCache<string>(REFRESHTOKEN_KEY);
}

export function setJwtPairToken(jwtPair: JwtPair | null | undefined) {
  setAuthCache(TOKEN_KEY, jwtPair ? jwtPair.token : '');
  setAuthCache(REFRESHTOKEN_KEY, jwtPair ? jwtPair.refreshToken : '');
  setLocalStorage(THINGSBOARD_SHARE_TOKEN, jwtPair);
}

export function getAuthCache<T>(key: BasicKeys) {
  const fn = isLocal ? Persistent.getLocal : Persistent.getSession;
  return fn(key) as T;
}

export function setAuthCache(key: BasicKeys, value) {
  const fn = isLocal ? Persistent.setLocal : Persistent.setSession;
  return fn(key, value, true);
}

export function clearAuthCache(immediate = true) {
  const fn = isLocal ? Persistent.clearLocal : Persistent.clearSession;
  return fn(immediate);
}
