import type { ButtonProps, TooltipProps } from 'antdv-next';

import type { IconType } from '@vben-core/popup-ui';

import type { Fn } from './shared';

export interface ActionItem extends Omit<ButtonProps, 'color'> {
  onClick?: Fn;
  label?: string;
  title?: string;
  /** Alert status; danger and primary remain as legacy aliases. */
  color?: 'danger' | 'primary' | IconType;
  icon?: string;
  iconSize?: number;
  popConfirm?: PopConfirm;
  disabled?: boolean;
  divider?: boolean;
  // 权限编码控制是否显示
  auth?: string | string[];
  // 业务控制是否显示
  ifShow?: ((action: ActionItem) => boolean) | boolean;
  tooltip?: string | TooltipProps;
}

export interface PopConfirm {
  title: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  /** When omitted, the action's onClick runs after confirmation. */
  confirm?: Fn;
  cancel?: Fn;
  icon?: string;
  /** Retained for API compatibility; confirmations always use a centered Vben Alert. */
  placement?:
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'left'
    | 'leftBottom'
    | 'leftTop'
    | 'right'
    | 'rightBottom'
    | 'rightTop'
    | 'top'
    | 'topLeft'
    | 'topRight';
}
