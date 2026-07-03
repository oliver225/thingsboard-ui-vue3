import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    // 前端静态路由 + meta.authority(TB Authority)过滤
    accessMode: 'frontend',
    // 登录后默认首页(P1 暂指向设备列表,P4 做 desktop 后再调整)
    defaultHomePath: '/analytics',
    // TB 支持 JWT refreshToken(POST /api/auth/token)
    enableRefreshToken: true,
    name: import.meta.env.VITE_APP_TITLE,
    // 默认头像
    defaultAvatar: '/logo.png',
  },
  // 系统 Logo(public/logo.png)
  logo: {
    source: '/logo.png',
  },
  copyright: {
    companyName: 'oliver225',
    enable: false,
  },
});
