import { AlarmInfo } from '../../tb/alarm';
import { ComparisonTsValue, TsValue } from './dataType';
import { EntityFilter } from './entityFilter';
import { EntityKey, KeyFilter } from './keyFilter';
import { AlarmDataPageLink, EntityDataPageLink } from './pageLink';
import { AlarmSearchStatus, AlarmSeverity } from '/@/enums/alarmEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { EntityKeyType } from '/@/enums/queryEnum';

export interface EntityCountQuery extends Recordable {
  entityFilter?: EntityFilter;
  keyFilters?: Array<KeyFilter>;
}

export interface AlarmCountQuery extends EntityCountQuery {
  startTs?: number;
  endTs?: number;
  timeWindow?: number;
  typeList?: string[];
  statusList?: Array<AlarmSearchStatus>;
  severityList?: Array<AlarmSeverity>;
  searchPropagatedAlarms?: boolean;
  assigneeId?: EntityId<EntityType.USER>;
}

export interface EntityDataQuery extends EntityCountQuery {
  pageLink?: EntityDataPageLink;
  entityFields?: Array<EntityKey>;
  latestValues?: Array<EntityKey>;
}

export interface AlarmDataQuery extends EntityCountQuery {
  pageLink?: AlarmDataPageLink;
  alarmFields?: Array<EntityKey>;
  entityFields?: Array<EntityKey>;
  latestValues?: Array<EntityKey>;
}

export interface EntityData extends Recordable {
  entityId: EntityId<any>;
  latest: Map<EntityKeyType, Map<string, TsValue>>;
  timeseries: Map<string, Array<TsValue>>;
  aggLatest: Map<number, ComparisonTsValue>;
}

export interface AlarmData extends AlarmInfo {
  entityId: EntityId<any>;
  latest: Map<EntityKeyType, Map<string, TsValue>>;
}
