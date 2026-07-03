import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import { h } from 'vue';

import { VbenTableAction } from '@vben/common-ui';
import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';

import { Image } from 'antdv-next';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        stripe: true,
        size: 'medium',
        height: 'auto',
        minHeight: 180,
        columnConfig: { resizable: true },
        formConfig: { enabled: false },
        filterConfig: { remote: true },
        proxyConfig: {
          response: {
            result: 'data',
            total: 'totalElements',
            list: 'data',
          },

          showActiveMsg: true,
          showResponseMsg: false,
          sort: true,
          filter: true,
        },
        rowConfig: { keyField: 'id.id' },
        round: true,
        showOverflow: true,
        sortConfig: {
          defaultSort: { field: 'createdTime', order: 'desc' },
          remote: true,
        },
        toolbarConfig: { custom: true, refresh: true, zoom: true },
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Image, { src: row[column.field], ...props });
      },
    });

    // 链接列:cellRender: { name: 'CellLink', props: { onClick: (row) => ... } }
    // 文本默认取当前列字段值,也可用 props.text 指定;onClick 回调收到整行数据
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts, params) {
        const { props = {} } = renderOpts;
        const { column, row } = params;
        const { onClick, text } = props;
        return h(
          'a',
          {
            class: 'text-primary cursor-pointer hover:underline',
            onClick: () => onClick?.(row),
          },
          text ?? row[column.field],
        );
      },
    });

    // 操作列:cellRender: { name: 'CellAction', props: { actions: getActionProps } }
    // props.actions 可为「(row) => TableActionProps | ActionItem[]」、ActionItem[] 或不传;
    // 其余写在 props 上的属性(如 align/divider/dropdownActions)照常透传给 VbenTableAction,
    vxeUI.renderer.add('CellAction', {
      renderTableDefault(renderOpts, params) {
        const { props = {} } = renderOpts;
        const { row } = params;
        const { actions, ...rest } = props;
        const resolved = typeof actions === 'function' ? actions(row) : actions;
        const dynamic = Array.isArray(resolved)
          ? { actions: resolved }
          : (resolved ?? {});
        return h(VbenTableAction, { align: 'center', ...rest, ...dynamic });
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T, ComponentType, ComponentPropsMap>>
) => useGrid<T, ComponentType, ComponentPropsMap>(...rest);

export type * from '@vben/plugins/vxe-table';
