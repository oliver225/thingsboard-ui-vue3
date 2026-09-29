import { useAccess } from '@vben/access';

export function usePermission() {
  const { hasAccessByCodes, hasAccessByRoles } = useAccess();
  return {
    hasPermission: (value?: string | string[]) =>
      !value ||
      (Array.isArray(value) && value.length === 0) ||
      hasAccessByCodes(Array.isArray(value) ? value : [value]) ||
      hasAccessByRoles(Array.isArray(value) ? value : [value]),
  };
}
