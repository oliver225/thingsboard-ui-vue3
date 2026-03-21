import { read, utils } from 'xlsx';

export type BulkImportFileSource = 'csv' | 'excel';

export interface BulkImportFileParseResult {
  csvText: string;
  source: BulkImportFileSource;
}

export function parseCsv(text: string, delimiter = ',') {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
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

  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

export async function readBulkImportFile(file: File): Promise<BulkImportFileParseResult> {
  if (isExcelFile(file)) {
    return {
      csvText: await readExcelFileAsCsv(file),
      source: 'excel',
    };
  }

  return {
    csvText: await file.text(),
    source: 'csv',
  };
}

export async function readExcelFileAsCsv(file: File) {
  const data = await readFileAsArrayBuffer(file);
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

function isExcelFile(file: File) {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
}

function readFileAsArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
        return;
      }
      reject(new Error('Failed to read file'));
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
