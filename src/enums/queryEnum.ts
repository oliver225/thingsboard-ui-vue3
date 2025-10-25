export enum EntityFilterType {
  SINGLE_ENTITY = 'singleEntity',
  ENTITY_LIST = 'entityList',
  ENTITY_NAME = 'entityName',
  ENTITY_TYPE = 'entityType',
  ASSET_TYPE = 'assetType',
  DEVICE_TYPE = 'deviceType',
  ENTITY_VIEW_TYPE = 'entityViewType',
  EDGE_TYPE = 'edgeType',
  RELATIONS_QUERY = 'relationsQuery',
  ASSET_SEARCH_QUERY = 'assetSearchQuery',
  DEVICE_SEARCH_QUERY = 'deviceSearchQuery',
  ENTITY_VIEW_SEARCH_QUERY = 'entityViewSearchQuery',
  EDGE_SEARCH_QUERY = 'edgeSearchQuery',
  API_USAGE_STATE = 'apiUsageState',
}

export enum AliasEntityType {
  CURRENT_CUSTOMER = 'CURRENT_CUSTOMER',
  CURRENT_TENANT = 'CURRENT_TENANT',
  CURRENT_USER = 'CURRENT_USER',
  CURRENT_USER_OWNER = 'CURRENT_USER_OWNER',
}

export enum EntityKeyType {
  TIME_SERIES = 'TIME_SERIES',
  ATTRIBUTE = 'ATTRIBUTE',
  CLIENT_ATTRIBUTE = 'CLIENT_ATTRIBUTE',
  SHARED_ATTRIBUTE = 'SHARED_ATTRIBUTE',
  SERVER_ATTRIBUTE = 'SERVER_ATTRIBUTE',
  ENTITY_FIELD = 'ENTITY_FIELD',
  ALARM_FIELD = 'ALARM_FIELD',
}

export enum DynamicValueSourceType {
  CURRENT_TENANT = 'CURRENT_TENANT',
  CURRENT_CUSTOMER = 'CURRENT_CUSTOMER',
  CURRENT_USER = 'CURRENT_USER',
  CURRENT_DEVICE = 'CURRENT_DEVICE',
}

export enum EntityKeyValueType {
  STRING = 'STRING',
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',
  DATE_TIME = 'DATE_TIME',
}

export enum FilterPredicateType {
  STRING = 'STRING',
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',
  COMPLEX = 'COMPLEX',
}

export enum StringOperation {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
}

export enum NumericOperation {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER = 'GREATER',
  LESS = 'LESS',
  GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
  LESS_OR_EQUAL = 'LESS_OR_EQUAL',
}

export enum BooleanOperation {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
}

export enum ComplexOperation {
  AND = 'AND',
  OR = 'OR',
}
