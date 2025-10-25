import { EntityType } from '/@/enums/entityTypeEnum';

// 通用时间序列/属性值结构
interface TelemetryOrAttributeItem {
  ts: number; // 时间戳（毫秒）
  value: string; // 值（统一为 string，实际使用时可按需转类型）
}

// ENTITY_FIELD：设备基础字段
interface EntityFields {
  name: TelemetryOrAttributeItem;
  additionalInfo: TelemetryOrAttributeItem; // 通常是 JSON 字符串，如 {"gateway":true}
  createdTime: TelemetryOrAttributeItem; // 设备创建时间（可能是秒或毫秒时间戳字符串）
  label: TelemetryOrAttributeItem;
}

// ATTRIBUTE：设备属性（键值对）
interface Attributes {
  Version?: TelemetryOrAttributeItem;
  active_connectors?: TelemetryOrAttributeItem; // 通常是 JSON 数组字符串，如 ["测试MQTT","测试Modbus"]
  active?: TelemetryOrAttributeItem; // "true" / "false"
  [key: string]: TelemetryOrAttributeItem | undefined;
}

// 主数据结构
export interface GatewaySocketData {
  entityId: EntityId<EntityType.DEVICE>;
  latest: {
    ENTITY_FIELD: EntityFields;
    ATTRIBUTE: Attributes;
  };
  timeseries: Record<string, any>; // 或更具体的定义，当前为空对象 {}
  aggLatest: Record<string, any>; // 聚合最新数据，当前为空 {}
  dataMap: Record<string, any>; // 自定义数据映射，当前为空 {}
}
