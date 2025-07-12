import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { Button, Checkbox, Image } from 'ant-design-vue';

import { TableAction } from '#/components/Table';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        size: 'medium',
        // border: true,
        height: 'auto',
        keepSource: true,
        round: true,
        showOverflow: true,
        columnConfig: {
          resizable: true,
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
        toolbarConfig: {
          custom: true,
          export: false,
          // // import: true,
          // refresh: { code: 'query' },
        },
      } as VxeTableGridOptions,
    });

    vxeUI.renderer.add('CellActions', {
      renderTableDefault(renderOpts, params) {
        const { column, $table } = params;
        const { props, options } = renderOpts;

        return h(TableAction, {
          params,
          align: column.align ?? 'center',
          options: options ?? [],
          el: $table.getEl(),
          ...props,
        });
      },
    });

    vxeUI.renderer.add('CellCheckbox', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Checkbox, {
          checked: props?.convert
            ? props.convert(row[column.field])
            : row[column.field],
          onClick: (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
          },
        });
      },
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

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
