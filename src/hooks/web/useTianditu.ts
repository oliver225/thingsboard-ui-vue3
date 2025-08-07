import { onMounted, onUnmounted, ref } from 'vue';
import { defHttp } from '/@/utils/http/axios';

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
  const tianditu = ref<any>();
  let script: HTMLScriptElement;

  const promise = new Promise((resolve, reject) => {
    onMounted(() => {
      script = document.createElement('script');
      script.type = 'text/javascript';

      script.onerror = function (err) {
        success.value = false;
        error.value = true;
        reject(err);
      };
      script.onload = function () {
        tianditu.value = T;
        success.value = true;
        resolve(T);
      };

      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${tk}`;
      document.head.appendChild(script);
    });
  });

  onUnmounted(() => {
    script && script.remove();
  });

  async function geocoder<TiandituLocation>(keyWord: string) {
    const result = await defHttp.get(
      {
        url: 'https://api.tianditu.gov.cn/geocoder',
        params: {
          ds: '{"keyWord":"' + keyWord + '"}',
          tk: tk,
        },
      },
      { withToken: false },
    );
    if (result.msg === 'ok') {
      return result.location as TiandituLocation;
    }
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
