import type * as Protobuf from 'protobufjs';

interface ProtobufFormattingOptions {
  insertSpaces: boolean;
  tabSize: number;
}

type Formatter = typeof import('@wasm-fmt/clang-format/vite').format;
let formatterPromise: Promise<Formatter> | undefined;
let parserPromise: Promise<typeof Protobuf> | undefined;

function loadParser() {
  parserPromise ??= import('protobufjs').catch((error: unknown) => {
    parserPromise = undefined;
    throw error;
  });
  return parserPromise;
}

function loadFormatter() {
  // The JS wrapper and WASM asset are fetched only on the first format request.
  formatterPromise ??= import('@wasm-fmt/clang-format/vite')
    .then(async ({ default: initialize, format }) => {
      await initialize();
      return format;
    })
    .catch((error: unknown) => {
      formatterPromise = undefined;
      throw error;
    });
  return formatterPromise;
}

function tokens(text: string, protobuf: typeof Protobuf) {
  const tokenizer = protobuf.tokenize(text, false);
  const values: string[] = [];
  let token = tokenizer.next();
  while (token !== null) {
    values.push(token);
    token = tokenizer.next();
  }
  return values;
}

/** Format locally, preserving token order and literal values; never compile imports. */
export async function formatProtobuf(
  source: string,
  { insertSpaces, tabSize }: ProtobufFormattingOptions,
): Promise<string> {
  if (!source.trim()) return source;
  const protobuf = await loadParser();
  // parse() checks source syntax without resolving imports or executing the schema.
  protobuf.parse(source, { keepCase: true });
  const before = tokens(source, protobuf);
  const format = await loadFormatter();
  const indentWidth = Number.isFinite(tabSize)
    ? Math.max(1, Math.trunc(tabSize))
    : 2;
  const formatted = format(
    source,
    'schema.proto',
    JSON.stringify({
      BasedOnStyle: 'Google',
      BreakStringLiterals: false,
      ColumnLimit: 100,
      IndentWidth: indentWidth,
      InsertNewlineAtEOF: true,
      Language: 'Proto',
      ReflowComments: 'Never',
      SortIncludes: 'Never',
      TabWidth: indentWidth,
      UseTab: insertSpaces ? 'Never' : 'ForIndentation',
    }),
  );
  protobuf.parse(formatted, { keepCase: true });
  const after = tokens(formatted, protobuf);
  if (
    before.length !== after.length ||
    before.some((token, index) => token !== after[index])
  ) {
    throw new Error(
      'Formatting would change Protobuf tokens; source preserved',
    );
  }
  return formatted;
}
