/* eslint-disable vue/one-component-per-file */
import type { PropType } from 'vue';

import type { Recordable } from '@vben/types';

import { defineComponent, Transition, TransitionGroup } from 'vue';

import { getSlot } from '#/utils/tsxHelper';

type Mode = 'default' | 'in-out' | 'out-in' | undefined;

export function createSimpleTransition(
  name: string,
  origin = 'top center 0',
  mode?: Mode,
) {
  return defineComponent({
    name,
    props: {
      group: {
        type: Boolean as PropType<boolean>,
        default: false,
      },
      mode: {
        type: String as PropType<Mode>,
        default: mode,
      },
      origin: {
        type: String as PropType<string>,
        default: origin,
      },
    },
    setup(props, { slots, attrs }) {
      const onBeforeEnter = (el: Element) => {
        (el as HTMLElement).style.transformOrigin = props.origin;
      };

      return () => {
        const Tag = props.group ? TransitionGroup : Transition;
        return (
          <Tag
            mode={props.mode}
            name={name}
            {...attrs}
            onBeforeEnter={onBeforeEnter}
          >
            {() => getSlot(slots)}
          </Tag>
        );
      };
    },
  });
}
export function createJavascriptTransition(
  name: string,
  functions: Recordable<any>,
  mode: Mode = 'in-out',
) {
  return defineComponent({
    name,
    props: {
      mode: {
        type: String as PropType<Mode>,
        default: mode,
      },
    },
    setup(props, { attrs, slots }) {
      return () => {
        return (
          <Transition
            mode={props.mode}
            name={name}
            {...attrs}
            onAfterLeave={functions.afterLeave}
            onBeforeEnter={functions.beforeEnter}
            onEnter={functions.enter}
            onLeave={functions.leave}
            onLeaveCancelled={functions.afterLeave}
          >
            {() => getSlot(slots)}
          </Transition>
        );
      };
    },
  });
}
