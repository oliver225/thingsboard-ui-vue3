/**
 * Entity relation enums.
 * Contracts:
 * - org.thingsboard.server.common.data.relation.EntitySearchDirection
 * - org.thingsboard.server.common.data.relation.RelationTypeGroup
 */
import { $t } from '@vben/locales';

/** Relation query direction from the current entity perspective. */
export enum RelationDirection {
  FROM = 'FROM',
  TO = 'TO',
}

/** Relation type group. It participates in the relation unique key. */
export enum RelationTypeGroup {
  COMMON = 'COMMON',
  DASHBOARD = 'DASHBOARD',
  EDGE = 'EDGE',
  EDGE_AUTO_ASSIGN_RULE_CHAIN = 'EDGE_AUTO_ASSIGN_RULE_CHAIN',
  RULE_CHAIN = 'RULE_CHAIN',
  RULE_NODE = 'RULE_NODE',
}

export function relationDirectionOptions(): Array<{
  label: string;
  value: RelationDirection;
}> {
  return [RelationDirection.FROM, RelationDirection.TO].map((value) => ({
    label: $t(`tb.relation.direction.${value}`),
    value,
  }));
}

export function relationTypeGroupLabel(
  value?: RelationTypeGroup | string,
): string {
  if (!value) return '';
  return $t(`tb.relation.typeGroup.${value}`);
}

export function relationTypeGroupOptions(): Array<{
  label: string;
  value: RelationTypeGroup;
}> {
  return [
    RelationTypeGroup.COMMON,
    RelationTypeGroup.DASHBOARD,
    RelationTypeGroup.RULE_CHAIN,
    RelationTypeGroup.RULE_NODE,
    RelationTypeGroup.EDGE,
    RelationTypeGroup.EDGE_AUTO_ASSIGN_RULE_CHAIN,
  ].map((value) => ({
    label: relationTypeGroupLabel(value),
    value,
  }));
}
