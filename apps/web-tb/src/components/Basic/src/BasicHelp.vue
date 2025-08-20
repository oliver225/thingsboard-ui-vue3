<script lang="tsx">
import type { CSSProperties, PropType } from 'vue';

import { computed, defineComponent, unref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { isString } from '@vben/utils';

import { Tooltip } from 'ant-design-vue';
import { isArray } from 'lodash-es';

import { getPopupContainer } from '#/utils';
import { getSlot } from '#/utils/tsxHelper';

const props = {
  /**
   * Help text max-width
   * @default: 600px
   */
  maxWidth: { type: String, default: '600px' },
  /**
   * Whether to display the serial number
   * @default: false
   */
  showIndex: { type: Boolean },
  /**
   * Help text font color
   * @default: #ffffff
   */
  color: { type: String, default: '#ffffff' },
  /**
   * Help text font size
   * @default: 14px
   */
  fontSize: { type: String, default: '14px' },
  /**
   * Help text list
   */
  placement: { type: String, default: 'right' },
  /**
   * Help text list
   */
  text: { type: [Array, String] as PropType<string | string[]> },
};

export default defineComponent({
  name: 'BasicHelp',
  components: { IconifyIcon, Tooltip },
  props,
  setup(props, { slots }) {
    const prefixCls = 'basic-help';

    const getTooltipStyle = computed(
      (): CSSProperties => ({ color: props.color, fontSize: props.fontSize }),
    );

    const getOverlayStyle = computed(
      (): CSSProperties => ({ maxWidth: props.maxWidth }),
    );

    function renderTitle() {
      const textList = props.text;

      if (isString(textList)) {
        return <p>{textList}</p>;
      }

      if (isArray(textList)) {
        return textList.map((text, index) => {
          return (
            <p key={text}>
              <>
                {props.showIndex ? `${index + 1}. ` : ''}
                {text}
              </>
            </p>
          );
        });
      }
      return null;
    }

    return () => {
      return (
        <Tooltip
          autoAdjustOverflow={true}
          getPopupContainer={() => getPopupContainer()}
          overlayClassName={`${prefixCls}__wrap`}
          overlayStyle={unref(getOverlayStyle)}
          placement={props.placement as 'right'}
          title={<div style={unref(getTooltipStyle)}>{renderTitle()}</div>}
        >
          <span class={prefixCls}>
            {getSlot(slots) || (
              <IconifyIcon icon="i-ant-design:question-circle-outlined" />
            )}
          </span>
        </Tooltip>
      );
    };
  },
});
</script>
<style lang="less">
.basic-help {
  display: inline-block;
  font-size: 13px;
  // color: @text-color-help-dark;
  vertical-align: middle;
  cursor: pointer;

  &:hover {
    color: hsl(var(--primary));
  }

  &__wrap {
    p {
      margin-bottom: 0;
    }
  }
}

.ant-form-item-label .basic-help {
  vertical-align: baseline;
  margin-left: -7px;
  margin-right: -4px;
  opacity: 0.8;
}
</style>
