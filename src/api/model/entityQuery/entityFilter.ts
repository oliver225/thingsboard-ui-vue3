import { EntityFilterType, AliasEntityType } from '/@/enums/queryEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { EntitySearchDirection } from '/@/enums/relationEnum';
import { RelationEntityTypeFilter } from '../baseModel';

export interface AliasEntityId extends EntityId<any> {
  aliasEntityType?: AliasEntityType;
  defaultEntityId?: EntityId<any>;
  toEntityId?: EntityId<any>;
}

export interface EntityFilter extends Recordable {
  type: EntityFilterType;
}

export interface SingleEntityFilter extends EntityFilter {
  singleEntity: AliasEntityId;
}

export interface EntityListFilter extends EntityFilter {
  entityType?: EntityType;
  entityList?: Array<string>;
}

export interface EntityNameFilter extends EntityFilter {
  entityType?: EntityType;
  entityNameFilter?: string;
}

export interface EntityTypeFilter extends EntityFilter {
  entityType: EntityType;
}

export interface AssetTypeFilter extends EntityFilter {
  assetTypes?: Array<string>;
  assetNameFilter?: string;
}

export interface DeviceTypeFilter extends EntityFilter {
  deviceTypes?: Array<string>;
  deviceNameFilter?: string;
}

export interface EdgeTypeFilter extends EntityFilter {
  edgeTypes?: Array<string>;
  edgeNameFilter?: string;
}

export interface EntityViewTypeFilter extends EntityFilter {
  entityViewTypes?: Array<string>;
  entityViewNameFilter?: string;
}

export interface ApiUsageStateFilter extends EntityFilter {
  customerId: EntityId<EntityType.CUSTOMER>;
}

export interface RelationsQueryFilter extends EntityFilter {
  rootEntity?: AliasEntityId;
  isMultiRoot?: boolean;
  multiRootEntitiesType?: EntityType;
  multiRootEntityIds?: Set<string>;
  direction?: EntitySearchDirection;
  filters?: Array<RelationEntityTypeFilter>;
  maxLevel?: number;
  fetchLastLevelOnly?: boolean;
  negate?: boolean;
  prootStateEntity?: boolean;
  defaultStateEntity?: AliasEntityId;
}

export interface AssetSearchQueryFilter extends EntityFilter {
  assetTypes: Array<string>;
}

export interface DeviceSearchQueryFilter extends EntityFilter {
  deviceTypes: Array<string>;
}

export interface EntityViewSearchQueryFilter extends EntityFilter {
  entityViewTypes: Array<string>;
}

export interface EdgeSearchQueryFilter extends EntityFilter {
  edgeTypes: Array<string>;
}
