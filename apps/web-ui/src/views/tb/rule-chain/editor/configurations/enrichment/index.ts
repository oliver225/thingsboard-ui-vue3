import type { NodeFormDefinition } from '../../types';

import { definition as nodeCalculateDelta } from './calculate-delta';
import { definition as nodeCustomerAttributes } from './customer-attributes';
import { definition as nodeCustomerDetails } from './customer-details';
import { definition as nodeFetchDeviceCredentials } from './fetch-device-credentials';
import { definition as nodeOriginatorAttributes } from './originator-attributes';
import { definition as nodeOriginatorFields } from './originator-fields';
import { definition as nodeOriginatorTelemetry } from './originator-telemetry';
import { definition as nodeRelatedDeviceAttributes } from './related-device-attributes';
import { definition as nodeRelatedEntityData } from './related-entity-data';
import { definition as nodeTenantAttributes } from './tenant-attributes';
import { definition as nodeTenantDetails } from './tenant-details';

export const enrichmentNodeForms: Record<string, NodeFormDefinition> = {
  'calculate-delta': nodeCalculateDelta,
  'customer-details': nodeCustomerDetails,
  'tenant-details': nodeTenantDetails,
  'fetch-device-credentials': nodeFetchDeviceCredentials,
  'customer-attributes': nodeCustomerAttributes,
  'originator-attributes': nodeOriginatorAttributes,
  'originator-fields': nodeOriginatorFields,
  'originator-telemetry': nodeOriginatorTelemetry,
  'related-device-attributes': nodeRelatedDeviceAttributes,
  'related-entity-data': nodeRelatedEntityData,
  'tenant-attributes': nodeTenantAttributes,
};
