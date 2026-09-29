/**
 * 实体 JSON 导入/导出工具
 */
import { downloadFileFromBlob } from '@vben/utils';

/** 导出时需要剔除的服务端字段 */
const EXPORT_OMIT_KEYS = [
  'id',
  'createdTime',
  'tenantId',
  'customerId',
  'externalId',
  'version',
] as const;

/**
 * 清理实体的服务端字段,得到可导出的纯配置对象。
 */
export function prepareEntityExport<T extends Record<string, any>>(data: T): T {
  const omit = new Set<string>(EXPORT_OMIT_KEYS);
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !omit.has(key)),
  ) as T;
}

/**
 * 清理导入实体的字段,得到可保存的对象。
 */
export function prepareEntityImport<T extends Record<string, any>>(data: T): T {
  const imported = { ...data };
  delete imported.externalId;
  return imported;
}

/**
 * 规范化下载文件名,统一追加 .json 扩展名。
 */
function prepareFilename(name: string): string {
  const base = (name || 'download')
    .toLowerCase()
    .replaceAll(/\s/g, '_')
    .replaceAll(/[\\/:*?"<>|]/g, '_');
  return `${base}.json`;
}

/**
 * 将对象序列化为格式化 JSON 并触发浏览器下载。
 */
export function exportJsonFile(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  const source = new Blob([content], { type: 'application/json' });
  downloadFileFromBlob({ fileName: prepareFilename(filename), source });
}

/**
 * 打开本地文件选择框,读取并解析 JSON 文件。
 * - 用户取消选择时,Promise 保持 pending(不 reject)。
 * - 解析失败时 reject。
 */
export function importJsonFile<T = any>(
  accept = '.json,application/json',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      try {
        const content = await file.text();
        resolve(JSON.parse(content) as T);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    input.click();
  });
}
