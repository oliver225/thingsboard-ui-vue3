export interface TsValue extends Recordable {
  ts: number;
  value: string;
  count: number;
}

export interface ComparisonTsValue extends Recordable {
  current: TsValue;
  previous: TsValue;
}
