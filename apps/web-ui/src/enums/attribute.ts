/**
 * 实体属性作用域与值类型
 * 契约参考:后端 org.thingsboard.server.common.data.AttributeScope
 */
import { $t } from '@vben/locales';

/** 属性作用域 */
export enum AttributeScope {
  /** 客户端属性:由设备/客户端上报,平台侧只读 */
  CLIENT_SCOPE = 'CLIENT_SCOPE',
  /** 服务端属性:平台侧维护,设备不可见 */
  SERVER_SCOPE = 'SERVER_SCOPE',
  /** 共享属性:平台侧维护并下发给设备 */
  SHARED_SCOPE = 'SHARED_SCOPE',
}

/** 属性作用域选项(顺序:服务端 / 客户端 / 共享,与 Segmented 展示一致) */
export function attributeScopeOptions(): Array<{
  label: string;
  value: AttributeScope;
}> {
  return [
    {
      label: $t('tb.attribute.scope.SERVER_SCOPE'),
      value: AttributeScope.SERVER_SCOPE,
    },
    {
      label: $t('tb.attribute.scope.CLIENT_SCOPE'),
      value: AttributeScope.CLIENT_SCOPE,
    },
    {
      label: $t('tb.attribute.scope.SHARED_SCOPE'),
      value: AttributeScope.SHARED_SCOPE,
    },
  ];
}

/** 客户端属性由设备上报,平台侧不可增删改 */
export function isClientScope(scope: AttributeScope): boolean {
  return scope === AttributeScope.CLIENT_SCOPE;
}

/** 属性值类型(仅用于新增/编辑表单的输入形态) */
export enum AttributeValueType {
  BOOLEAN = 'BOOLEAN',
  DOUBLE = 'DOUBLE',
  INTEGER = 'INTEGER',
  JSON = 'JSON',
  STRING = 'STRING',
}

/** 属性值类型选项 */
export function attributeValueTypeOptions(): Array<{
  label: string;
  value: AttributeValueType;
}> {
  return [
    {
      label: $t('tb.attribute.valueType.STRING'),
      value: AttributeValueType.STRING,
    },
    {
      label: $t('tb.attribute.valueType.INTEGER'),
      value: AttributeValueType.INTEGER,
    },
    {
      label: $t('tb.attribute.valueType.DOUBLE'),
      value: AttributeValueType.DOUBLE,
    },
    {
      label: $t('tb.attribute.valueType.BOOLEAN'),
      value: AttributeValueType.BOOLEAN,
    },
    {
      label: $t('tb.attribute.valueType.JSON'),
      value: AttributeValueType.JSON,
    },
  ];
}

/** 根据已有值推断值类型(编辑回填用) */
export function inferAttributeValueType(value: unknown): AttributeValueType {
  if (typeof value === 'boolean') return AttributeValueType.BOOLEAN;
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? AttributeValueType.INTEGER
      : AttributeValueType.DOUBLE;
  }
  if (value !== null && typeof value === 'object') {
    return AttributeValueType.JSON;
  }
  return AttributeValueType.STRING;
}
