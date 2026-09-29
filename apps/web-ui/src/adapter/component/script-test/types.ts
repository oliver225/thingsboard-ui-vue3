import type { ArgumentValues } from '../field-arguments/data';

export interface ScriptTestResult {
  error?: string;
  output?: string;
}

/** Test edits update the caller's draft; this component never persists it. */
export interface ScriptTestData {
  functionName?: string;
  testRunner?: (
    expression: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<ScriptTestResult>;
  testArguments?: Record<string, unknown>;
  loadTestArguments?: () => Promise<Record<string, unknown> | undefined>;
  expression: string;
  arguments: ArgumentValues[];
  onApply?: (expression: string) => Promise<void> | void;
}
