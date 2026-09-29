export interface ImportColumn {
  header: string;
  key: string;
  sample: string;
  type: string;
}

export class ImportFileError extends Error {
  constructor(
    public code: 'empty' | 'format' | 'invalidFile' | 'rowWidth' | 'tooLarge',
    public row = 0,
  ) {
    super(code);
  }
}

/** Parse CSV without converting tokens, IDs or formatted numeric strings. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let closedQuote = false;
  const input = text.replace(/^\uFEFF/, '');
  function finishCell() {
    row.push(cell);
    cell = '';
    closedQuote = false;
  }
  function finishRow() {
    finishCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    row = [];
  }
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += char;
      }
    } else if (char === delimiter) {
      finishCell();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[index + 1] === '\n') index++;
      finishRow();
    } else if (char === '"' && cell === '' && !closedQuote) {
      quoted = true;
    } else {
      if (closedQuote || char === '"') throw new ImportFileError('format');
      cell += char;
    }
  }
  if (quoted) throw new ImportFileError('format');
  if (cell || row.length > 0 || closedQuote) finishRow();
  return rows;
}

export function serializeCsv(rows: string[][], delimiter: string) {
  return rows
    .map((row) =>
      row
        .map((cell) =>
          /["\r\n]/.test(cell) || cell.includes(delimiter)
            ? `"${cell.replaceAll('"', '""')}"`
            : cell,
        )
        .join(delimiter),
    )
    .join('\n');
}

export async function readImportFile(file: File) {
  if (!/\.(?:csv|xlsx|xls)$/i.test(file.name)) {
    throw new ImportFileError('invalidFile');
  }
  if (file.size > 10 * 1024 * 1024) throw new ImportFileError('tooLarge');
  if (/\.csv$/i.test(file.name)) {
    return { csv: await file.text(), sheetName: '', excel: false };
  }
  const { read, utils } = await import('xlsx');
  const workbook = read(await file.arrayBuffer(), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet || !sheetName) throw new ImportFileError('empty');
  return {
    csv: utils.sheet_to_csv(sheet, { FS: ',', RS: '\n', blankrows: false }),
    excel: true,
    sheetName,
  };
}

export function requiresKey(type: string) {
  return ['SERVER_ATTRIBUTE', 'SHARED_ATTRIBUTE', 'TIMESERIES'].includes(type);
}

export function buildImportColumns(
  rows: string[][],
  header: boolean,
  supportedTypes: readonly string[],
): ImportColumn[] {
  const firstRow = rows[0];
  const sample = rows[header ? 1 : 0];
  if (!firstRow || !sample) throw new ImportFileError('empty');
  rows.forEach((row, index) => {
    if (row.length !== firstRow.length)
      throw new ImportFileError('rowWidth', index + 1);
  });
  return firstRow.map((value, index) => {
    const name = header ? value.trim() : '';
    const normalized = name.toUpperCase();
    let type = 'SERVER_ATTRIBUTE';
    if (supportedTypes.includes(normalized)) {
      type = normalized;
    } else if (!header && index === 0) {
      type = 'NAME';
    } else if (!header && index === 1) {
      type = 'TYPE';
    }
    return {
      header: name,
      key: requiresKey(type) ? name : '',
      sample: sample[index] ?? '',
      type,
    };
  });
}

export function validateImportColumns(columns: ImportColumn[]) {
  if (
    !columns.some((column) => column.type === 'NAME') ||
    !columns.some((column) => column.type === 'TYPE')
  ) {
    return 'requiredColumns';
  }
  const seen = new Set<string>();
  const credentials = new Set<string>();
  for (const column of columns) {
    if (requiresKey(column.type) && !column.key.trim()) return 'requiredKey';
    const key = requiresKey(column.type)
      ? `${column.type}:${column.key.trim()}`
      : column.type;
    if (seen.has(key)) return 'duplicateColumn';
    seen.add(key);
    if (column.type.startsWith('MQTT_')) credentials.add('MQTT');
    if (column.type === 'ACCESS_TOKEN' || column.type === 'X509')
      credentials.add(column.type);
  }
  if (credentials.size > 1) return 'mixedCredentials';
  return undefined;
}
