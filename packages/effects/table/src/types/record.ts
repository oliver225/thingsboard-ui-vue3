// 深层字符串路径：a.b.c 或 a.0.name 等
type DeepStringPath<T, Depth extends any[] = []> = T extends
  | boolean
  | Map<string, any>
  | null
  | number
  | string
  | symbol
  | undefined
  ? never
  : T extends Array<infer U>
    ?
        | `${number}`
        | (Depth['length'] extends 5
            ? never
            : `${number}.${DeepStringPath<U, [...Depth, 0]>}`)
    : T extends object
      ? {
          [K in keyof T & (number | string)]:
            | `${K}`
            | (Depth['length'] extends 5
                ? never
                : `${K}.${DeepStringPath<T[K], [...Depth, 0]>}`);
        }[keyof T & (number | string)]
      : never;

// 深层数组路径：[string | number, ...]
type DeepArrayPath<T, Depth extends any[] = []> = T extends
  | boolean
  | Map<string, any>
  | null
  | number
  | string
  | symbol
  | undefined
  ? never
  : T extends Array<infer U>
    ?
        | [number]
        | (Depth['length'] extends 5
            ? never
            : [number, ...DeepArrayPath<U, [...Depth, 0]>])
    : T extends object
      ? {
          [K in keyof T & (number | string)]:
            | [K]
            | (Depth['length'] extends 5
                ? never
                : [K, ...DeepArrayPath<T[K], [...Depth, 0]>]);
        }[keyof T & (number | string)]
      : never;

// 合并路径类型
type DynamicDataIndex<T> =
  | DeepArrayPath<T>
  | DeepStringPath<T>
  | readonly (DeepStringPath<T> | number)[];

// 判断是否为默认泛型（即未指定具体结构）
type IsDefaultGeneric<T> =
  T extends Record<string, any> ? (unknown extends T ? true : false) : false;

// 表格 DataIndex 类型
export type TableDataIndex<T = any> =
  IsDefaultGeneric<T> extends true
    ? number | readonly (number | string)[] | string
    : DynamicDataIndex<T>;
export type TableRecordable<T = any> = Record<string, T>;

// 表单 Field 类型
export type FormField<T = any> =
  IsDefaultGeneric<T> extends true ? string : DeepStringPath<T>;
export type FormRecordable<T = any> = Record<FormField, T>;
