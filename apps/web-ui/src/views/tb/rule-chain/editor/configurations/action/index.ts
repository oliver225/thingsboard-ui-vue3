import type { NodeFormDefinition } from '../../types';

import { definition as nodeAssignToCustomer } from './assign-to-customer';
import { definition as nodeClearAlarm } from './clear-alarm';
import { definition as nodeCreateAlarm } from './create-alarm';
import { definition as nodeCreateRelation } from './create-relation';
import { definition as nodeDelayDeprecated } from './delay-deprecated';
import { definition as nodeDeleteAttribute } from './delete-attribute';
import { definition as nodeDeleteRelation } from './delete-relation';
import { definition as nodeDeviceProfile } from './device-profile';
import { definition as nodeDeviceState } from './device-state';
import { definition as nodeGenerator } from './generator';
import { definition as nodeGpsGeofencingEvents } from './gps-geofencing-events';
import { definition as nodeLog } from './log';
import { definition as nodeMathFunction } from './math-function';
import { definition as nodeMessageCount } from './message-count';
import { definition as nodePushToCloud } from './push-to-cloud';
import { definition as nodePushToEdge } from './push-to-edge';
import { definition as nodeRestCallReply } from './rest-call-reply';
import { definition as nodeRpcCallReply } from './rpc-call-reply';
import { definition as nodeRpcCallRequest } from './rpc-call-request';
import { definition as nodeSaveAttributes } from './save-attributes';
import { definition as nodeSaveTimeseries } from './save-timeseries';
import { definition as nodeSaveToCustomTable } from './save-to-custom-table';
import { definition as nodeUnassignFromCustomer } from './unassign-from-customer';

export const actionNodeForms: Record<string, NodeFormDefinition> = {
  'assign-to-customer': nodeAssignToCustomer,
  'unassign-from-customer': nodeUnassignFromCustomer,
  'delay-deprecated': nodeDelayDeprecated,
  'device-profile': nodeDeviceProfile,
  'device-state': nodeDeviceState,
  'message-count': nodeMessageCount,
  'push-to-edge': nodePushToEdge,
  'rpc-call-request': nodeRpcCallRequest,
  'rest-call-reply': nodeRestCallReply,
  'rpc-call-reply': nodeRpcCallReply,
  'delete-attribute': nodeDeleteAttribute,
  'clear-alarm': nodeClearAlarm,
  'copy-to-view': {},
  'create-alarm': nodeCreateAlarm,
  'create-relation': nodeCreateRelation,
  'delete-relation': nodeDeleteRelation,
  generator: nodeGenerator,
  'gps-geofencing-events': nodeGpsGeofencingEvents,
  log: nodeLog,
  'math-function': nodeMathFunction,
  'save-attributes': nodeSaveAttributes,
  'save-timeseries': nodeSaveTimeseries,
  'save-to-custom-table': nodeSaveToCustomTable,
  'synchronization-end': {},
  'synchronization-start': {},
  'push-to-cloud': nodePushToCloud,
  'calculated-fields': {},
};
