import { LAYOUT } from '/@/router/constant';
import { AppRouteModule } from '/@/router/types';
import { t } from '/@/hooks/web/useI18n';
import { Authority } from '/@/enums/authorityEnum';

const screen: AppRouteModule = {
    path: '/screen',
    name: 'Screen',
    component: LAYOUT,
    redirect: '/visual/list',
    meta: {
      orderNo: 2,
      icon: 'ant-design:fund-outlined',
      title: t('screen.screen'),
      authorities: [Authority.TENANT_ADMIN],
    },
    children:[
      {
        path: '/visual/list',
        name: 'VisualList',
        component: () => import('/@/views/screen/visual/list.vue'),
        meta: {
          orderNo: 10,
          icon: 'ant-design:fund-outlined',
          tabIcon: 'ant-design:fund-outlined',
          title: t('screen.visual'),
        },
      },
      {
        path: '/topology/list',
        name: 'TopologyList',
        component: () => import('/@/views/screen/topology/list.vue'),
        meta: {
          orderNo: 10,
          icon: 'ant-design:fund-outlined',
          tabIcon: 'ant-design:fund-outlined',
          title: t('screen.topology'),
        },
      },
      
    ]
}

export default screen;
