import { LAYOUT } from '/@/router/constant';
import { AppRouteModule } from "/@/router/types";
import { t } from '/@/hooks/web/useI18n';
import { Authority } from "/@/enums/authorityEnum";


const things: AppRouteModule = {
  path: '/',
  name: 'Basic',
  component: LAYOUT,
  redirect: '/tenant/list',
  meta: {
    icon: 'ant-design:windows-outlined',
    title: t('things.deviceIn'),
    orderNo: 1,
  },
  children: [
    {
      path: '/tenant',
      name: 'Tenant',
      component: LAYOUT,
      redirect: '/tenant/list',
      meta: {
        orderNo: 10,
        icon: 'ant-design:team-outlined',
        tabIcon: 'ant-design:team-outlined',
        title: t('things.tenant'),
        single: true,
        useAuthority: [Authority.SYS_ADMIN]
      },
      children: [
        {
          path: '/tenant/list',
          name: 'TenantList',
          component: () => import('/@/views/things/tenant/list.vue'),
          meta: {
            icon: 'ant-design:team-outlined',
            tabIcon: 'ant-design:team-outlined',
            title: t('things.tenant'),
            useAuthority: [Authority.SYS_ADMIN]
          },
        },
        {
          path: '/tenant/:tenantId/users',
          name: 'TenantAdminList',
          component: () => import('/@/views/things/tenant/admin/list.vue'),
          meta: {
            icon: 'ant-design:user-outlined',
            tabIcon: 'ant-design:user-outlined',
            title: t('things.tenantAdmin'),
            useAuthority: [Authority.SYS_ADMIN]

          },
        },
      ]
    },
    {
      path: '/tenant-profile/list',
      name: 'TenantProfileList',
      component: () => import('/@/views/things/tenantProfile/list.vue'),
      meta: {
        orderNo: 20,
        icon: 'ant-design:project-outlined',
        tabIcon: 'ant-design:project-outlined',
        title: t('things.tenantProfile'),
        useAuthority: [Authority.SYS_ADMIN]
      },
    },
    {
      path: '/alarm/list',
      name: 'AlarmList',
      component: () => import('/@/views/things/alarm/list.vue'),
      meta: {
        orderNo: 30,
        icon: 'ant-design:alert-outlined',
        tabIcon: 'ant-design:alert-outlined',
        title: t('things.alarm'),
        useAuthority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
      },
    },
    {
      path: '/device/list',
      name: 'DeviceList',
      component: () => import('/@/views/things/device/list.vue'),
      meta: {
        orderNo: 40,
        icon: 'ant-design:database-outlined',
        tabIcon: 'ant-design:database-outlined',
        title: t('things.device'),
        useAuthority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
      },
    },
    {
      path: '/asset/list',
      name: 'AssetList',
      component: () => import('/@/views/things/asset/list.vue'),
      meta: {
        orderNo: 50,
        icon: 'ant-design:desktop-outlined',
        tabIcon: 'ant-design:desktop-outlined',
        title: t('things.asset'),
        useAuthority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
      },
    },
    {
      path: '/entity-view/list',
      name: 'EntityViewList',
      component: () => import('/@/views/things/entityView/list.vue'),
      meta: {
        orderNo: 60,
        icon: 'ant-design:windows-outlined',
        tabIcon: 'ant-design:windows-outlined',
        title: t('things.entityView'),
        useAuthority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
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
        title: t('things.profile'),
        useAuthority: [Authority.TENANT_ADMIN]
      },
      children: [
        {
          path: '/profile/index',
          name: 'ProfileIndex',
          component: () => import('/@/views/things/profileIndex.vue'),
          meta: {
            icon: 'ant-design:project-outlined',
            tabIcon: 'ant-design:project-outlined',
            title: t('things.profile'),
            useAuthority: [Authority.TENANT_ADMIN]
          }
        }, {
          path: '/asset-profile/list',
          name: 'AssetProfileList',
          component: () => import('/@/views/things/assetProfile/list.vue'),
          meta: {
            icon: 'ant-design:profile-outlined',
            tabIcon: 'ant-design:profile-outlined',
            title: t('things.assetProfile'),
            useAuthority: [Authority.TENANT_ADMIN]
          },
        },
        {
          path: '/device-profile/list',
          name: 'DeviceProfileList',
          component: () => import('/@/views/things/deviceProfile/list.vue'),
          meta: {
            icon: 'ant-design:right-circle-outlined',
            tabIcon: 'ant-design:right-circle-outlined',
            title: t('things.deviceProfile'),
            useAuthority: [Authority.TENANT_ADMIN]
          },
        }]
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
        title: t('things.customer'),
        single: true,
        useAuthority: [Authority.TENANT_ADMIN]
      },
      children: [
        {
          path: '/customer/list',
          name: 'CustomerList',
          component: () => import('/@/views/things/customer/list.vue'),
          meta: {
            icon: 'ant-design:team-outlined',
            tabIcon: 'ant-design:team-outlined',
            title: t('things.customer'),
            useAuthority: [Authority.TENANT_ADMIN]
          },
        },
        {
          path: '/customer/:customerId/users',
          name: 'CustomerUserList',
          component: () => import('/@/views/things/customer/user/list.vue'),
          meta: {
            icon: 'ant-design:user-outlined',
            tabIcon: 'ant-design:user-outlined',
            title: t('things.customerUser'),
            useAuthority: [Authority.TENANT_ADMIN]

          },
        },
      ]
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
        title: t('things.ruleChain'),
        single: true,
        useAuthority: [Authority.TENANT_ADMIN]
      },
      children: [
        {
          path: '/rule-chain/list',
          name: 'RuleChainList',
          component: () => import('/@/views/things/ruleChain/list.vue'),
          meta: {
            icon: 'ant-design:subnode-outlined',
            tabIcon: 'ant-design:subnode-outlined',
            title: t('things.ruleChain'),
            useAuthority: [Authority.TENANT_ADMIN]
          },
        },
        {
          path: '/rule-chain/:ruleChainId',
          name: 'RuleChainDetail',
          component: () => import('/@/views/things/ruleChain/flow/index.vue'),
          meta: {
            single: true,
            icon: 'ant-design:subnode-outlined',
            tabIcon: 'ant-design:subnode-outlined',
            title: t('things.ruleChainDetail'),
            useAuthority: [Authority.TENANT_ADMIN]
          },
        },
      ]
    },
    {
      path: '/otaPackage/list',
      name: 'OtaPackage',
      component: () => import('/@/views/things/otaPackage/list.vue'),
      meta: {
        orderNo: 130,
        icon: 'ant-design:paper-clip-outlined',
        tabIcon: 'ant-design:paper-clip-outlined',
        title: t('things.ota'),
        useAuthority: [Authority.TENANT_ADMIN]
      },
    },
    {
      path: 'resources',
      name: 'Resource',
      component: LAYOUT,
      meta: {
        orderNo: 140,
        single: true,
        icon: 'ant-design:gold-outlined',
        tabIcon: 'ant-design:gold-outlined',
        title: t('things.resource'),
        useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
      },
      children: [
        {
          path: '/resource/index',
          name: 'ResourceIndex',
          component: () => import('/@/views/things/resourceIndex.vue'),
          meta: {
            icon: 'ant-design:gold-outlined',
            tabIcon: 'ant-design:gold-outlined',
            title: t('things.resource'),
            useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
          }
        }, {
          path: '/widgets-bundle/list',
          name: 'widgetsBundleList',
          component: () => import('/@/views/things/widgetsBundle/list.vue'),
          meta: {
            icon: 'ant-design:right-circle-outlined',
            tabIcon: 'ant-design:right-circle-outlined',
            title: t('things.widgetsBundle'),
            useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
          },
        },
        {
          path: '/resource-library/list',
          name: 'ResourceLibraryList',
          component: () => import('/@/views/things/resourceLibrary/list.vue'),
          meta: {
            icon: 'ant-design:right-circle-outlined',
            tabIcon: 'ant-design:right-circle-outlined',
            title: t('things.resourceLibrary'),
            useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
          },
        }]
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
        title: t('things.notification_center'),
        useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
      },
      children: [{
        path: '/notification/index',
        name: 'NotificationIndex',
        component: () => import('/@/views/things/notification/index.vue'),
        meta: {
          orderNo: 10,
          icon: 'ant-design:comment-outlined',
          title: t('things.notification_center'),
          useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
        }
      }, {
        path: '/notification/list',
        name: 'NotificationList',
        component: () => import('/@/views/things/notification/list.vue'),
        meta: {
          orderNo: 20,
          icon: 'ant-design:bell-outlined',
          title: t('things.notification_list'),
          useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]
        }

      }, {
        path: '/notification/request/list',
        name: 'NotificationRequestList',
        component: () => import('/@/views/things/notification/request/list.vue'),
        meta: {
          orderNo: 30,
          icon: 'ant-design:bars-outlined',
          title: t('things.notification_request_list'),
          useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
        }

      }, {
        path: '/notification/recipient/list',
        name: 'NotificationRecipientList',
        component: () => import('/@/views/things/notification/recipient/list.vue'),
        meta: {
          orderNo: 40,
          icon: 'ant-design:team-outlined',
          title: t('things.notification_recipient_list'),
          useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
        }

      }, {
        path: '/notification/template/list',
        name: 'NotificationTemplateList',
        component: () => import('/@/views/things/notification/template/list.vue'),
        meta: {
          orderNo: 50,
          icon: 'ant-design:solution-outlined',
          title: t('things.notification_template_list'),
          useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
        }

      }, {
        path: '/notification/rule/list',
        name: 'NotificationRuleList',
        component: () => import('/@/views/things/notification/rule/list.vue'),
        meta: {
          orderNo: 60,
          icon: 'ant-design:ungroup-outlined',
          title: t('things.notification_rule_list'),
          useAuthority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
        }

      }]
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
        title: t('things.adminSetting'),
        useAuthority: [Authority.SYS_ADMIN]
      },
      children: [
        {
          path: '/admin-setting/index',
          name: 'AdminSettingIndex',
          component: () => import('/@/views/things/setting/index.vue'),
          meta: {
            icon: 'ant-design:setting-outlined',
            tabIcon: 'ant-design:setting-outlined',
            title: t('things.adminSetting'),
            useAuthority: [Authority.SYS_ADMIN]
          }
        },]
    },
    {
      path: '/audit-log',
      name: 'AuditLog',
      component: () => import('/@/views/things/auditLog/list.vue'),
      meta: {
        orderNo: 200,
        icon: 'ant-design:bars-outlined',
        tabIcon: 'ant-design:bars-outlined',
        title: t('things.auditLog'),
        useAuthority: [Authority.TENANT_ADMIN]
      },
    },

  ]
}

export default things;
