/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author Vben、ThinkGem
 */

import type { Authority } from '#/constants';

import { useAccessStore } from '@vben/stores';

import { intersection } from 'lodash-es';

// import { RootRoute } from '/@/router/routes';

// User permissions related operations
export function usePermission() {
  const accessStore = useAccessStore();

  /**
   * Determine whether there is permission
   */
  function hasPermission(
    value?: Authority | Authority[] | string | string[],
    def = true,
  ): boolean {
    // Open by default
    if (!value) {
      return def;
    }

    return (
      (intersection(value, accessStore.accessCodes) as Authority[]).length > 0
    );
  }

  return { hasPermission };
}
