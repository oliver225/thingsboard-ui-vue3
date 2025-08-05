import { AlarmSeverity, AlarmStatus } from '/@/enums/alarmEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { RelationTypeGroup } from '/@/enums/relationEnum';

export interface Page<T> {
  data: Array<T>;
  hasNext: boolean;
  totalElements: number;
  totalPages: string;
}

export interface BasicModel<T> extends Recordable {
  id: EntityId<T>;
  createdTime: number;
  version?: number;
}

export interface EntityInfo<T> extends Recordable {
  id: EntityId<T>;
  name: string;
}

export interface BasicQuery extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface WidgetTypeQueryParam extends Recordable {
  pageSize: number;
  page: number;
  tenantOnly?: boolean;
  fullSearch?: boolean;
  deprecatedFilter?: string;
  widgetTypeList?: Array<string>;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface DeviceQueryParam extends Recordable {
  pageSize: number;
  page: number;
  type?: string;
  deviceProfileId?: string;
  active?: boolean;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EventQueryParam extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
  startTime: number;
  endTime: number;
  tenantId: string;
}

export interface AuditLogQueryParam extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
  startTime?: number;
  endTime?: number;
  actionTypes?: string; //逗号分隔
}

export interface AlarmQueryParam extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
  startTime?: number;
  endTime?: number;
  assigneeId?: string;
  statusList?: Array<AlarmStatus>;
  severityList?: Array<AlarmSeverity>;
  typeList?: Array<string>;
}

export interface AuditLogQueryParam extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
  startTime?: number;
  endTime?: number;
  actionTypes?: string; //逗号分隔
}

export interface RelationsSearchParameters {
  rootId?: string;
  rootType?: EntityType;
  direction?: 'FROM' | 'TO';
  relationTypeGroup?: RelationTypeGroup;
  maxLevel?: number;
  fetchLastLevelOnly?: boolean;
}

export interface EntitySubtype {
  tenantId?: EntityId<EntityType.TENANT>;
  entityType?: EntityType;
  type?: string;
}
