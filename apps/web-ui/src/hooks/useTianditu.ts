import type { Tianditu } from '#/types/tianditu';

import { onMounted, onUnmounted, ref, shallowRef } from 'vue';

import { baseRequestClient } from '#/api/request';

export interface TiandituLocation {
  keyWord: string;
  lat: number;
  lon: number;
  level: string;
  score: number;
}

export function useTianditu(tk: string) {
  const error = ref(false);
  const success = ref(false);
  const tianditu = shallowRef<Tianditu>();
  let script: HTMLScriptElement | undefined;

  const promise = new Promise<Tianditu>((resolve, reject) => {
    onMounted(() => {
      script = document.createElement('script');
      script.type = 'text/javascript';

      script.addEventListener('error', (err) => {
        success.value = false;
        error.value = true;
        reject(err);
      });
      script.addEventListener('load', () => {
        tianditu.value = window.T;
        success.value = true;
        resolve(window.T);
      });

      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${tk}`;
      document.head.append(script);
    });
  });

  onUnmounted(() => {
    script?.remove();
  });

  async function geocoder(keyWord: string) {
    // baseRequestClient 不携带 ThingsBoard 登录令牌，对应旧版 withToken: false。
    const result = await baseRequestClient.get<{
      msg: string;
      location: TiandituLocation;
    }>('https://api.tianditu.gov.cn/geocoder', {
      params: { ds: JSON.stringify({ keyWord }), tk },
    });
    if (result.msg === 'ok') return result.location;
    return null;
  }

  return {
    error,
    success,
    geocoder,
    T: tianditu,
    toPromise: () => promise,
  };
}
