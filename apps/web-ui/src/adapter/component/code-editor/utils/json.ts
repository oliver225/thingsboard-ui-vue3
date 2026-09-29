import type {
  JsonValidationOptions,
  JsonValidationResult,
  JsonValue,
} from '../types';

function hasNonFiniteNumber(value: JsonValue): boolean {
  if (typeof value === 'number') return !Number.isFinite(value);
  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => hasNonFiniteNumber(item));
  }
  return false;
}

/** Empty optional input is undefined; the JSON literal null remains null. */
export function parseJsonText(
  text: string,
  { required = false, rootType = 'any' }: JsonValidationOptions = {},
): JsonValidationResult {
  if (!text.trim()) {
    return required
      ? { error: 'required', valid: false }
      : { valid: true, value: undefined };
  }
  let value: JsonValue;
  try {
    value = JSON.parse(text) as JsonValue;
    // JSON.parse accepts overflowing exponents; reserializing Infinity loses data.
    if (hasNonFiniteNumber(value)) {
      return { error: 'invalidNumber', valid: false };
    }
  } catch {
    return { error: 'invalidJson', valid: false };
  }
  if (
    rootType === 'object' &&
    (value === null || typeof value !== 'object' || Array.isArray(value))
  ) {
    return { error: 'objectRequired', valid: false };
  }
  if (rootType === 'array' && !Array.isArray(value)) {
    return { error: 'arrayRequired', valid: false };
  }
  return { valid: true, value };
}

/** Suitable for form codec.encode; never silently submits the previous value. */
export function parseJsonTextOrThrow(
  text: string,
  options?: JsonValidationOptions,
): JsonValue | undefined {
  const result = parseJsonText(text, options);
  if (!result.valid)
    throw new SyntaxError(`Invalid JSON draft: ${result.error}`);
  return result.value;
}

/** Suitable for form codec.decode. Undefined means an empty optional field. */
export function stringifyJsonValue(value: JsonValue | undefined): string {
  if (value === undefined) return '';
  // Reject values that JSON.stringify would silently omit or coerce to null.
  const text = JSON.stringify(
    value,
    (_key, item: unknown) => {
      if (
        item === undefined ||
        typeof item === 'function' ||
        typeof item === 'symbol' ||
        (typeof item === 'number' && !Number.isFinite(item))
      ) {
        throw new TypeError('Value cannot be represented as JSON');
      }
      return item;
    },
    2,
  );
  return text;
}
