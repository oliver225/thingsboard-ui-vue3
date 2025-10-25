import {
  BooleanOperation,
  ComplexOperation,
  DynamicValueSourceType,
  EntityKeyType,
  EntityKeyValueType,
  FilterPredicateType,
  NumericOperation,
  StringOperation,
} from '/@/enums/queryEnum';

export interface EntityKey extends Recordable {
  type: EntityKeyType;
  key: string;
}

export interface DynamicValue<T> extends Recordable {
  resolvedValue?: T;
  sourceType?: DynamicValueSourceType;
  sourceAttribute?: string;
  inherit?: boolean;
}

export interface FilterPredicateValue<T> extends Recordable {
  defaultValue: T;
  userValue?: T;
  dynamicValue?: DynamicValue<T>;
}

export interface KeyFilterPredicate extends Recordable {
  type: FilterPredicateType;
}
export interface StringFilterPredicate extends KeyFilterPredicate {
  operation: StringOperation;
  value: FilterPredicateValue<string>;
  ignoreCase?: boolean;
}

export interface NumericFilterPredicate extends KeyFilterPredicate {
  operation: NumericOperation;
  value: FilterPredicateValue<number>;
}

export interface BooleanFilterPredicate extends KeyFilterPredicate {
  operation: BooleanOperation;
  value: FilterPredicateValue<boolean>;
}

export interface ComplexFilterPredicate extends KeyFilterPredicate {
  operation: ComplexOperation;
  predicates: Array<KeyFilterPredicate>;
}

export interface KeyFilter extends Recordable {
  key: EntityKey;
  valueType: EntityKeyValueType;
  predicate: KeyFilterPredicate;
}
