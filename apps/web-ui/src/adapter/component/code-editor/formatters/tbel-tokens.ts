export interface TbelToken {
  end: number;
  kind: 'comment' | 'identifier' | 'number' | 'operator' | 'string';
  start: number;
  text: string;
}

const numberPattern =
  /^(?:0[xX][\da-fA-F]+[lLiI]?|0[bB][01]+[lLiI]?|0[oO][0-7]+[lLiI]?|(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[dDfFlLiIbB]?)/;
const identifierPattern = /^[$A-Z_a-z\u00A1-\uFFFF][$\w\u00A1-\uFFFF]*/;
const operatorPattern =
  /^(?:>>>=|<<=|>>=|===|!==|>>>|\.\?|\?\.|\?:|==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<|>>|~=|\*\*|->)/;
const closingBracket: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/** Lexical guard for layout changes only; server-side TBEL owns syntax validation. */
export function tokenizeTbel(source: string): TbelToken[] {
  const tokens: TbelToken[] = [];
  const brackets: string[] = [];
  let offset = 0;
  while (offset < source.length) {
    const start = offset;
    const char = source.charAt(offset);
    if (/\s/.test(char)) {
      offset++;
      continue;
    }
    let kind: TbelToken['kind'] = 'operator';
    if (source.startsWith('//', offset)) {
      kind = 'comment';
      offset += 2;
      while (offset < source.length && !/[\r\n]/.test(source.charAt(offset)))
        offset++;
    } else if (source.startsWith('/*', offset)) {
      kind = 'comment';
      const end = source.indexOf('*/', offset + 2);
      if (end === -1) throw new SyntaxError('Unterminated TBEL block comment');
      offset = end + 2;
    } else if (char === '"' || char === "'") {
      kind = 'string';
      offset++;
      let closed = false;
      while (offset < source.length) {
        const current = source.charAt(offset++);
        if (/[\r\n]/.test(current))
          throw new SyntaxError('Unterminated TBEL string');
        if (current === '\\') {
          if (offset >= source.length)
            throw new SyntaxError('Unterminated TBEL string escape');
          // Ace's TBEL mode permits escaped line continuations. Preserve them
          // verbatim; backend TBEL validation decides whether they are valid.
          if (source.startsWith('\r\n', offset)) offset++;
          offset++;
        } else if (current === char) {
          closed = true;
          break;
        }
      }
      if (!closed) throw new SyntaxError('Unterminated TBEL string');
    } else {
      const remaining = source.slice(offset);
      const number = numberPattern.exec(remaining)?.[0];
      const identifier = identifierPattern.exec(remaining)?.[0];
      const operator = operatorPattern.exec(remaining)?.[0];
      if (number) {
        kind = 'number';
        offset += number.length;
      } else if (identifier) {
        kind = 'identifier';
        offset += identifier.length;
      } else {
        offset += operator?.length ?? 1;
        if ('([{'.includes(char)) brackets.push(char);
        else if (
          closingBracket[char] &&
          brackets.pop() !== closingBracket[char]
        ) {
          throw new SyntaxError('Unbalanced TBEL brackets');
        }
      }
    }
    tokens.push({
      start,
      end: offset,
      kind,
      text: source.slice(start, offset),
    });
  }
  if (brackets.length > 0) throw new SyntaxError('Unbalanced TBEL brackets');
  return tokens;
}
