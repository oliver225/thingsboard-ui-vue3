import type { SystemParams } from '#/api/tb/system-info';

import { ref } from 'vue';

import { defineStore } from 'pinia';

import { getSystemParams } from '#/api/tb/system-info';

export const useSystemStore = defineStore('system', () => {
  const systemParams = ref<SystemParams>();
  const loaded = ref(false);
  let pending: Promise<void> | undefined;
  let session = 0;

  function loadSystemParams(): Promise<void> {
    if (loaded.value) return Promise.resolve();
    if (pending) return pending;

    const current = session;
    pending = getSystemParams()
      .then((params) => {
        if (current === session) systemParams.value = params;
      })
      .catch(() => {
        // 与 ui-ngx 一致：系统参数不可用时仍允许完成认证。
      })
      .finally(() => {
        if (current === session) {
          loaded.value = true;
          pending = undefined;
        }
      });
    return pending;
  }

  function $reset() {
    ++session;
    systemParams.value = undefined;
    loaded.value = false;
    pending = undefined;
  }

  return { $reset, loaded, loadSystemParams, systemParams };
});
