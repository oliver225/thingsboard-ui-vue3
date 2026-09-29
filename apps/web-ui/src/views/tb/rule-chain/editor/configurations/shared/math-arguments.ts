export const argumentCounts: Record<string, readonly [number, number]> = {
  CUSTOM: [1, 16],
  ADD: [2, 2],
  SUB: [2, 2],
  MULT: [2, 2],
  DIV: [2, 2],
  SIN: [1, 1],
  SINH: [1, 1],
  COS: [1, 1],
  COSH: [1, 1],
  TAN: [1, 1],
  TANH: [1, 1],
  ACOS: [1, 1],
  ASIN: [1, 1],
  ATAN: [1, 1],
  ATAN2: [2, 2],
  EXP: [1, 1],
  EXPM1: [1, 1],
  SQRT: [1, 1],
  CBRT: [1, 1],
  GET_EXP: [1, 1],
  HYPOT: [2, 2],
  LOG: [1, 1],
  LOG10: [1, 1],
  LOG1P: [1, 1],
  CEIL: [1, 1],
  FLOOR: [1, 1],
  FLOOR_DIV: [2, 2],
  FLOOR_MOD: [2, 2],
  ABS: [1, 1],
  MIN: [2, 2],
  MAX: [2, 2],
  POW: [2, 2],
  SIGNUM: [1, 1],
  RAD: [1, 1],
  DEG: [1, 1],
};
export const argumentNames = [
  'x',
  'y',
  'z',
  'a',
  'b',
  'c',
  'd',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'r',
  's',
  't',
];
export interface MathArgument {
  name: string;
  type: string;
  key: string;
  attributeScope?: string;
  defaultValue?: null | number;
}
export function normalizeArguments(
  args: MathArgument[] = [],
  operation = 'CUSTOM',
): MathArgument[] {
  const [min, max] = argumentCounts[operation] ?? [1, 16];
  const result = args.slice(0, max).map((arg, index) => ({
    ...arg,
    attributeScope: arg.attributeScope ?? 'SERVER_SCOPE',
    name: argumentNames[index] ?? arg.name,
  }));
  while (result.length < min) {
    const name = argumentNames[result.length];
    if (!name) break;
    result.push({
      name,
      type: 'MESSAGE_BODY',
      key: '',
      attributeScope: 'SERVER_SCOPE',
    });
  }
  return result;
}
