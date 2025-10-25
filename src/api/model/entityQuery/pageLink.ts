import { EntityKey } from './keyFilter';
import { AlarmSearchStatus, AlarmSeverity, AlarmStatus } from '/@/enums/alarmEnum';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface EntityDataSortOrder extends Recordable {
  key: EntityKey;
  direction: 'ASC' | 'DESC';
}

export interface EntityDataPageLink extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortOrder?: EntityDataSortOrder;
  dynamic?: boolean;
}

export interface AlarmDataPageLink extends EntityDataPageLink {
  startTs?: number;
  endTs?: number;
  timeWindow?: number;
  typeList?: string[];
  statusList?: Array<AlarmSearchStatus>;
  severityList?: Array<AlarmSeverity>;
  searchPropagatedAlarms?: boolean;
  assigneeId?: EntityId<EntityType.USER>;
}
