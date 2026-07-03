/**
 * 计算字段接口(TENANT_ADMIN)
 * 契约参考:后端 CalculatedFieldController.java
 */
import type { CalculatedFieldType, EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 计算字段实体(org.thingsboard.server.common.data.cf.CalculatedField) */
export interface CalculatedField extends BaseData<EntityType.CALCULATED_FIELD> {
  additionalInfo?: Record<string, any>;
  /** 计算配置(arguments / 表达式 / output 等,详见 CalculatedFieldConfiguration) */
  configuration?: Record<string, any>;
  configurationVersion?: number;
  debugSettings?: Record<string, any>;
  /** 所属实体(设备/资产/设备配置/资产配置/客户) */
  entityId?: EntityId;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
  type: CalculatedFieldType;
}

/** 计算字段信息(CalculatedFieldInfo,列表展示用,含所属实体名称) */
export interface CalculatedFieldInfo extends CalculatedField {
  entityName?: string;
}

/** 租户计算字段分页列表(GET /api/calculatedFields) */
export function getCalculatedFields(pageLink: PageLink) {
  return requestClient.get<PageData<CalculatedFieldInfo>>('/calculatedFields', {
    params: { ...pageLink },
  });
}

/** 计算字段详情(GET /api/calculatedField/{calculatedFieldId}) */
export function getCalculatedFieldById(calculatedFieldId: string) {
  return requestClient.get<CalculatedField>(
    `/calculatedField/${calculatedFieldId}`,
  );
}

/** 保存计算字段(POST /api/calculatedField,带 id 为更新) */
export function saveCalculatedField(calculatedField: CalculatedField) {
  return requestClient.post<CalculatedField>(
    '/calculatedField',
    calculatedField,
  );
}

/** 删除计算字段(DELETE /api/calculatedField/{calculatedFieldId}) */
export function deleteCalculatedField(
  calculatedFieldId: string,
): Promise<void> {
  return requestClient.delete(`/calculatedField/${calculatedFieldId}`);
}
