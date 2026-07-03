import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

const BasicLayout = () => import('#/layouts/basic.vue');
const AuthPageLayout = () => import('#/layouts/auth.vue');
/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  /**
   * 根路由
   * 使用基础布局，作为所有页面的父级容器，子级就不必配置BasicLayout。
   * 此路由必须存在，且不应修改
   */
  {
    component: BasicLayout,
    meta: {
      hideInBreadcrumb: true,
      title: 'Root',
    },
    name: 'Root',
    path: '/',
    redirect: preferences.app.defaultHomePath,
    children: [],
  },
  {
    component: AuthPageLayout,
    meta: {
      hideInTab: true,
      title: 'Authentication',
    },
    name: 'Authentication',
    path: '/auth',
    redirect: LOGIN_PATH,
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('#/views/_core/authentication/login.vue'),
        meta: {
          title: $t('page.auth.login'),
        },
      },
      {
        name: 'CodeLogin',
        path: 'code-login',
        component: () => import('#/views/_core/authentication/code-login.vue'),
        meta: {
          title: $t('page.auth.codeLogin'),
        },
      },
      {
        name: 'QrCodeLogin',
        path: 'qrcode-login',
        component: () =>
          import('#/views/_core/authentication/qrcode-login.vue'),
        meta: {
          title: $t('page.auth.qrcodeLogin'),
        },
      },
      {
        name: 'ForgetPassword',
        path: 'forget-password',
        component: () =>
          import('#/views/_core/authentication/forget-password.vue'),
        meta: {
          title: $t('page.auth.forgetPassword'),
        },
      },
      {
        name: 'Register',
        path: 'register',
        component: () => import('#/views/_core/authentication/register.vue'),
        meta: {
          title: $t('page.auth.register'),
        },
      },
      {
        name: 'CreatePassword',
        path: 'create-password',
        component: () =>
          import('#/views/_core/authentication/create-password.vue'),
        meta: {
          ignoreAccess: true,
          title: $t('tb.auth.createPassword'),
        },
      },
      {
        name: 'ResetPassword',
        path: 'reset-password',
        component: () =>
          import('#/views/_core/authentication/reset-password.vue'),
        meta: {
          ignoreAccess: true,
          title: $t('tb.auth.resetPassword'),
        },
      },
    ],
  },
  /**
   * 兼容 ThingsBoard 激活/重置邮件链接经后端校验后的 302/303 跳转目标:
   *   /noauth/activate?activateToken=xxx
   *   /login/resetPassword?resetToken=xxx
   * 重定向到鉴权布局下对应页面并保留 query。
   * 注意:跳转目标是 /login/**,不是 /api(或 /noauth)—— /api 会被 dev 代理
   * 与生产 nginx 转发到 TB 后端,前端路由收不到。
   */
  {
    name: 'CreatePasswordCompat',
    path: '/noauth/activate',
    redirect: (to) => ({ name: 'CreatePassword', query: to.query }),
  },
  {
    name: 'ResetPasswordCompat',
    path: '/noauth/resetPassword',
    redirect: (to) => ({ name: 'ResetPassword', query: to.query }),
  },
];

export { coreRoutes, fallbackNotFoundRoute };
