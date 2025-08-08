import { LAYOUT, IFRAME_BLANK } from '/@/router/constant';
import { AppRouteModule } from '/@/router/types';
import { t } from '/@/hooks/web/useI18n';
import { Authority } from '/@/enums/authorityEnum';
import { usePermission } from '/@/hooks/web/usePermission';

const tb: AppRouteModule = {
  path: '/tb',
  name: 'Thingdboard',
  component: LAYOUT,
  redirect: () => {
    const { hasPermission } = usePermission();
    return {
      path: hasPermission(Authority.SYS_ADMIN) ? '/tenant/list' : '/device/list',
    };
  },
  meta: {
    icon: 'ant-design:windows-outlined',
    title: t('tb.deviceIn'),
    orderNo: 1,
  },
  children: [
    {
      path: '/home',
      name: 'TbHome',
      component: IFRAME_BLANK,
      meta: {
        icon: 'ant-design:home-outlined',
        tabIcon: 'ant-design:home-outlined',
        title: t('tb.home'),
        frameSrc: 'http://localhost:8080/home',
      },
      props: {
        offsetX: -254,
        offsetY: -70,
      },
    },
    {
      path: '/tenant',
      name: 'Tenant',
      component: LAYOUT,
      redirect: '/tenant/list',
      meta: {
        orderNo: 10,
        icon: 'ant-design:team-outlined',
        tabIcon: 'ant-design:team-outlined',
        title: t('tb.tenant'),
        single: true,
        authority: [Authority.SYS_ADMIN],
      },
      children: [
        {
          path: '/tenant/list',
          name: 'TenantList',
          component: () => import('/@/views/tb/tenant/list.vue'),
          meta: {
            icon: 'ant-design:team-outlined',
            tabIcon: 'ant-design:team-outlined',
            title: t('tb.tenant'),
            authority: [Authority.SYS_ADMIN],
          },
        },
        {
          path: '/tenant/:tenantId/users',
          name: 'TenantAdminList',
          component: () => import('/@/views/tb/tenant/admin/list.vue'),
          meta: {
            icon: 'ant-design:user-outlined',
            tabIcon: 'ant-design:user-outlined',
            title: t('tb.tenantAdmin'),
            authority: [Authority.SYS_ADMIN],
          },
        },
      ],
    },
    {
      path: '/tenant-profile/list',
      name: 'TenantProfileList',
      component: () => import('/@/views/tb/tenantProfile/list.vue'),
      meta: {
        orderNo: 20,
        icon: 'ant-design:project-outlined',
        tabIcon: 'ant-design:project-outlined',
        title: t('tb.tenantProfile'),
        authority: [Authority.SYS_ADMIN],
      },
    },
    {
      path: '/alarm/list',
      name: 'AlarmList',
      component: () => import('/@/views/tb/alarm/list.vue'),
      meta: {
        orderNo: 30,
        icon: 'ant-design:alert-outlined',
        tabIcon: 'ant-design:alert-outlined',
        title: t('tb.alarm'),
        authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      },
    },
    {
      path: '/device',
      name: 'Device',
      component: LAYOUT,
      redirect: '/device/list',
      meta: {
        orderNo: 40,
        icon: 'ant-design:database-outlined',
        tabIcon: 'ant-design:team-outlined',
        title: t('设备管理'),
        single: false,
        authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      },
      children: [
        {
          path: '/device/list',
          name: 'DeviceList',
          component: () => import('/@/views/tb/device/list.vue'),
          meta: {
            orderNo: 10,
            icon: 'ant-design:database-outlined',
            tabIcon: 'ant-design:database-outlined',
            title: t('tb.device'),
            authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          },
        },
        {
          path: '/product/list',
          name: 'ProductList',
          component: () => import('/@/views/tb/product/list.vue'),
          meta: {
            icon: 'ant-design:project-outlined',
            tabIcon: 'ant-design:project-outlined',
            title: t('产品'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
      ],
    },

    {
      path: '/asset/list',
      name: 'AssetList',
      component: () => import('/@/views/tb/asset/list.vue'),
      meta: {
        orderNo: 50,
        icon: 'ant-design:desktop-outlined',
        tabIcon: 'ant-design:desktop-outlined',
        title: t('tb.asset'),
        authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      },
    },
    {
      path: '/entity-view/list',
      name: 'EntityViewList',
      component: () => import('/@/views/tb/entityView/list.vue'),
      meta: {
        orderNo: 60,
        icon: 'ant-design:windows-outlined',
        tabIcon: 'ant-design:windows-outlined',
        title: t('tb.entityView'),
        authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      },
    },
    {
      path: 'profile',
      name: 'Profile',
      component: LAYOUT,
      redirect: '/profile/index',
      meta: {
        orderNo: 90,
        single: true,
        icon: 'ant-design:project-outlined',
        tabIcon: 'ant-design:project-outlined',
        title: t('tb.profile'),
        authority: [Authority.TENANT_ADMIN],
      },
      children: [
        {
          path: '/profile/index',
          name: 'ProfileIndex',
          component: () => import('/@/views/tb/profile/index.vue'),
          meta: {
            icon: 'ant-design:project-outlined',
            tabIcon: 'ant-design:project-outlined',
            title: t('tb.profile'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/asset-profile/list',
          name: 'AssetProfileList',
          component: () => import('/@/views/tb/assetProfile/list.vue'),
          meta: {
            icon: 'ant-design:profile-outlined',
            tabIcon: 'ant-design:profile-outlined',
            title: t('tb.assetProfile'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/device-profile/list',
          name: 'DeviceProfileList',
          component: () => import('/@/views/tb/deviceProfile/list.vue'),
          meta: {
            icon: 'ant-design:right-circle-outlined',
            tabIcon: 'ant-design:right-circle-outlined',
            title: t('tb.deviceProfile'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
      ],
    },
    {
      path: '/customer',
      name: 'Customer',
      component: LAYOUT,
      redirect: '/customer/list',
      meta: {
        orderNo: 100,
        icon: 'ant-design:team-outlined',
        tabIcon: 'ant-design:team-outlined',
        title: t('tb.customer'),
        single: true,
        authority: [Authority.TENANT_ADMIN],
      },
      children: [
        {
          path: '/customer/list',
          name: 'CustomerList',
          component: () => import('/@/views/tb/customer/list.vue'),
          meta: {
            icon: 'ant-design:team-outlined',
            tabIcon: 'ant-design:team-outlined',
            title: t('tb.customer'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/customer/:customerId/users',
          name: 'CustomerUserList',
          component: () => import('/@/views/tb/customer/user/list.vue'),
          meta: {
            icon: 'ant-design:user-outlined',
            tabIcon: 'ant-design:user-outlined',
            title: t('tb.customerUser'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
      ],
    },
    {
      path: '/rule-chain',
      name: 'RuleChain',
      component: LAYOUT,
      redirect: '/rule-chain/list',
      meta: {
        orderNo: 120,
        icon: 'ant-design:subnode-outlined',
        tabIcon: 'ant-design:subnode-outlined',
        title: t('tb.ruleChain'),
        single: true,
        authority: [Authority.TENANT_ADMIN],
      },
      children: [
        {
          path: '/rule-chain/list',
          name: 'RuleChainList',
          component: () => import('/@/views/tb/ruleChain/list.vue'),
          meta: {
            icon: 'ant-design:subnode-outlined',
            tabIcon: 'ant-design:subnode-outlined',
            title: t('tb.ruleChain'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/rule-chain/:ruleChainId',
          name: 'RuleChainDetail',
          component: () => import('/@/views/tb/ruleChain/flow/index.vue'),
          meta: {
            single: true,
            icon: 'ant-design:subnode-outlined',
            tabIcon: 'ant-design:subnode-outlined',
            title: t('tb.ruleChainDetail'),
            authority: [Authority.TENANT_ADMIN],
          },
        },
      ],
    },
    {
      path: '/otaPackage/list',
      name: 'OtaPackage',
      component: () => import('/@/views/tb/otaPackage/list.vue'),
      meta: {
        orderNo: 130,
        icon: 'ant-design:paper-clip-outlined',
        tabIcon: 'ant-design:paper-clip-outlined',
        title: t('tb.ota'),
        authority: [Authority.TENANT_ADMIN],
      },
    },
    {
      path: 'resources',
      name: 'Resource',
      component: LAYOUT,
      meta: {
        orderNo: 140,
        single: false,
        icon: 'ant-design:gold-outlined',
        tabIcon: 'ant-design:gold-outlined',
        title: t('tb.resource'),
        authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      },
      children: [
        {
          path: '/widgets-bundle/list',
          name: 'widgetsBundleList',
          component: () => import('/@/views/tb/widgetsBundle/list.vue'),
          meta: {
            icon: 'i-ant-design:appstore-filled',
            tabIcon: 'i-ant-design:appstore-filled',
            title: t('tb.widgetsBundle'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/widget-type/list',
          name: 'widgetTypeList',
          component: () => import('/@/views/tb/widgetType/list.vue'),
          meta: {
            icon: 'i-ant-design:appstore-add-outlined',
            tabIcon: 'i-ant-design:appstore-add-outlined',
            title: t('tb.widgetType'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/image/list',
          name: 'imageList',
          component: () => import('/@/views/tb/images/list.vue'),
          meta: {
            icon: 'i-ant-design:file-image-outlined',
            tabIcon: 'i-ant-design:file-image-outlined',
            title: t('tb.images'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/scada-symbol/list',
          name: 'scadaSymbolList',
          component: () => import('/@/views/tb/scadaSymbol/list.vue'),
          meta: {
            icon: 'i-ant-design:codepen-outlined',
            tabIcon: 'i-ant-design:codepen-outlined',
            title: t('tb.scadaSymbols'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/scada-symbol/:type/:key',
          name: 'scadaSymbolDetail',
          component: () => import('/@/views/tb/scadaSymbol/detail.vue'),
          meta: {
            hideMenu: true,
            icon: 'i-ant-design:codepen-outlined',
            tabIcon: 'i-ant-design:codepen-outlined',
            title: t('tb.scadaSymbols'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/resource-library/list',
          name: 'ResourceLibraryList',
          component: () => import('/@/views/tb/resourceLibrary/list.vue'),
          meta: {
            icon: 'i-ant-design:build-outlined',
            tabIcon: 'i-ant-design:build-outlined',
            title: t('tb.resourceLibrary'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
      ],
    },
    {
      path: '/notification',
      name: 'Notification',
      component: LAYOUT,
      redirect: '/notification/index',
      meta: {
        orderNo: 160,
        single: true,
        icon: 'ant-design:comment-outlined',
        title: t('tb.notification_center'),
        authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      },
      children: [
        {
          path: '/notification/index',
          name: 'NotificationIndex',
          component: () => import('/@/views/tb/notification/index.vue'),
          meta: {
            orderNo: 10,
            icon: 'ant-design:comment-outlined',
            title: t('tb.notification_center'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          },
        },
        {
          path: '/notification/list',
          name: 'NotificationList',
          component: () => import('/@/views/tb/notification/list.vue'),
          meta: {
            orderNo: 20,
            icon: 'ant-design:bell-outlined',
            title: t('tb.notification_list'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          },
        },
        {
          path: '/notification/request/list',
          name: 'NotificationRequestList',
          component: () => import('/@/views/tb/notification/request/list.vue'),
          meta: {
            orderNo: 30,
            icon: 'ant-design:bars-outlined',
            title: t('tb.notification_request_list'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/notification/recipient/list',
          name: 'NotificationRecipientList',
          component: () => import('/@/views/tb/notification/recipient/list.vue'),
          meta: {
            orderNo: 40,
            icon: 'ant-design:team-outlined',
            title: t('tb.notification_recipient_list'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/notification/template/list',
          name: 'NotificationTemplateList',
          component: () => import('/@/views/tb/notification/template/list.vue'),
          meta: {
            orderNo: 50,
            icon: 'ant-design:solution-outlined',
            title: t('tb.notification_template_list'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
        {
          path: '/notification/rule/list',
          name: 'NotificationRuleList',
          component: () => import('/@/views/tb/notification/rule/list.vue'),
          meta: {
            orderNo: 60,
            icon: 'ant-design:ungroup-outlined',
            title: t('tb.notification_rule_list'),
            authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          },
        },
      ],
    },
    {
      path: 'admin-setting',
      name: 'AdminSetting',
      component: LAYOUT,
      meta: {
        orderNo: 170,
        single: true,
        icon: 'ant-design:setting-outlined',
        tabIcon: 'ant-design:setting-outlined',
        title: t('tb.adminSetting'),
        authority: [Authority.SYS_ADMIN],
      },
      children: [
        {
          path: '/admin-setting/index',
          name: 'AdminSettingIndex',
          component: () => import('/@/views/tb/setting/index.vue'),
          meta: {
            icon: 'ant-design:setting-outlined',
            tabIcon: 'ant-design:setting-outlined',
            title: t('tb.adminSetting'),
            authority: [Authority.SYS_ADMIN],
          },
        },
      ],
    },
    {
      path: '/audit-log',
      name: 'AuditLog',
      component: () => import('/@/views/tb/auditLog/list.vue'),
      meta: {
        orderNo: 200,
        icon: 'ant-design:bars-outlined',
        tabIcon: 'ant-design:bars-outlined',
        title: t('tb.auditLog'),
        authority: [Authority.TENANT_ADMIN],
      },
    },
  ],
};

export default tb;
