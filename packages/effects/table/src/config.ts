import type { BasicTableProps } from './types/table';

import { shallowRef } from 'vue';

import { isPlainObject } from 'es-toolkit/compat';

export type TableConfig = Partial<BasicTableProps>;

const globalConfig = shallowRef<TableConfig>({});

/** Later layers override earlier ones. Query state replaces; other objects merge. */
export function mergeTableConfig(
  ...layers: (TableConfig | undefined)[]
): TableConfig {
  function merge(target: Record<string, any>, source: Record<string, any>) {
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue;
      if (key === 'actionColumn') {
        // 整体替换操作列，避免残留旧列设置、按钮或权限配置。
        target[key] = value;
        continue;
      }
      if (Array.isArray(value)) {
        target[key] = value;
      } else if (isPlainObject(value)) {
        const previous = isPlainObject(target[key]) ? target[key] : {};
        target[key] = merge({ ...previous }, value);
      } else {
        target[key] = value;
      }
    }
    return target;
  }

  const result: TableConfig = {};
  for (const layer of layers) {
    const { searchInfo, ...config } = layer ?? {};
    merge(result, config);
    // Keep live query state, including cleared/removed filters, rather than a merged snapshot.
    if (searchInfo !== undefined) result.searchInfo = searchInfo;
  }
  return result;
}

/** Configure defaults at application startup, before mounting any tables. */
export function setupVbenTable(config: TableConfig) {
  globalConfig.value = mergeTableConfig(globalConfig.value, config);
}

export function getTableConfig(): TableConfig {
  return mergeTableConfig(globalConfig.value);
}
