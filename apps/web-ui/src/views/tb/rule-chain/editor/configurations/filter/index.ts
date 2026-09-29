import type { NodeFormDefinition } from '../../types';

import { definition as nodeCheckAlarmStatus } from './check-alarm-status';
import { definition as nodeCheckFieldsPresence } from './check-fields-presence';
import { definition as nodeCheckRelationPresence } from './check-relation-presence';
import { definition as nodeEntityTypeFilter } from './entity-type-filter';
import { definition as nodeFilterScript } from './filter-script';
import { definition as nodeGpsGeofencingFilter } from './gps-geofencing-filter';
import { definition as nodeMessageTypeFilter } from './message-type-filter';
import { definition as nodeSwitch } from './switch';

export const filterNodeForms: Record<string, NodeFormDefinition> = {
  'check-alarm-status': nodeCheckAlarmStatus,
  'check-fields-presence': nodeCheckFieldsPresence,
  'entity-type-filter': nodeEntityTypeFilter,
  'message-type-filter': nodeMessageTypeFilter,
  'asset-profile-switch': {},
  'check-relation-presence': nodeCheckRelationPresence,
  'device-profile-switch': {},
  'entity-type-switch': {},
  'message-type-switch': {},
  'gps-geofencing-filter': nodeGpsGeofencingFilter,
  'filter-script': nodeFilterScript,
  switch: nodeSwitch,
};
