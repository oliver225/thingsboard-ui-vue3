/* oxlint-disable import/default -- Vite ?worker imports provide default constructors at build time. */
import * as monaco from 'monaco-editor/editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/languages/features/json/json.worker?worker';
import { jsonDefaults } from 'monaco-editor/languages/features/json/register';
import {
  javascriptDefaults,
  ModuleKind,
  ScriptTarget,
} from 'monaco-editor/languages/features/typescript/register';
import TypeScriptWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker';

import { formatProtobuf } from '../formatters/protobuf-formatter';
import { registerFormattingProvider } from '../formatters/provider';
import { formatTbel } from '../formatters/tbel-formatter';
import { registerScriptLanguages } from '../languages/script-languages';

import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/javascript/register';
import 'monaco-editor/languages/definitions/protobuf/register';

// These public entry points are for Monaco 0.56. Do not use the old esm/vs paths.
globalThis.MonacoEnvironment = {
  ...globalThis.MonacoEnvironment,
  getWorker(_workerId, label) {
    if (label === 'typescript' || label === 'javascript')
      return new TypeScriptWorker();
    return label === 'json' ? new JsonWorker() : new EditorWorker();
  },
};

jsonDefaults.setDiagnosticsOptions({
  allowComments: false,
  comments: 'error',
  enableSchemaRequest: false,
  schemas: [],
  trailingCommas: 'error',
  validate: true,
});

javascriptDefaults.setCompilerOptions({
  allowJs: true,
  allowNonTsExtensions: true,
  checkJs: false,
  module: ModuleKind.ESNext,
  // TypeScript's ModuleDetectionKind.Force keeps each function body isolated.
  moduleDetection: 3,
  noEmit: true,
  target: ScriptTarget.ESNext,
});
javascriptDefaults.setDiagnosticsOptions({
  // The stored text is a function body; its real parameters are supplied by TB.
  diagnosticCodesToIgnore: [1108],
  noSemanticValidation: true,
  noSuggestionDiagnostics: true,
  noSyntaxValidation: false,
});

registerFormattingProvider(monaco, 'proto', 'ClangFormat', formatProtobuf);
registerScriptLanguages(monaco);
registerFormattingProvider(monaco, 'tbel', 'TBEL beautifier', formatTbel);

export { monaco };
