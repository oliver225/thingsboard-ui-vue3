import type { Fn } from './shared';

export interface DropMenu {
  onClick?: Fn;
  to?: string;
  icon?: string;
  event: number | string;
  text: string;
  disabled?: boolean;
  divider?: boolean;
}
