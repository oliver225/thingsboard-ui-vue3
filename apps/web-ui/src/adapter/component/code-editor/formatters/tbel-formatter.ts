import { tokenizeTbel } from './tbel-tokens';

interface Replacement {
  end: number;
  start: number;
  text: string;
}
interface ProtectedToken {
  delimiters?: readonly [string, string];
  text: string;
}
const operatorDelimiters = new Map<string, readonly [string, string]>([
  ['.?', ['.', '.']],
  ['?:', ['?', ':']],
  ['~=', ['+', '+']],
]);
type Beautifier = typeof import('js-beautify/js/lib/beautify.js').js_beautify;
let beautifierPromise: Promise<Beautifier> | undefined;

function loadBeautifier() {
  // Same browser-only bundle/version as ThingsBoard ui-ngx's beautifyJs.
  beautifierPromise ??= import('js-beautify/js/lib/beautify.js')
    .then(({ js_beautify }) => js_beautify)
    .catch((error: unknown) => {
      beautifierPromise = undefined;
      throw error;
    });
  return beautifierPromise;
}

function replace(source: string, replacements: Replacement[]) {
  return replacements.reduceRight(
    (text, replacement) =>
      text.slice(0, replacement.start) +
      replacement.text +
      text.slice(replacement.end),
    source,
  );
}

/** TBEL layout only. No JavaScript parser or JavaScript diagnostics are involved. */
export async function formatTbel(
  source: string,
  options: { insertSpaces: boolean; tabSize: number },
): Promise<string> {
  if (!source.trim()) return source;
  const originalTokens = tokenizeTbel(source);
  let prefix = '__TBEL_FORMAT_';
  while (source.includes(prefix)) prefix += '_';
  const protectedTokens = new Map<string, ProtectedToken>();
  const replacements: Replacement[] = [];
  for (const token of originalTokens) {
    const delimiters = operatorDelimiters.get(token.text);
    if (token.kind !== 'number' && !delimiters) continue;
    const name = `${prefix}${protectedTokens.size}__`;
    protectedTokens.set(name, { delimiters, text: token.text });
    replacements.push({
      start: token.start,
      end: token.end,
      text: delimiters ? `${delimiters[0]} ${name} ${delimiters[1]}` : name,
    });
  }
  const beautify = await loadBeautifier();
  const layout = beautify(replace(source, replacements), {
    brace_style: 'collapse',
    end_with_newline: true,
    eol: source.includes('\r\n') ? '\r\n' : '\n',
    indent_size: Number.isFinite(options.tabSize)
      ? Math.max(1, Math.trunc(options.tabSize))
      : 2,
    indent_with_tabs: !options.insertSpaces,
    preserve_newlines: true,
    unescape_strings: false,
    wrap_line_length: 0,
  });
  const layoutTokens = tokenizeTbel(layout);
  const restorations: Replacement[] = [];
  for (const [index, token] of layoutTokens.entries()) {
    const original = protectedTokens.get(token.text);
    if (!original) continue;
    if (original.delimiters) {
      const before = layoutTokens[index - 1];
      const after = layoutTokens[index + 1];
      if (
        !before ||
        !after ||
        before.text !== original.delimiters[0] ||
        after.text !== original.delimiters[1]
      ) {
        throw new Error('Could not preserve a TBEL operator while formatting');
      }
      restorations.push({
        start: before.start,
        end: after.end,
        text: original.text,
      });
    } else {
      restorations.push({
        start: token.start,
        end: token.end,
        text: original.text,
      });
    }
  }
  let formatted = replace(layout, restorations);
  const resultTokens = tokenizeTbel(formatted);
  if (resultTokens.length !== originalTokens.length)
    throw new Error('Formatting would change TBEL tokens; source preserved');
  const commentRestorations: Replacement[] = [];
  for (const [index, token] of resultTokens.entries()) {
    const original = originalTokens[index];
    if (!original || original.kind !== token.kind)
      throw new Error('Formatting would change TBEL tokens; source preserved');
    if (original.kind === 'comment') {
      // Beautify may align block-comment interiors; retain the author's text.
      if (original.text !== token.text)
        commentRestorations.push({
          start: token.start,
          end: token.end,
          text: original.text,
        });
    } else if (original.text !== token.text) {
      throw new Error('Formatting would change TBEL tokens; source preserved');
    }
  }
  formatted = replace(formatted, commentRestorations);
  return formatted;
}
