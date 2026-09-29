/** Keep Monaco implementation types inside the lazy runtime. */
export type CodeEditorLanguage =
  | 'javascript'
  | 'json'
  | 'plaintext'
  | 'protobuf'
  | 'tbel';

export interface ScriptParameter {
  description?: string;
  name: string;
  properties?: ScriptParameter[];
  type?: string;
}

export interface EditorMarker {
  code?: string;
  endColumn: number;
  endLineNumber: number;
  message: string;
  severity: 'error' | 'hint' | 'info' | 'warning';
  source?: string;
  startColumn: number;
  startLineNumber: number;
}

export interface CodeEditorProps {
  ariaLabel?: string;
  disabled?: boolean;
  height?: number | string;
  id?: string;
  language?: CodeEditorLanguage;
  markers?: EditorMarker[];
  minHeight?: number | string;
  minimap?: boolean;
  modelValue?: null | string;
  parameters?: ScriptParameter[];
  placeholder?: string;
  /** Allow viewing, selection and copying; prevent editing, formatting and testing. */
  readonly?: boolean;
  status?: 'error' | 'warning';
  testable?: boolean;
  testDisabled?: boolean;
  testLoading?: boolean;
  /** Left toolbar title. The toolbar-start slot takes precedence. */
  title?: string;
  toolbar?: boolean;
  wordWrap?: 'off' | 'on';
}

export interface CodeEditorApi {
  blur: () => void;
  exitFullscreen: () => void;
  focus: () => void;
  format: () => Promise<void>;
  getModelUri: () => string | undefined;
  getValue: () => string;
  layout: () => void;
  setValue: (value: string) => void;
}

export interface CodeEditorSlots {
  /** Optional title or contextual controls at the start of the toolbar. */
  'toolbar-start'?: () => unknown;
}

export type ScriptLanguage = 'javascript' | 'tbel';

export interface ScriptEditorProps extends Omit<
  CodeEditorProps,
  'language' | 'testable'
> {
  language?: ScriptLanguage;
  testHandler?: (script: string) => Promise<void> | void;
}

export type JsonValue =
  | boolean
  | JsonValue[]
  | null
  | number
  | string
  | { [key: string]: JsonValue };

export interface JsonValidationOptions {
  required?: boolean;
  rootType?: 'any' | 'array' | 'object';
}

export type JsonValidationError =
  | 'arrayRequired'
  | 'invalidJson'
  | 'invalidNumber'
  | 'objectRequired'
  | 'required';

export type JsonValidationResult =
  | { error: JsonValidationError; valid: false }
  | { valid: true; value: JsonValue | undefined };

export interface JsonEditorProps
  extends JsonValidationOptions, Omit<CodeEditorProps, 'language'> {
  /** Disable when the surrounding form renders its own validation message. */
  showValidationMessage?: boolean;
}

export interface JsonEditorApi extends CodeEditorApi {
  /** Throws on an invalid draft. Call validate() first to display errors. */
  getParsedValue: () => JsonValue | undefined;
  validate: () => JsonValidationResult;
}
