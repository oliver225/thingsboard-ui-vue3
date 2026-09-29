import type * as Monaco from 'monaco-editor/editor';

type FormatErrorListener = (error: Error) => void;
type Formatter = (
  source: string,
  options: Monaco.languages.FormattingOptions,
) => Promise<string>;

const errorListeners = new Map<string, FormatErrorListener>();

/** Monaco absorbs provider failures; deliver errors only to the owning model. */
export function onFormatError(modelUri: string, listener: FormatErrorListener) {
  errorListeners.set(modelUri, listener);
  return () => {
    if (errorListeners.get(modelUri) === listener)
      errorListeners.delete(modelUri);
  };
}

/** Shared cancellation, stale-result and error handling for local formatters. */
export function registerFormattingProvider(
  monaco: typeof Monaco,
  language: string,
  displayName: string,
  format: Formatter,
) {
  return monaco.languages.registerDocumentFormattingEditProvider(language, {
    displayName,
    async provideDocumentFormattingEdits(model, options, cancellation) {
      const version = model.getVersionId();
      const source = model.getValue();
      const isCurrent = () =>
        !cancellation.isCancellationRequested &&
        !model.isDisposed() &&
        model.getVersionId() === version;
      if (!isCurrent()) return [];
      try {
        const text = await format(source, options);
        return isCurrent() && text !== source
          ? [{ range: model.getFullModelRange(), text }]
          : [];
      } catch (error) {
        if (isCurrent()) {
          errorListeners.get(model.uri.toString())?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
        return [];
      }
    },
  });
}
