import type { Router } from 'vue-router';

/**
 * 详情页动态标题(面包屑 / 标签页)
 *
 * 面包屑在导航完成时从 route.matched 的 meta.title 一次性算出,meta 是非响应式的
 * 原始对象,组件里异步修改 meta.title 不会触发重算——表现为"首次不变、之后显示
 * 上一次的标题"。且路由记录是单例,直接改 meta 会在不同实体间互相串。
 *
 * 因此改为:页面标题先记入 fullPath -> title 映射(列表跳转前预置、详情页取数后
 * 回填),由 beforeResolve 守卫在每次导航确认前写入 meta.title;无映射时还原路由
 * 声明的默认标题,避免残留。
 */

/** fullPath -> 动态标题 */
const titleMap = new Map<string, string>();

/** 路由记录 -> 声明时的默认标题(首次覆盖前记录,用于还原) */
const defaultTitles = new WeakMap<object, string>();

/**
 * 预置某个地址的页面标题(在导航发生前调用,如列表页跳转详情时)
 */
function setRouteTitle(fullPath: string, title: string) {
  titleMap.set(fullPath, title);
}

/**
 * 页面取到实体后回填标题(fullPath 在组件 setup 时捕获后传入)。
 *
 * 若该页仍是当前路由、且面包屑用的还是默认标题(直接输入 URL / 刷新进入,导航
 * 时映射尚未预置),则做一次同址 force 导航让守卫重写 meta、面包屑重算;经列表
 * 跳转进入时标题已正确,不会触发多余导航。异步回填期间用户已切走时只更新映射。
 */
async function setCurrentRouteTitle(
  router: Router,
  fullPath: string,
  title: string,
) {
  setRouteTitle(fullPath, title);
  const route = router.currentRoute.value;
  if (route.fullPath !== fullPath) {
    return;
  }
  if (route.matched.at(-1)?.meta.title !== title) {
    await router.replace({
      path: route.path,
      query: route.query,
      hash: route.hash,
      force: true,
    });
  }
}

function setupDynamicTitleGuard(router: Router) {
  router.beforeResolve((to) => {
    const record = to.matched.at(-1);
    if (!record) {
      return;
    }
    const dynamicTitle = titleMap.get(to.fullPath);
    if (dynamicTitle) {
      if (!defaultTitles.has(record)) {
        defaultTitles.set(record, record.meta.title);
      }
      record.meta.title = dynamicTitle;
    } else if (defaultTitles.has(record)) {
      record.meta.title = defaultTitles.get(record) as string;
    }
  });
}

export { setCurrentRouteTitle, setRouteTitle, setupDynamicTitleGuard };
