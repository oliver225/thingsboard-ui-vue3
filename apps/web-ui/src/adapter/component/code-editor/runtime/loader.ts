import type * as Monaco from 'monaco-editor/editor';

let runtimePromise: Promise<typeof Monaco> | undefined;

/** Keep Monaco and its workers out of the initial application bundle. */
export function loadMonaco(): Promise<typeof Monaco> {
  runtimePromise ??= import('./index')
    .then(({ monaco }) => monaco)
    .catch((error: unknown) => {
      runtimePromise = undefined;
      throw error;
    });
  return runtimePromise;
}
