/** Preserve the backend's error details when the dialog owns error display. */
export function getScriptTestError(cause: unknown, fallback: string): string {
  if (cause && typeof cause === 'object') {
    const response = Reflect.get(cause, 'response');
    if (response && typeof response === 'object') {
      const body = Reflect.get(response, 'data');
      const message =
        body && typeof body === 'object'
          ? Reflect.get(body, 'message')
          : undefined;
      if (typeof message === 'string' && message.trim()) return message;
    }
    const message = Reflect.get(cause, 'message');
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
