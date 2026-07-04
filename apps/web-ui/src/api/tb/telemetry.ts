/**
 * 遥测 / 属性接口
 * 契约参考:后端 TelemetryController.java(URL 前缀 /api/plugins/telemetry)
 */
import type { AttributeScope, EntityType } from '#/enums';

import { requestClient } from '#/api/request';

/** 实体属性数据(TelemetryController 返回的属性项形态) */
export interface AttributeData {
  key: string;
  lastUpdateTs?: number;
  value: any;
}

/**
 * 读取指定作用域下的全部属性
 * GET /plugins/telemetry/{entityType}/{entityId}/values/attributes/{scope}
 */
export function getEntityAttributes(
  entityType: EntityType | string,
  entityId: string,
  scope: AttributeScope,
  keys?: string[],
) {
  return requestClient.get<AttributeData[]>(
    `/plugins/telemetry/${entityType}/${entityId}/values/attributes/${scope}`,
    { params: keys?.length ? { keys: keys.join(',') } : undefined },
  );
}

/**
 * 保存 / 更新属性(仅 SERVER_SCOPE、SHARED_SCOPE;请求体为 {key: value} 对象)
 * POST /plugins/telemetry/{entityType}/{entityId}/attributes/{scope}
 */
export function saveEntityAttributes(
  entityType: EntityType | string,
  entityId: string,
  scope: AttributeScope.SERVER_SCOPE | AttributeScope.SHARED_SCOPE,
  attributes: Record<string, any>,
) {
  return requestClient.post(
    `/plugins/telemetry/${entityType}/${entityId}/attributes/${scope}`,
    attributes,
  );
}

/**
 * 按 key 列表删除属性
 * DELETE /plugins/telemetry/{entityType}/{entityId}/{scope}?keys=k1,k2
 */
export function deleteEntityAttributes(
  entityType: EntityType | string,
  entityId: string,
  scope: AttributeScope,
  keys: string[],
) {
  return requestClient.delete(
    `/plugins/telemetry/${entityType}/${entityId}/${scope}`,
    {
      params: { keys: keys.join(',') },
    },
  );
}
