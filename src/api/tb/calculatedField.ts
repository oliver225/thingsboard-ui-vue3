import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';
import { DebugSettings } from '/#/store';
import { Scope } from '/@/enums/telemetryEnum';

export interface ReferencedEntityKey extends Recordable {
  key: string;
  type: 'TS_LATEST' | 'ATTRIBUTE' | 'TS_ROLLING';
  scope: Scope;
}

export interface Argument extends Recordable {
  refEntityId: EntityId<any>;
  refEntityKey: ReferencedEntityKey;
  defaultValue: string;
  limit: number;
  timeWindow: number;
}

export interface Output extends Recordable {
  name: string;
  type: 'TIME_SERIES' | 'ATTRIBUTES';
  scope?: Scope;
  decimalsByDefault?: number;
}

export interface CalculatedFieldConfiguration extends Recordable {
  type: 'SIMPLE' | 'SCRIPT';
  arguments: Map<string, Argument>;
  expression: string;
  output: Output;
  useLatestTs: boolean;
}

export interface CalculatedField extends BasicModel<EntityType.CALCULATED_FIELD> {
  tenantId: EntityId<EntityType.TENANT>;
  entityId: EntityId<any>;
  type: 'SIMPLE' | 'SCRIPT';
  name: string;
  debugSettings: DebugSettings;
  configurationVersion?: number;
  configuration: CalculatedFieldConfiguration;
}

export function saveCalculatedField(data: CalculatedField | any) {
  return defHttp.postJson<CalculatedField>({
    url: '/api/calculatedField',
    data,
  });
}

export function getCalculatedFieldById(calculatedFieldId: string) {
  return defHttp.get<CalculatedField>({
    url: `/api/calculatedField/${calculatedFieldId}`,
  });
}

export function getCalculatedFieldByEntityId(entityId: EntityId<any>, params: BasicQuery) {
  return defHttp.get<Page<CalculatedField>>({
    url: `/api/${entityId.entityType}/${entityId.id}/calculatedFields`,
    params,
  });
}

export function deleteCalculatedFieldById(calculatedFieldId: string) {
  return defHttp.delete({
    url: `/api/calculatedField/${calculatedFieldId}`,
  });
}

export function getLatestCalculatedFieldDebugEvent(calculatedFieldId: string) {
  return defHttp.get<Recordable>({
    url: `/api/calculatedField/${calculatedFieldId}/debug`,
  });
}

export function testScript(inputParams: any) {
  return defHttp.postJson<Recordable>({
    url: `/api/calculatedField/testScript`,
    data: inputParams,
  });
}
