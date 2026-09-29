import type * as Monaco from 'monaco-editor/editor';

import type { ScriptLanguage, ScriptParameter } from '../types';

import {
  clearScriptParameters,
  getScriptParameters,
} from './script-parameters';
import { tbelBuiltins } from './tbel-builtins';
import {
  tbelKeywords,
  tbelLanguageConfiguration,
  tbelMonarchLanguage,
} from './tbel-language';

const identifier = String.raw`[$A-Z_a-z\u00a1-\uffff][$\w\u00a1-\uffff]*`;
const navigation = String.raw`(?:\?\.|\.\??)`;
const memberPattern = new RegExp(
  `(${identifier}(?:\\s*${navigation}\\s*${identifier})*)\\s*${navigation}\\s*$`,
);
const expressionPattern = new RegExp(
  `(${identifier}(?:\\s*${navigation}\\s*${identifier})*)$`,
);
const validIdentifier = new RegExp(`^${identifier}$`);
const tokenCache = new WeakMap<
  Monaco.editor.ITextModel,
  {
    language: string;
    tokens: Monaco.Token[][];
    version: number;
  }
>();

function pathSegments(expression: string) {
  return expression.replaceAll(/\s*(?:\?\.|\.\??)\s*/g, '.').split('.');
}

function parameterAtPath(parameters: ScriptParameter[], path: string[]) {
  let parameter: ScriptParameter | undefined;
  let members = parameters;
  for (const name of path) {
    parameter = members.find((item) => item.name === name);
    if (!parameter) return undefined;
    members = parameter.properties ?? [];
  }
  return parameter;
}

function isCodePosition(
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
) {
  let cache = tokenCache.get(model);
  if (
    !cache ||
    cache.version !== model.getVersionId() ||
    cache.language !== model.getLanguageId()
  ) {
    cache = {
      language: model.getLanguageId(),
      tokens: monaco.editor.tokenize(model.getValue(), model.getLanguageId()),
      version: model.getVersionId(),
    };
    tokenCache.set(model, cache);
  }
  const tokens = cache.tokens[position.lineNumber - 1] ?? [];
  const offset = Math.max(0, position.column - 2);
  const token = tokens.findLast((item) => item.offset <= offset);
  return !token || !/comment|string|regexp/.test(token.type);
}

function markdown(value: string): Monaco.IMarkdownString {
  return { value, isTrusted: false, supportHtml: false };
}

export function createScriptCompletionProvider(
  monaco: typeof Monaco,
  language: ScriptLanguage,
): Monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      if (!isCodePosition(monaco, model, position)) return { suggestions: [] };
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const prefix = model
        .getLineContent(position.lineNumber)
        .slice(0, word.startColumn - 1);
      const member = memberPattern.exec(prefix);
      const inMemberAccess = !!member || /[.?]\s*$/.test(prefix);
      const parameters = getScriptParameters(model.uri.toString());
      let candidates = parameters;
      if (inMemberAccess) {
        candidates = member?.[1]
          ? (parameterAtPath(parameters, pathSegments(member[1]))?.properties ??
            [])
          : [];
      }
      const suggestions: Monaco.languages.CompletionItem[] = candidates
        .filter((parameter) => validIdentifier.test(parameter.name))
        .map((parameter) => ({
          label: parameter.name,
          kind: inMemberAccess
            ? monaco.languages.CompletionItemKind.Property
            : monaco.languages.CompletionItemKind.Variable,
          insertText: parameter.name,
          detail: `${parameter.name}: ${parameter.type ?? 'unknown'}`,
          documentation: parameter.description
            ? markdown(parameter.description)
            : undefined,
          range,
          sortText: `0_${parameter.name}`,
        }));
      if (language === 'tbel' && !inMemberAccess) {
        const names = new Set(candidates.map(({ name }) => name));
        for (const builtin of tbelBuiltins) {
          if (names.has(builtin.name)) continue;
          suggestions.push({
            label: builtin.name,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${builtin.name}(${builtin.requiredArguments.map((name, index) => `\${${index + 1}:${name}}`).join(', ')})`,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: builtin.signature,
            documentation: markdown(builtin.description),
            range,
            sortText: `1_${builtin.name}`,
          });
        }
        suggestions.push(
          ...tbelKeywords.map((keyword) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range,
            sortText: `2_${keyword}`,
          })),
        );
      }
      return { suggestions };
    },
  };
}

export function createScriptHoverProvider(
  monaco: typeof Monaco,
  language: ScriptLanguage,
): Monaco.languages.HoverProvider {
  return {
    provideHover(model, position) {
      if (!isCodePosition(monaco, model, position)) return undefined;
      const word = model.getWordAtPosition(position);
      if (!word) return undefined;
      const expression = expressionPattern.exec(
        model.getLineContent(position.lineNumber).slice(0, word.endColumn - 1),
      );
      if (!expression?.[1]) return undefined;
      const path = pathSegments(expression[1]);
      const parameter = parameterAtPath(
        getScriptParameters(model.uri.toString()),
        path,
      );
      const builtin =
        language === 'tbel' && path.length === 1
          ? tbelBuiltins.find(({ name }) => name === word.word)
          : undefined;
      if (!parameter && !builtin) return undefined;
      const signature = parameter
        ? `${path.join('.')}: ${parameter.type ?? 'unknown'}`
        : builtin?.signature;
      const description = parameter?.description ?? builtin?.description;
      return {
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        },
        contents: [
          markdown(
            `\`\`\`${language === 'javascript' ? 'typescript' : 'text'}\n${signature}\n\`\`\``,
          ),
          ...(description ? [markdown(description)] : []),
        ],
      };
    },
  };
}

export function registerScriptLanguages(
  monaco: typeof Monaco,
): Monaco.IDisposable {
  monaco.languages.register({
    id: 'tbel',
    aliases: ['TBEL', 'tbel'],
    extensions: ['.tbel'],
  });
  const registrations: Monaco.IDisposable[] = [
    monaco.languages.setMonarchTokensProvider('tbel', tbelMonarchLanguage),
    monaco.languages.setLanguageConfiguration(
      'tbel',
      tbelLanguageConfiguration,
    ),
    monaco.editor.onWillDisposeModel((model) =>
      clearScriptParameters(model.uri.toString()),
    ),
  ];
  for (const language of ['tbel', 'javascript'] as const) {
    registrations.push(
      monaco.languages.registerCompletionItemProvider(
        language,
        createScriptCompletionProvider(monaco, language),
      ),
      monaco.languages.registerHoverProvider(
        language,
        createScriptHoverProvider(monaco, language),
      ),
    );
  }
  return {
    dispose: () =>
      registrations.forEach((registration) => registration.dispose()),
  };
}
