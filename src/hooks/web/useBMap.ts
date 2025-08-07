import { onMounted, onUnmounted, ref } from 'vue';

export function useBMap(ak: string) {
  const error = ref(false);
  const success = ref(false);
  const bmapGL = ref<any>();
  let script: HTMLScriptElement;

  const promise = new Promise((resolve, reject) => {
    onMounted(() => {
      script = document.createElement('script');
      script.type = 'text/javascript';

      window.onBmapCallback = function () {
        bmapGL.value = BMapGL;
        success.value = true;
        resolve(BMapGL);
      };

      script.onerror = function (err) {
        success.value = false;
        error.value = true;
        reject(err);
      };

      script.src = `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=${ak}&callback=onBmapCallback`;
      document.head.appendChild(script);
    });
  });

  onUnmounted(() => {
    script && script.remove();
  });

  return {
    error,
    success,
    BMapGL: bmapGL,
    toPromise: () => promise,
  };
}
