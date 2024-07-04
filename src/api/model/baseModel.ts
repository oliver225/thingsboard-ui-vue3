import type { Result } from '/#/axios';
import { EntityId } from '/#/store';
import { AlarmSeverity, AlarmStatus } from '/@/enums/alarmEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { RelationTypeGroup } from '/@/enums/relationEnum';
export interface Page<T> {
  // pageNo: number;
  // pageSize: number;
  // orderBy: string;
  // count: number;
  // list: T[];
  data: Array<T>;
  hasNext: boolean;
  totalElements: number;
  totalPages: string;
}

export interface BasicModel<T> extends Result, Recordable {
  // id: string;
  // page: Page<T>;
  // isNewRecord: boolean;
  // dataMap: Map<string, any>;
  id: EntityId<T>;
  createdTime?: number;
}

export interface EntityInfo<T> extends Recordable {
  id: EntityId<T>;
  name: string;
}


export interface TreeModel<T> extends BasicModel<T> {
  parentCode?: string; // 父级编码
  parentCodes?: string; // 所有父级编号

  treeNames?: string; // 全节点名

  treeSort?: string; // 排序号
  treeSorts?: string; // 所有排序号

  treeLeaf?: string; // 是否叶子节点
  treeLevel?: number; // 树层次级别（从0开始）

  childList?: T[]; // 子项列表

  isRoot?: boolean; // 是否根节点
  isTreeLeaf?: boolean; // 是否叶子
  isLoading?: boolean; // 是否加载中
}

export interface TreeDataModel {
  id: string;
  pId: string;
  name: string;
  value?: string;
  title?: string;
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
  typeList?: Array<String>;
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


