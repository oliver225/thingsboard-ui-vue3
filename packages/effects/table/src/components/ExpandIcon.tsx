import type { Fn, Recordable } from '../types/shared';

import { IconifyIcon } from '@vben/icons';
import { isEmpty } from '@vben/utils';

import { Spin } from 'antdv-next';

export default function createExpandIcon(
  expandCollapse: Fn,
  handleTableExpand: Fn,
  expandedRowRender = false,
) {
  return (props: Recordable) => {
    // if (!props.expandable) {
    //   if (props.needIndentSpaced) {
    //     return <span class="ant-table-row-expand-icon ant-table-row-spaced" />;
    //   } else {
    //     return <span />;
    //   }
    // }
    const { treeLeaf, isLoading, children, childList } = props.record;
    // if (treeLeaf && treeLeaf === '1') {
    //   return <span class="ant-table-row-expand-icon ant-table-row-spaced" />;
    // }
    const leaf = isEmpty(treeLeaf)
      ? isEmpty(children || childList)
      : treeLeaf === '1';
    const leafStyle = leaf
      ? 'margin-left: 1px; margin-right: 7px; opacity: 0.7;'
      : 'margin-right: 8px;';
    return (
      <span
        class="tb-table-expand-icon"
        onClick={async (_e: Event) => {
          if (leaf) return;
          if (expandedRowRender) {
            props.onExpand(props.record, _e);
          } else {
            // 提升展开折叠性能
            const expanded = await expandCollapse(props.record);
            handleTableExpand(expanded, props.record);
          }
        }}
        onDblclick={async (_e: Event) => {
          if (expandedRowRender) return;
          if (children || childList) return;
          // 当没有子节点的时候，尝试强制加载非正常状态的节点
          const expanded = await expandCollapse(props.record, false, true);
          handleTableExpand(expanded, props.record);
        }}
        style={expandedRowRender ? '' : leafStyle}
      >
        {isLoading ? (
          <Spin size="small" />
        ) : (
          <IconifyIcon
            icon={leaf ? 'radix-icons:dot' : 'ion:chevron-forward'}
            style={{
              transform: props.expanded ? 'rotate(90deg)' : undefined,
              transition: 'transform .3s',
            }}
          />
        )}
      </span>
    );
  };
}
