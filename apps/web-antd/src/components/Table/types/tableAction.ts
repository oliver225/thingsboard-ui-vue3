import type { Fn } from '@vueuse/core';
import type { ButtonProps } from 'ant-design-vue';

import type { TippyProps } from '@vben/common-ui';

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
  danger?: boolean;
  color?: 'error' | 'success' | 'warning';
  icon?: string;
  // popConfirm?: PopConfirm;
  disabled?: boolean;
  divider?: boolean;
  // 业务控制是否显示
  ifShow?: ((action: ActionItem) => boolean) | boolean;
  tooltip?: string | TippyProps;
}
