import { ref } from 'vue';

import { defineStore } from 'pinia';

import { getSetupState } from '#/api/tb/noauth';

export const useSetupStore = defineStore('setup', () => {
  const status = ref<string>();
  let pending: Promise<void> | undefined;

  async function load(force = false) {
    if (!force && status.value) return status.value;
    pending ??= getSetupState()
      .then((info) => {
        status.value = info.status || 'UNKNOWN';
      })
      .catch(() => {
        status.value = undefined;
      })
      .finally(() => {
        pending = undefined;
      });
    await pending;
    return status.value;
  }

  function $reset() {
    status.value = undefined;
  }

  return { $reset, load, status };
});
