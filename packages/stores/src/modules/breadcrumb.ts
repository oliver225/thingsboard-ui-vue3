import { acceptHMRUpdate, defineStore } from 'pinia';

export const useBreadcrumbStore = defineStore('core-breadcrumb', {
  state: () => ({
    titles: new Map<string, string>(),
  }),
  actions: {
    setTitle(path: string, title: string) {
      this.titles.set(path, title);
    },
    resetTitle(path: string) {
      this.titles.delete(path);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBreadcrumbStore, import.meta.hot));
}
