<script lang="ts">
import type { Recordable } from '@vben/types';

import { computed, defineComponent, h, unref } from 'vue';

import { $t } from '@vben/locales';

import { Popconfirm } from 'ant-design-vue';
import { omit } from 'lodash-es';

import { useAttrs } from '#/hooks/core/useAttrs';
import { extendSlots } from '#/utils/tsxHelper';

import BaiceButton from './BasicButton.vue';

const props = {
  /**
   * Whether to enable the drop-down menu
   * @default: true
   */
  enable: {
    type: Boolean,
    default: true,
  },
};

export default defineComponent({
  name: 'PopButton',
  inheritAttrs: false,
  props,
  setup(props, { slots }) {
    const attrs = useAttrs();

    // get inherit binding value
    const getBindValues = computed(() => {
      return Object.assign(
        {
          okText: $t('common.confirm'),
          cancelText: $t('common.cancel'),
          placement: 'left',
        },
        { ...props, ...unref(attrs) },
      );
    });

    return () => {
      const bindValues = omit(unref(getBindValues), 'icon') as Recordable<any>;
      const btnBind = omit(bindValues, 'title') as Recordable<any>;
      if (btnBind.disabled) btnBind.color = '';
      const Button = h(BaiceButton, btnBind, extendSlots(slots));

      // If it is not enabled, it is a normal button
      if (!props.enable) {
        return Button;
      }
      return h(Popconfirm, bindValues, { default: () => Button });
    };
  },
});
</script>
