import type { ButtonProps } from 'ant-design-vue/es/button/buttonTypes';
import type { TooltipProps } from 'ant-design-vue/es/tooltip/Tooltip';

import type { Authority } from '@vben/constants';
import type { Fn } from '@vben/types';

export interface PopConfirm {
  title: string;
  okText?: string;
  cancelText?: string;
  confirm: Fn;
  cancel?: Fn;
  icon?: string;
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

export interface ActionItem extends ButtonProps {
  onClick?: Fn;
  label?: string;
  color?: 'error' | 'success' | 'warning';
  icon?: string;
  popConfirm?: PopConfirm;
  disabled?: boolean;
  divider?: boolean;
  // 权限编码控制是否显示
  auth?: Authority | Authority[] | string | string[];
  // 业务控制是否显示
  ifShow?: ((action: ActionItem) => boolean) | boolean;
  tooltip?: string | TooltipProps;
}
