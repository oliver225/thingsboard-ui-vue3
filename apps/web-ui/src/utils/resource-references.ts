/**
 * 「资源被其他实体引用而无法删除」时的引用列表渲染。
 *
 * 后端删除接口返回 400 + { success:false, references:{ <EntityType>: [{ id, name }] } },
 * 此处把 references 按实体类型分组渲染为列表,供 confirm() 的 content 使用
 */
import type { TbResourceDeleteResult } from '#/api/tb/resource';

import { h } from 'vue';

import { entityTypeLabel } from '#/enums';

export function renderResourceReferences(
  result: TbResourceDeleteResult,
  options: { intro?: string; outro?: string } = {},
) {
  const { intro, outro } = options;
  const groups = Object.entries(result.references ?? {})
    .map(([type, list]) => ({
      label: entityTypeLabel(type),
      names: (list ?? [])
        .map((item) => item?.name)
        .filter((name): name is string => !!name),
    }))
    .filter((group) => group.names.length > 0);

  return () =>
    h('div', { class: 'flex flex-col gap-3 text-sm' }, [
      intro ? h('p', intro) : null,
      h(
        'div',
        { class: 'flex flex-col gap-2 rounded-md border p-3' },
        groups.map((group) =>
          h('div', { class: 'flex gap-2', key: group.label }, [
            h(
              'span',
              { class: 'text-muted-foreground shrink-0 font-medium' },
              `${group.label}:`,
            ),
            h('span', { class: 'break-all' }, group.names.join('、')),
          ]),
        ),
      ),
      outro ? h('p', outro) : null,
    ]);
}
