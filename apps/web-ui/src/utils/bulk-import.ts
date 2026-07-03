/**
 * 批量导入文件解析工具(CSV 手写解析 + Excel 经 xlsx 转 CSV)
 * 移植自旧版 gitee-vip src/utils/bulkImport.ts。
 */
import { read, utils } from 'xlsx';

export type BulkImportFileSource = 'csv' | 'excel';

export interface BulkImportFileParseResult {
  csvText: string;
  source: BulkImportFileSource;
}

/** 解析 CSV 文本为二维数组(支持引号转义) */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && delimiter && text.startsWith(delimiter, i)) {
      row.push(cell.trim());
      cell = '';
      i += delimiter.length - 1;
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.xlsx') || name.endsWith('.xls');
}

/** 读取 Excel 首个工作表并转换为 CSV 文本 */
export async function readExcelFileAsCsv(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const workbook = read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel workbook is empty');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  return utils.sheet_to_csv(worksheet, {
    FS: ',',
    RS: '\n',
    blankrows: false,
  });
}

/** 读取上传文件:Excel 转 CSV,CSV 直接读文本 */
export async function readBulkImportFile(
  file: File,
): Promise<BulkImportFileParseResult> {
  if (isExcelFile(file)) {
    return { csvText: await readExcelFileAsCsv(file), source: 'excel' };
  }
  return { csvText: await file.text(), source: 'csv' };
}
