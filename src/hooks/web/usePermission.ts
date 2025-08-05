/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author Vben、ThinkGem
 */
import type { RouteRecordRaw } from 'vue-router';

import { useAppStore } from '/@/store/modules/app';
import { usePermissionStore } from '/@/store/modules/permission';
import { useUserStore } from '/@/store/modules/user';

import { useTabs } from './useTabs';

import { router, resetRouter } from '/@/router';
// import { RootRoute } from '/@/router/routes';

import projectSetting from '/@/settings/projectSetting';
import { PermissionModeEnum } from '/@/enums/appEnum';
import { Authority } from '/@/enums/authorityEnum';

import { intersection } from 'lodash-es';
import { isArray } from '/@/utils/is';
import { useMultipleTabStore } from '/@/store/modules/multipleTab';

// User permissions related operations
export function usePermission() {
  const userStore = useUserStore();
  const appStore = useAppStore();
  const permissionStore = usePermissionStore();
  const { closeAll } = useTabs(router);

  /**
   * Change permission mode
   */
  async function togglePermissionMode() {
    appStore.setProjectConfig({
      permissionMode:
        projectSetting.permissionMode === PermissionModeEnum.BACK
          ? PermissionModeEnum.ROUTE_MAPPING
          : PermissionModeEnum.BACK,
    });
    location.reload();
  }

  /**
   * Reset and regain authority resource information
   * @param id
   */
  async function resume() {
    const tabStore = useMultipleTabStore();
    tabStore.clearCacheTabs();
    resetRouter();
    const routes = await permissionStore.buildRoutesAction();
    routes.forEach((route) => {
      router.addRoute(route as unknown as RouteRecordRaw);
    });
    permissionStore.setLastBuildMenuTime();
    closeAll();
  }

  /**
   * Determine whether there is permission
   */
  function hasPermission(value?: Authority | Authority[] | string | string[], def = true): boolean {
    // Open by default
    if (!value) {
      return def;
    }

    const permMode = projectSetting.permissionMode;

    if ([PermissionModeEnum.ROUTE_MAPPING, PermissionModeEnum.ROLE].includes(permMode)) {
      if (!isArray(value)) {
        return userStore.getAuthority.toString() == value.toString();
      }
      return (intersection(value, userStore.getAuthority) as Authority[]).length > 0;
    }

    if (PermissionModeEnum.BACK === permMode) {
      const permiCodeList = [];

      // if (!isArray(value)) {
      //   return permiCodeList.includes(value);
      // }
      // return (intersection(value, permiCodeList) as string[]).length > 0;

      if (value) {
        const values = !isArray(value) ? [value] : value;
        for (const val of values) {
          if (val && val !== '') {
            const currPermi = val.split(':');
            for (const permi of permiCodeList) {
              if (isPermitted(permi, currPermi)) {
                return true;
              }
            }
          }
        }
      }

      return false;
    }
    return true;
  }

  function isPermitted(permi: string[], currPermi: string[]) {
    for (const i in permi) {
      if (permi[i] !== currPermi[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Change authority
   * @param authority
   */
  async function changeAuthority(authority: Authority): Promise<void> {
    if (projectSetting.permissionMode !== PermissionModeEnum.ROUTE_MAPPING) {
      throw new Error('Please switch PermissionModeEnum to ROUTE_MAPPING mode in the configuration to operate!');
    }

    userStore.setAuthority(authority);
    await resume();
  }

  /**
   * refresh menu data
   */
  async function refreshMenu() {
    resume();
  }

  return { changeAuthority, hasPermission, togglePermissionMode, refreshMenu };
}
