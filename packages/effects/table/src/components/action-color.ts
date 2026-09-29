import type { IconType } from '@vben-core/popup-ui';

import type { ActionItem } from '../types/tableAction';

export function getActionStatus(
  color?: ActionItem['color'],
  danger = false,
): IconType {
  if (danger || color === 'danger') return 'error';
  if (!color || color === 'primary') return 'question';
  return color;
}

/** Use the application's semantic colors for both inline and menu actions. */
export function getActionColor(color?: ActionItem['color'], danger = false) {
  const status = getActionStatus(color, danger);
  if (status === 'error') {
    return 'hsl(var(--destructive))';
  }
  if (status === 'success') return 'hsl(var(--success))';
  if (status === 'warning') return 'hsl(var(--warning))';
  if (status === 'info') return 'hsl(var(--info))';
  return 'hsl(var(--primary-text, var(--primary)))';
}
