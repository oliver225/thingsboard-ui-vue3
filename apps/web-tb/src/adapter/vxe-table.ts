import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';
import { isFunction } from '@vben/utils';

import { Button, Image } from 'ant-design-vue';

import { TableAction } from '#/components/Table';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        size: 'medium',
        border: true,
        stripe: true, // 斑马纹，
        round: true,
        minHeight: 180,
        showOverflow: true,
        columnConfig: {
          resizable: true,
        },
        rowConfig: {
          id: 'id.id',
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'data',
            total: 'totalElements',
            list: '',
          },
          seq: true,
          showActiveMsg: true,
          showResponseMsg: false,
        },
        sortConfig: {
          defaultSort: { field: 'createdTime', order: 'desc' },
          remote: true,
        },
        remoteConfig: {
          queryMethod: 'query',
        },

        toolbarConfig: {
          custom: true,
          export: true,
          refresh: { code: 'query' },
        },
        exportConfig: {
          filename: 'export',
        },
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        return h(Image, { src: row[column.field] });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'small', type: 'link' },
          { default: () => props?.text },
        );
      },
    });

    // 操作按钮列
    vxeUI.renderer.add('CellAction', {
      renderTableDefault(renderOpts, params) {
        const { row, column } = params;
        const { props } = renderOpts;
        const actions =
          props?.actions && isFunction(props?.actions)
            ? props.actions(row, column)
            : props?.actions;
        const dropDownActions =
          props?.dropDownActions && isFunction(props?.dropDownActions)
            ? props.dropDownActions(row, column)
            : props?.dropDownActions;
        return h(TableAction, {
          ...props,
          align: column.align ?? 'center',
          actions,
          dropDownActions,
        });
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
