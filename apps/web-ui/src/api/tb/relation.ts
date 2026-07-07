import type { EntityType, RelationTypeGroup } from '#/enums';
import type { EntityId } from '#/types/tb';

import { requestClient } from '#/api/request';
import { RelationTypeGroup as RelationTypeGroupEnum } from '#/enums';

export interface EntityRelation {
  additionalInfo?: Record<string, any>;
  from: EntityId;
  to: EntityId;
  type: string;
  typeGroup: RelationTypeGroup | string;
  version?: number;
}

export interface EntityRelationInfo extends EntityRelation {
  fromName?: string;
  toName?: string;
}

export function getRelationInfosByFrom(
  fromType: EntityType | string,
  fromId: string,
  relationTypeGroup: RelationTypeGroup | string = RelationTypeGroupEnum.COMMON,
) {
  return requestClient.get<EntityRelationInfo[]>(
    `/relations/info/from/${fromType}/${fromId}`,
    { params: { relationTypeGroup } },
  );
}

export function getRelationInfosByTo(
  toType: EntityType | string,
  toId: string,
  relationTypeGroup: RelationTypeGroup | string = RelationTypeGroupEnum.COMMON,
) {
  return requestClient.get<EntityRelationInfo[]>(
    `/relations/info/to/${toType}/${toId}`,
    { params: { relationTypeGroup } },
  );
}

export function saveRelation(relation: EntityRelation) {
  return requestClient.post<EntityRelation>('/v2/relation', relation);
}

export function deleteRelation(relation: EntityRelation) {
  return requestClient.delete<EntityRelation>('/v2/relation', {
    params: {
      fromId: relation.from.id,
      fromType: relation.from.entityType,
      relationType: relation.type,
      relationTypeGroup: relation.typeGroup,
      toId: relation.to.id,
      toType: relation.to.entityType,
    },
  });
}
