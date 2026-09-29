import type { EntityId } from '#/types/tb';

import { requestClient } from '#/api/request';
import { RelationDirection, RelationTypeGroup } from '#/enums';

export interface EntityRelation {
  from: EntityId;
  to: EntityId;
  type: string;
  typeGroup: RelationTypeGroup;
  additionalInfo?: unknown;
  version?: number;
}

export interface EntityRelationInfo extends EntityRelation {
  fromName?: string;
  toName?: string;
}

export function getRelations(entityId: EntityId, direction: RelationDirection) {
  return requestClient.get<EntityRelationInfo[]>('/relations/info', {
    params: {
      ...(direction === RelationDirection.FROM
        ? { fromId: entityId.id, fromType: entityId.entityType }
        : { toId: entityId.id, toType: entityId.entityType }),
      relationTypeGroup: RelationTypeGroup.COMMON,
    },
  });
}

export function saveRelation(relation: EntityRelation) {
  return requestClient.post<EntityRelation>('/v2/relation', relation);
}

export function deleteRelation(relation: EntityRelation): Promise<void> {
  return requestClient.delete('/relation', {
    params: {
      fromId: relation.from.id,
      fromType: relation.from.entityType,
      toId: relation.to.id,
      toType: relation.to.entityType,
      relationType: relation.type,
      relationTypeGroup: relation.typeGroup,
    },
  });
}

export function getRelationKey(relation: EntityRelation) {
  return JSON.stringify([
    relation.from.entityType,
    relation.from.id,
    relation.to.entityType,
    relation.to.id,
    relation.typeGroup,
    relation.type,
  ]);
}

export async function deleteRelations(records: EntityRelation[]) {
  const results = await Promise.allSettled(
    records.map((record) => deleteRelation(record)),
  );
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const record = records[index];
    if (record)
      (result.status === 'fulfilled' ? deletedIds : failedIds).push(
        getRelationKey(record),
      );
  });
  return { deletedIds, failedIds };
}
