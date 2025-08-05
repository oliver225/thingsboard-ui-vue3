import { RelationsSearchParameters } from '../model/baseModel';
import { RelationTypeGroup } from '/@/enums/relationEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface EntityRelation {
  from?: EntityId<any>;
  to?: EntityId<any>;
  type?: string;
  typeGroup?: RelationTypeGroup;
  additionalInfo?: Recordable;
}

export interface EntityRelationInfo extends EntityRelation {
  fromName?: string;
  toName?: string;
}

export interface RelationParams {
  fromId: string;
  fromType: EntityType;
  toId: string;
  toType: EntityType;
  relationType: string;
  relationTypeGroup?: string;
}

export interface EntityRelationsQuery {
  parameters?: RelationsSearchParameters;
  filters?: Array<{ relationTyp?: string; entityTypes?: Array<EntityType> }>;
}

export function saveRelation(data: EntityRelation | any) {
  return defHttp.postJson<EntityRelation>({
    url: '/api/relation',
    data,
  });
}

export function deleteRelation(params: RelationParams) {
  return defHttp.delete<void>({
    url: '/api/relation',
    params,
  });
}

export function deleteRelations(params: { entityId: string; entityType: EntityType }) {
  return defHttp.delete<void>({
    url: '/api/relations',
    params,
  });
}

export function getRelation(params: RelationParams) {
  return defHttp.get<EntityRelation>({
    url: '/api/relation',
    params,
  });
}

export function findRelationListByFrom(params: { fromId: string; fromType: EntityType }) {
  return defHttp.get<Array<EntityRelation>>({
    url: '/api/relations',
    params,
  });
}

export function findRelationListByFromAndType(params: {
  fromId: string;
  fromType: EntityType;
  relationType: string;
  relationTypeGroup?: string;
}) {
  return defHttp.get<Array<EntityRelation>>({
    url: '/api/relations',
    params,
  });
}

export function findRelationInfoListByFrom(params: {
  fromId: string;
  fromType: EntityType;
  relationTypeGroup?: string;
}) {
  return defHttp.get<Array<EntityRelationInfo>>({
    url: '/api/relations/info',
    params,
  });
}

export function findRelationListByTo(params: { toId: string; toType: EntityType; relationTypeGroup?: string }) {
  return defHttp.get<Array<EntityRelation>>({
    url: '/api/relations',
    params,
  });
}

export function findRelationListByToAndType(params: {
  toId: string;
  toType: EntityType;
  relationType: string;
  relationTypeGroup?: string;
}) {
  return defHttp.get<Array<EntityRelation>>({
    url: '/api/relations',
    params,
  });
}

export function findRelationInfoListByTo(params: { toId: string; toType: EntityType; relationTypeGroup?: string }) {
  return defHttp.get<Array<EntityRelationInfo>>({
    url: '/api/relations/info',
    params,
  });
}

export function findRelationByQuery(data: EntityRelationsQuery | any) {
  return defHttp.postJson<EntityRelation>({
    url: '/api/relations',
    data,
  });
}

export function findRelationInfoByQuery(data: EntityRelationsQuery | any) {
  return defHttp.postJson<EntityRelation>({
    url: '/api/relations/info',
    data,
  });
}
