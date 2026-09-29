import { onScopeDispose } from 'vue';
import { useRoute } from 'vue-router';

import { useBreadcrumbStore } from '@vben/stores';

/** 页面设置当前面包屑的显示名称，不影响路由标识和菜单标题。 */
export function useBreadcrumb() {
  const route = useRoute();
  const store = useBreadcrumbStore();
  const paths = new Set<string>();

  function setBreadcrumbTitle(title: string) {
    paths.add(route.path);
    store.setTitle(route.path, title);
  }

  function resetBreadcrumbTitle() {
    store.resetTitle(route.path);
    paths.delete(route.path);
  }

  onScopeDispose(() => {
    paths.forEach((path) => store.resetTitle(path));
  });

  return { resetBreadcrumbTitle, setBreadcrumbTitle };
}
