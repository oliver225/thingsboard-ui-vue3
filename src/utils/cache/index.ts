import { getStorageShortName } from '/@/utils/env';
import { createStorage as create, CreateStorageParams } from './storageCache';
import { enableStorageEncryption } from '/@/settings/encryptionSetting';
import { DEFAULT_CACHE_TIME } from '/@/settings/encryptionSetting';

export type Options = Partial<CreateStorageParams>;

const createOptions = (storage: Storage, options: Options = {}): Options => {
  return {
    // No encryption in debug mode
    hasEncrypt: enableStorageEncryption,
    storage,
    prefixKey: getStorageShortName(),
    ...options,
  };
};

export const WebStorage = create(createOptions(sessionStorage));

export const createStorage = (storage: Storage = sessionStorage, options: Options = {}) => {
  return create(createOptions(storage, options));
};

export const createSessionStorage = (options: Options = {}) => {
  return createStorage(sessionStorage, { ...options, timeout: DEFAULT_CACHE_TIME });
};

export const createLocalStorage = (options: Options = {}) => {
  return createStorage(localStorage, { ...options, timeout: DEFAULT_CACHE_TIME });
};


export const setLocalStorage = <T>(k: string, v: T) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v))
  } catch (error) {
    return false
  }
}

export const getLocalStorage: (k: string) => any = (k: string) => {
  const item = window.localStorage.getItem(k)
  try {
    return item ? JSON.parse(item) : item
  } catch (err) {
    return item
  }
}

export const clearLocalStorage = (name: string) => {
  window.localStorage.removeItem(name)
}


export default WebStorage;
