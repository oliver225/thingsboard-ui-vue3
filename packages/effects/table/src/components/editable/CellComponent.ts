import type { Component } from 'vue';

import type { ComponentType } from '../../types/componentType';
import type { Fn, Recordable } from '../../types/shared';

import { h } from 'vue';

import { Popover } from 'antdv-next';

import { componentMap } from '../../componentMap';

export interface CellComponentProps {
  component: ComponentType;
  rule: boolean;
  popoverOpen: boolean;
  ruleMessage: string;
  getPopupContainer?: Fn;
}

export const CellComponent = (
  {
    component = 'Input',
    rule = true,
    ruleMessage,
    popoverOpen,
  }: any | CellComponentProps,
  { attrs }: { attrs: Recordable },
) => {
  const Comp = componentMap.get(component) as Component;

  const DefaultComp = h(Comp, attrs);
  if (!rule) {
    return DefaultComp;
  }
  return h(
    Popover,
    {
      overlayClassName: 'edit-cell-rule-popover',
      open: !!popoverOpen,
      // ...(getPopupContainer ? { getPopupContainer } : {}),
      placement: 'right',
      autoAdjustOverflow: false,
      getPopupContainer: (trigger: any | HTMLElement) => {
        return trigger?.parentElement;
      },
    },
    {
      default: () => DefaultComp,
      content: () => ruleMessage,
    },
  );
};
