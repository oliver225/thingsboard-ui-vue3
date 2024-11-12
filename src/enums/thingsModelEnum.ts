export enum DataType {
  int = 'int',
  float = 'float',
  double = 'double',
  enum = 'enum',
  bool = 'bool',
  text = 'text',
  date = 'date',
  json = 'json',
  array = 'array',
}

export enum FunctionType {
  property = 'property',
  service = 'service',
  event = 'event',
}

export const DATA_TYPE_OPTIONS = [
  { value: DataType.int, label: 'int32 (正数型)' },
  { value: DataType.float, label: 'float (单精度浮点型)' },
  { value: DataType.double, label: 'double (双精度浮点型)' },
  { value: DataType.enum, label: 'enum (枚举型)' },
  { value: DataType.bool, label: 'bool (布尔型)' },
  { value: DataType.text, label: 'text (字符串)' },
  { value: DataType.date, label: 'date (时间型)' },
  { value: DataType.json, label: 'json (复合型)' },
  { value: DataType.array, label: 'array (数组)' },
];

export const FUNCTION_TYPE_OPTIONS = [
  { value: FunctionType.property, label: '属性' },
  { value: FunctionType.service, label: '服务' },
  { value: FunctionType.event, label: '事件' },
];


